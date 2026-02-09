import { z } from "zod";

const seniorityValues = [
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "principal",
  "executive",
] as const;

export const createCvSchema = z.object({
  rawCvText: z.string().min(1, "CV text is required"),
  inputMethod: z.enum(["text", "form", "pdf"]).default("text"),
  parsedSkills: z.array(z.string()).optional(),
  parsedRoles: z.array(z.string()).optional(),
  parsedTools: z.array(z.string()).optional(),
  experienceYears: z.coerce.number().min(0).max(50).optional(),
  seniority: z.enum(seniorityValues).optional(),
  parsedData: z.record(z.string(), z.unknown()).optional(),
});

export const updateCvSchema = z
  .object({
    rawCvText: z.string().min(1, "CV text cannot be empty").optional(),
    parsedSkills: z.array(z.string()).optional(),
    parsedRoles: z.array(z.string()).optional(),
    parsedTools: z.array(z.string()).optional(),
    experienceYears: z.coerce.number().min(0).max(50).optional(),
    seniority: z.enum(seniorityValues).optional(),
    parsedData: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
