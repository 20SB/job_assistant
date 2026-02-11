import { z } from 'zod';

/**
 * Zod schema for Notifications
 * Used for runtime validation of API responses
 */
export const notificationsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Zod schema for form data
 */
export const notificationsFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
