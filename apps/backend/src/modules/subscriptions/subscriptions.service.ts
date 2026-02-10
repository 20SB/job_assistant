import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  subscriptionPlans,
  userSubscriptions,
  payments,
} from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { NotFound, Conflict, BadRequest } from "../../lib/errors.js";

// ── Plans ──────────────────────────────────────────────────────────────────

export async function listPlans() {
  return db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.priceMonthly);
}

export async function getPlanById(planId: string) {
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .limit(1);

  if (!plan) {
    throw NotFound("Plan not found");
  }

  return plan;
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export async function subscribe(userId: string, planId: string) {
  // Verify plan exists and is active
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, true)))
    .limit(1);

  if (!plan) {
    throw NotFound("Plan not found or inactive");
  }

  // Check if user already has an active subscription
  const [existing] = await db
    .select({ id: userSubscriptions.id, status: userSubscriptions.status })
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (existing) {
    throw Conflict("You already have an active subscription. Cancel it first to switch plans.");
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Free plan → auto-activate; Paid plans → active (Razorpay integration will gate this later)
  const isFree = plan.name === "free";

  const [subscription] = await db
    .insert(userSubscriptions)
    .values({
      userId,
      planId,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    })
    .returning();

  // Create a payment record
  const amount = plan.priceMonthly;
  if (!isFree) {
    await db.insert(payments).values({
      userId,
      subscriptionId: subscription.id,
      amount,
      currency: plan.currency,
      status: "pending",
    });
  }

  logger.info(
    { userId, planId, subscriptionId: subscription.id, planName: plan.name },
    "User subscribed",
  );

  return { subscription, plan };
}

export async function getMySubscription(userId: string) {
  const [subscription] = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (!subscription) {
    throw NotFound("No active subscription found");
  }

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscription.planId))
    .limit(1);

  return { subscription, plan };
}

export async function cancelSubscription(userId: string) {
  const [subscription] = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (!subscription) {
    throw NotFound("No active subscription to cancel");
  }

  const [updated] = await db
    .update(userSubscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.id, subscription.id))
    .returning();

  logger.info(
    { userId, subscriptionId: subscription.id },
    "Subscription cancelled",
  );

  return updated;
}

export async function listPayments(userId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

// ── Feature gating helper ──────────────────────────────────────────────────

export async function getUserPlan(userId: string) {
  const [subscription] = await db
    .select({
      planId: userSubscriptions.planId,
      status: userSubscriptions.status,
      currentPeriodEnd: userSubscriptions.currentPeriodEnd,
    })
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (!subscription) {
    return null;
  }

  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscription.planId))
    .limit(1);

  return plan ?? null;
}
