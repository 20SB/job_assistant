import { z } from "zod";

export const generateCsvSchema = z.object({
  batchId: z.string().uuid(),
  sendEmail: z.boolean().default(false),
});

export const listExportsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
