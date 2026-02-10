import { z } from "zod";

/** Query params for listing/searching jobs */
export const listJobsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  remote: z.enum(["true", "false"]).optional(),
  category: z.string().optional(),
});

/** Body for triggering a manual fetch */
export const triggerFetchSchema = z.object({
  roles: z.array(z.string().min(1)).min(1, "At least one role is required"),
  locations: z.array(z.string().min(1)).optional(),
  maxPages: z.coerce.number().int().min(1).max(10).default(1),
});
