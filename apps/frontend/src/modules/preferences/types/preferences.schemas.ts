import { z } from 'zod';

/**
 * Zod schema for Preferences
 * Used for runtime validation of API responses
 */
export const preferencesSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Zod schema for form data
 */
export const preferencesFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
