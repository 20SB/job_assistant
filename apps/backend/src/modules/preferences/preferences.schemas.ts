import { z } from "zod";

const companySizeValues = [
  "startup",
  "small",
  "medium",
  "large",
  "enterprise",
] as const;

const employmentTypeValues = [
  "full_time",
  "contract",
  "part_time",
  "freelance",
  "internship",
] as const;

export const createPreferencesSchema = z.object({
  preferredRoles: z.array(z.string().min(1)).min(1, "At least one preferred role is required"),
  locations: z.array(z.string().min(1)).min(1, "At least one location is required"),
  remotePreference: z.boolean().default(false),
  minExperienceYears: z.coerce.number().min(0).max(50).optional(),
  maxExperienceYears: z.coerce.number().min(0).max(50).optional(),
  currentSalary: z.coerce.number().min(0).optional(),
  expectedSalaryMin: z.coerce.number().min(0).optional(),
  expectedSalaryMax: z.coerce.number().min(0).optional(),
  salaryCurrency: z.string().length(3).default("INR"),
  companySize: z.enum(companySizeValues).optional(),
  employmentType: z.enum(employmentTypeValues).default("full_time"),
  excludedKeywords: z.array(z.string()).optional(),
  blacklistedCompanies: z.array(z.string()).optional(),
  minimumMatchPercentage: z.coerce.number().int().min(0).max(100).default(50),
});

export const updatePreferencesSchema = z
  .object({
    preferredRoles: z.array(z.string().min(1)).min(1).optional(),
    locations: z.array(z.string().min(1)).min(1).optional(),
    remotePreference: z.boolean().optional(),
    minExperienceYears: z.coerce.number().min(0).max(50).optional(),
    maxExperienceYears: z.coerce.number().min(0).max(50).optional(),
    currentSalary: z.coerce.number().min(0).optional(),
    expectedSalaryMin: z.coerce.number().min(0).optional(),
    expectedSalaryMax: z.coerce.number().min(0).optional(),
    salaryCurrency: z.string().length(3).optional(),
    companySize: z.enum(companySizeValues).optional(),
    employmentType: z.enum(employmentTypeValues).optional(),
    excludedKeywords: z.array(z.string()).optional(),
    blacklistedCompanies: z.array(z.string()).optional(),
    minimumMatchPercentage: z.coerce.number().int().min(0).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });
