import { z } from "zod";

export const listTasksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["job_fetch", "matching", "csv_generation", "email_delivery"]).optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed", "retrying"]).optional(),
});
