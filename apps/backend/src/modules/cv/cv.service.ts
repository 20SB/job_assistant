import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { cvSnapshots } from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { NotFound } from "../../lib/errors.js";

interface CreateCvInput {
  rawCvText: string;
  inputMethod?: string;
  parsedSkills?: string[];
  parsedRoles?: string[];
  parsedTools?: string[];
  experienceYears?: number;
  seniority?:
    | "intern"
    | "junior"
    | "mid"
    | "senior"
    | "lead"
    | "principal"
    | "executive";
  parsedData?: Record<string, unknown>;
}

type UpdateCvInput = Partial<CreateCvInput>;

export async function createCv(userId: string, input: CreateCvInput) {
  // Deactivate any existing active CV for this user
  await db
    .update(cvSnapshots)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(cvSnapshots.userId, userId), eq(cvSnapshots.isActive, true)));

  // Get the latest version number for this user
  const [latest] = await db
    .select({ version: cvSnapshots.version })
    .from(cvSnapshots)
    .where(eq(cvSnapshots.userId, userId))
    .orderBy(desc(cvSnapshots.version))
    .limit(1);

  const nextVersion = latest ? latest.version + 1 : 1;

  const [cv] = await db
    .insert(cvSnapshots)
    .values({
      userId,
      version: nextVersion,
      isActive: true,
      rawCvText: input.rawCvText,
      inputMethod: input.inputMethod ?? "text",
      parsedSkills: input.parsedSkills,
      parsedRoles: input.parsedRoles,
      parsedTools: input.parsedTools,
      experienceYears: input.experienceYears?.toString(),
      seniority: input.seniority,
      parsedData: input.parsedData,
    })
    .returning();

  logger.info({ userId, cvId: cv.id, version: nextVersion }, "CV created");

  return cv;
}

export async function getActiveCv(userId: string) {
  const [cv] = await db
    .select()
    .from(cvSnapshots)
    .where(and(eq(cvSnapshots.userId, userId), eq(cvSnapshots.isActive, true)))
    .limit(1);

  if (!cv) {
    throw NotFound("No active CV found");
  }

  return cv;
}

export async function getCvById(userId: string, cvId: string) {
  const [cv] = await db
    .select()
    .from(cvSnapshots)
    .where(and(eq(cvSnapshots.id, cvId), eq(cvSnapshots.userId, userId)))
    .limit(1);

  if (!cv) {
    throw NotFound("CV not found");
  }

  return cv;
}

export async function listCvVersions(userId: string) {
  const cvs = await db
    .select({
      id: cvSnapshots.id,
      version: cvSnapshots.version,
      isActive: cvSnapshots.isActive,
      inputMethod: cvSnapshots.inputMethod,
      experienceYears: cvSnapshots.experienceYears,
      seniority: cvSnapshots.seniority,
      createdAt: cvSnapshots.createdAt,
    })
    .from(cvSnapshots)
    .where(eq(cvSnapshots.userId, userId))
    .orderBy(desc(cvSnapshots.version));

  return cvs;
}

export async function updateCv(userId: string, input: UpdateCvInput) {
  // Update creates a new snapshot (append-only versioning per HLD §6)
  const [activeCv] = await db
    .select()
    .from(cvSnapshots)
    .where(and(eq(cvSnapshots.userId, userId), eq(cvSnapshots.isActive, true)))
    .limit(1);

  if (!activeCv) {
    throw NotFound("No active CV found to update");
  }

  // Merge: new input overrides active CV fields
  return createCv(userId, {
    rawCvText: input.rawCvText ?? activeCv.rawCvText,
    inputMethod: (input.inputMethod as string) ?? activeCv.inputMethod,
    parsedSkills: input.parsedSkills ?? activeCv.parsedSkills ?? undefined,
    parsedRoles: input.parsedRoles ?? activeCv.parsedRoles ?? undefined,
    parsedTools: input.parsedTools ?? activeCv.parsedTools ?? undefined,
    experienceYears: input.experienceYears ?? (activeCv.experienceYears ? Number(activeCv.experienceYears) : undefined),
    seniority: input.seniority ?? activeCv.seniority ?? undefined,
    parsedData: input.parsedData ?? (activeCv.parsedData as Record<string, unknown>) ?? undefined,
  });
}

export async function deleteCv(userId: string, cvId: string) {
  const [cv] = await db
    .select({ id: cvSnapshots.id, isActive: cvSnapshots.isActive })
    .from(cvSnapshots)
    .where(and(eq(cvSnapshots.id, cvId), eq(cvSnapshots.userId, userId)))
    .limit(1);

  if (!cv) {
    throw NotFound("CV not found");
  }

  await db.delete(cvSnapshots).where(eq(cvSnapshots.id, cvId));

  // If we deleted the active CV, promote the latest remaining one
  if (cv.isActive) {
    const [latestRemaining] = await db
      .select({ id: cvSnapshots.id })
      .from(cvSnapshots)
      .where(eq(cvSnapshots.userId, userId))
      .orderBy(desc(cvSnapshots.version))
      .limit(1);

    if (latestRemaining) {
      await db
        .update(cvSnapshots)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(cvSnapshots.id, latestRemaining.id));
    }
  }

  logger.info({ userId, cvId }, "CV deleted");

  return { message: "CV deleted successfully" };
}
