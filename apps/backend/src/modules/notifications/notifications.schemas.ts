import { z } from "zod";

const notificationFrequencyValues = ["hourly", "daily", "weekly"] as const;

// ── Preferences schemas (one-to-one with user) ──────────────────────────────

export const createPreferencesSchema = z.object({
  matchEmailFrequency: z.enum(notificationFrequencyValues).default("daily"),
  subscriptionEmails: z.boolean().default(true),
  paymentEmails: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

export const updatePreferencesSchema = z
  .object({
    matchEmailFrequency: z.enum(notificationFrequencyValues).optional(),
    subscriptionEmails: z.boolean().optional(),
    paymentEmails: z.boolean().optional(),
    marketingEmails: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// ── Notification listing ─────────────────────────────────────────────────────

const notificationTypeValues = [
  "match_batch",
  "subscription_renewal",
  "payment_failure",
  "welcome",
  "password_reset",
] as const;

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(notificationTypeValues).optional(),
});
