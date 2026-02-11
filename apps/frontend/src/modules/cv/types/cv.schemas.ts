import { z } from 'zod';

/**
 * Zod schema for Cv
 * Used for runtime validation of API responses
 */
export const cvSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Zod schema for form data
 */
export const cvFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
