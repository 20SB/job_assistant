import { z } from "zod";

// Pagination schema for list endpoints
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Users list query params
export const usersQuerySchema = z.object({
  ...paginationSchema.shape,
  search: z.string().optional(),
  role: z.enum(["user", "admin"]).optional(),
  emailVerified: z.enum(["pending", "verified"]).optional(),
  isActive: z.coerce.boolean().optional(),
});

// Job fetch logs query params
export const jobFetchLogsQuerySchema = z.object({
  ...paginationSchema.shape,
  status: z.enum(["pending", "in_progress", "completed", "failed", "retrying"]).optional(),
  source: z.enum(["adzuna"]).optional(),
});

// Matching logs query params
export const matchingLogsQuerySchema = z.object({
  ...paginationSchema.shape,
  userId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  level: z.enum(["info", "warn", "error"]).optional(),
});

// Email delivery logs query params
export const emailDeliveryLogsQuerySchema = z.object({
  ...paginationSchema.shape,
  userId: z.string().uuid().optional(),
  status: z.string().optional(),
});

// Task queue query params
export const taskQueueQuerySchema = z.object({
  ...paginationSchema.shape,
  type: z.enum(["job_fetch", "matching", "csv_generation", "email_delivery"]).optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed", "retrying"]).optional(),
});

export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type JobFetchLogsQuery = z.infer<typeof jobFetchLogsQuerySchema>;
export type MatchingLogsQuery = z.infer<typeof matchingLogsQuerySchema>;
export type EmailDeliveryLogsQuery = z.infer<typeof emailDeliveryLogsQuerySchema>;
export type TaskQueueQuery = z.infer<typeof taskQueueQuerySchema>;
