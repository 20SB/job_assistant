import { z } from "zod";

export const subscribeSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(500).optional(),
});
