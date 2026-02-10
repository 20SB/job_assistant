import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { jobPreferences } from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { NotFound, Conflict } from "../../lib/errors.js";

interface CreatePreferencesInput {
  preferredRoles: string[];
  locations: string[];
  remotePreference?: boolean;
  minExperienceYears?: number;
  maxExperienceYears?: number;
  currentSalary?: number;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  salaryCurrency?: string;
  companySize?: "startup" | "small" | "medium" | "large" | "enterprise";
  employmentType?: "full_time" | "contract" | "part_time" | "freelance" | "internship";
  excludedKeywords?: string[];
  blacklistedCompanies?: string[];
  minimumMatchPercentage?: number;
}

type UpdatePreferencesInput = Partial<CreatePreferencesInput>;

export async function createPreferences(userId: string, input: CreatePreferencesInput) {
  // Check if preferences already exist for this user (one-to-one)
  const [existing] = await db
    .select({ id: jobPreferences.id })
    .from(jobPreferences)
    .where(eq(jobPreferences.userId, userId))
    .limit(1);

  if (existing) {
    throw Conflict("Job preferences already exist. Use PATCH to update.");
  }

  const [prefs] = await db
    .insert(jobPreferences)
    .values({
      userId,
      preferredRoles: input.preferredRoles,
      locations: input.locations,
      remotePreference: input.remotePreference ?? false,
      minExperienceYears: input.minExperienceYears?.toString(),
      maxExperienceYears: input.maxExperienceYears?.toString(),
      currentSalary: input.currentSalary?.toString(),
      expectedSalaryMin: input.expectedSalaryMin?.toString(),
      expectedSalaryMax: input.expectedSalaryMax?.toString(),
      salaryCurrency: input.salaryCurrency ?? "INR",
      companySize: input.companySize,
      employmentType: input.employmentType ?? "full_time",
      excludedKeywords: input.excludedKeywords,
      blacklistedCompanies: input.blacklistedCompanies,
      minimumMatchPercentage: input.minimumMatchPercentage ?? 50,
    })
    .returning();

  logger.info({ userId, preferencesId: prefs.id }, "Job preferences created");

  return prefs;
}

export async function getPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(jobPreferences)
    .where(eq(jobPreferences.userId, userId))
    .limit(1);

  if (!prefs) {
    throw NotFound("Job preferences not found");
  }

  return prefs;
}

export async function updatePreferences(userId: string, input: UpdatePreferencesInput) {
  const [existing] = await db
    .select()
    .from(jobPreferences)
    .where(eq(jobPreferences.userId, userId))
    .limit(1);

  if (!existing) {
    throw NotFound("Job preferences not found. Create them first.");
  }

  const [updated] = await db
    .update(jobPreferences)
    .set({
      ...(input.preferredRoles !== undefined && { preferredRoles: input.preferredRoles }),
      ...(input.locations !== undefined && { locations: input.locations }),
      ...(input.remotePreference !== undefined && { remotePreference: input.remotePreference }),
      ...(input.minExperienceYears !== undefined && { minExperienceYears: input.minExperienceYears.toString() }),
      ...(input.maxExperienceYears !== undefined && { maxExperienceYears: input.maxExperienceYears.toString() }),
      ...(input.currentSalary !== undefined && { currentSalary: input.currentSalary.toString() }),
      ...(input.expectedSalaryMin !== undefined && { expectedSalaryMin: input.expectedSalaryMin.toString() }),
      ...(input.expectedSalaryMax !== undefined && { expectedSalaryMax: input.expectedSalaryMax.toString() }),
      ...(input.salaryCurrency !== undefined && { salaryCurrency: input.salaryCurrency }),
      ...(input.companySize !== undefined && { companySize: input.companySize }),
      ...(input.employmentType !== undefined && { employmentType: input.employmentType }),
      ...(input.excludedKeywords !== undefined && { excludedKeywords: input.excludedKeywords }),
      ...(input.blacklistedCompanies !== undefined && { blacklistedCompanies: input.blacklistedCompanies }),
      ...(input.minimumMatchPercentage !== undefined && { minimumMatchPercentage: input.minimumMatchPercentage }),
      updatedAt: new Date(),
    })
    .where(eq(jobPreferences.userId, userId))
    .returning();

  logger.info({ userId, preferencesId: updated.id }, "Job preferences updated");

  return updated;
}

export async function deletePreferences(userId: string) {
  const [existing] = await db
    .select({ id: jobPreferences.id })
    .from(jobPreferences)
    .where(eq(jobPreferences.userId, userId))
    .limit(1);

  if (!existing) {
    throw NotFound("Job preferences not found");
  }

  await db.delete(jobPreferences).where(eq(jobPreferences.userId, userId));

  logger.info({ userId }, "Job preferences deleted");

  return { message: "Job preferences deleted successfully" };
}
