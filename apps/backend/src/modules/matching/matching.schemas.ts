import { z } from "zod";

const triggerValues = ["new_job", "cv_updated", "preferences_updated", "scheduled"] as const;

export const runMatchingSchema = z.object({
  trigger: z.enum(triggerValues).default("scheduled"),
});

export const listMatchesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  minPercentage: z.coerce.number().min(0).max(100).optional(),
  shortlistedOnly: z.enum(["true", "false"]).optional(),
});
