import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  notifications,
  notificationPreferences,
  emailDeliveryLogs,
  users,
} from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { NotFound, Conflict } from "../../lib/errors.js";
import { sendEmail } from "../../lib/email.js";

// ── Types ────────────────────────────────────────────────────────────────────

type NotificationType =
  | "match_batch"
  | "subscription_renewal"
  | "payment_failure"
  | "welcome"
  | "password_reset";

interface NotifyOptions {
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
  batchId?: string;
  csvExportId?: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

// ── Notification Preferences CRUD ────────────────────────────────────────────

interface CreatePreferencesInput {
  matchEmailFrequency?: "hourly" | "daily" | "weekly";
  subscriptionEmails?: boolean;
  paymentEmails?: boolean;
  marketingEmails?: boolean;
}

type UpdatePreferencesInput = Partial<CreatePreferencesInput>;

export async function createPreferences(
  userId: string,
  input: CreatePreferencesInput,
) {
  const [existing] = await db
    .select({ id: notificationPreferences.id })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (existing) {
    throw Conflict(
      "Notification preferences already exist. Use PATCH to update.",
    );
  }

  const [prefs] = await db
    .insert(notificationPreferences)
    .values({
      userId,
      matchEmailFrequency: input.matchEmailFrequency ?? "daily",
      subscriptionEmails: input.subscriptionEmails ?? true,
      paymentEmails: input.paymentEmails ?? true,
      marketingEmails: input.marketingEmails ?? false,
    })
    .returning();

  logger.info({ userId }, "Notification preferences created");
  return prefs;
}

export async function getPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (!prefs) {
    throw NotFound("Notification preferences not found");
  }

  return prefs;
}

export async function updatePreferences(
  userId: string,
  input: UpdatePreferencesInput,
) {
  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (!existing) {
    throw NotFound("Notification preferences not found. Create them first.");
  }

  const [updated] = await db
    .update(notificationPreferences)
    .set({
      ...(input.matchEmailFrequency !== undefined && {
        matchEmailFrequency: input.matchEmailFrequency,
      }),
      ...(input.subscriptionEmails !== undefined && {
        subscriptionEmails: input.subscriptionEmails,
      }),
      ...(input.paymentEmails !== undefined && {
        paymentEmails: input.paymentEmails,
      }),
      ...(input.marketingEmails !== undefined && {
        marketingEmails: input.marketingEmails,
      }),
      updatedAt: new Date(),
    })
    .where(eq(notificationPreferences.userId, userId))
    .returning();

  logger.info({ userId }, "Notification preferences updated");
  return updated;
}

export async function deletePreferences(userId: string) {
  const [existing] = await db
    .select({ id: notificationPreferences.id })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (!existing) {
    throw NotFound("Notification preferences not found");
  }

  await db
    .delete(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  logger.info({ userId }, "Notification preferences deleted");
  return { message: "Notification preferences deleted successfully" };
}

// ── List notifications ───────────────────────────────────────────────────────

interface ListNotificationsParams {
  page: number;
  limit: number;
  type?: NotificationType;
}

export async function listNotifications(
  userId: string,
  params: ListNotificationsParams,
) {
  const conditions: SQL[] = [eq(notifications.userId, userId)];
  if (params.type) {
    conditions.push(eq(notifications.type, params.type));
  }

  const offset = (params.page - 1) * params.limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(params.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(...conditions)),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function getNotification(userId: string, notificationId: string) {
  const [notif] = await db
    .select()
    .from(notifications)
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
    )
    .limit(1);

  if (!notif) {
    throw NotFound("Notification not found");
  }

  return notif;
}

// ── Core notify function (used by other modules) ─────────────────────────────

export async function notify(
  userId: string,
  type: NotificationType,
  options: NotifyOptions,
) {
  // Fetch user email
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    logger.warn({ userId, type }, "Cannot notify — user not found");
    return null;
  }

  // Check notification preferences (opt-in flags)
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (prefs) {
    if (type === "subscription_renewal" && !prefs.subscriptionEmails) {
      logger.info({ userId, type }, "Notification skipped — user opted out");
      return null;
    }
    if (type === "payment_failure" && !prefs.paymentEmails) {
      logger.info({ userId, type }, "Notification skipped — user opted out");
      return null;
    }
  }

  // Create notification record
  const [notif] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      subject: options.subject,
      body: options.html,
      metadata: options.metadata as unknown as Record<string, unknown>,
      emailTo: user.email,
      emailStatus: "pending",
      batchId: options.batchId ?? null,
      csvExportId: options.csvExportId ?? null,
    })
    .returning();

  // Attempt email delivery
  let emailStatus = "sent";
  let emailError: string | null = null;
  const sentAt = new Date();

  try {
    await sendEmail({
      to: user.email,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
  } catch (err) {
    emailStatus = "failed";
    emailError = err instanceof Error ? err.message : "Unknown error";
    logger.error(
      { userId, notificationId: notif.id, error: emailError },
      "Email delivery failed",
    );
  }

  // Update notification with email status
  await db
    .update(notifications)
    .set({
      emailStatus,
      emailSentAt: emailStatus === "sent" ? sentAt : null,
      emailError,
      updatedAt: new Date(),
    })
    .where(eq(notifications.id, notif.id));

  // Log delivery to emailDeliveryLogs
  await db.insert(emailDeliveryLogs).values({
    notificationId: notif.id,
    userId,
    emailTo: user.email,
    subject: options.subject,
    status: emailStatus,
    provider: "nodemailer",
    errorMessage: emailError,
    sentAt: emailStatus === "sent" ? sentAt : null,
  });

  logger.info(
    { userId, notificationId: notif.id, type, emailStatus },
    "Notification processed",
  );

  return notif;
}
