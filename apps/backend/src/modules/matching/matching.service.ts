import { eq, and, desc, gte, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  matchBatches,
  jobMatches,
  jobs,
  cvSnapshots,
  jobPreferences,
} from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { NotFound, BadRequest } from "../../lib/errors.js";
import { scoreJob } from "./matching.scorer.js";

type MatchTrigger = "new_job" | "cv_updated" | "preferences_updated" | "scheduled";

// ── Run matching ───────────────────────────────────────────────────────────

export async function runMatching(userId: string, trigger: MatchTrigger) {
  // Get active CV
  const [cv] = await db
    .select()
    .from(cvSnapshots)
    .where(and(eq(cvSnapshots.userId, userId), eq(cvSnapshots.isActive, true)))
    .limit(1);

  if (!cv) {
    throw BadRequest("No active CV found. Upload a CV before running matching.");
  }

  // Get preferences
  const [prefs] = await db
    .select()
    .from(jobPreferences)
    .where(eq(jobPreferences.userId, userId))
    .limit(1);

  if (!prefs) {
    throw BadRequest("No job preferences found. Set your preferences before running matching.");
  }

  // Create batch record
  const [batch] = await db
    .insert(matchBatches)
    .values({
      userId,
      cvSnapshotId: cv.id,
      trigger,
      status: "in_progress",
      startedAt: new Date(),
    })
    .returning();

  // Get all active jobs
  const activeJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.isActive, true));

  let totalMatches = 0;

  const cvProfile = {
    parsedSkills: cv.parsedSkills,
    parsedRoles: cv.parsedRoles,
    parsedTools: cv.parsedTools,
    experienceYears: cv.experienceYears,
  };

  const userPrefs = {
    preferredRoles: prefs.preferredRoles,
    locations: prefs.locations,
    remotePreference: prefs.remotePreference,
    expectedSalaryMin: prefs.expectedSalaryMin,
    expectedSalaryMax: prefs.expectedSalaryMax,
    excludedKeywords: prefs.excludedKeywords,
    blacklistedCompanies: prefs.blacklistedCompanies,
    minimumMatchPercentage: prefs.minimumMatchPercentage,
  };

  const minMatch = prefs.minimumMatchPercentage ?? 50;

  for (const job of activeJobs) {
    const result = scoreJob(cvProfile, userPrefs, {
      title: job.title,
      company: job.company,
      description: job.description,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      location: job.location,
      isRemote: job.isRemote,
    });

    // Skip excluded jobs and those below minimum match percentage
    if (result.excluded || result.matchPercentage < minMatch) {
      continue;
    }

    await db
      .insert(jobMatches)
      .values({
        batchId: batch.id,
        userId,
        jobId: job.id,
        matchPercentage: String(result.matchPercentage),
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
        scoreBreakdown: result.scoreBreakdown as unknown as Record<string, unknown>,
        recommendationReason: result.recommendationReason,
      })
      .onConflictDoNothing({ target: [jobMatches.batchId, jobMatches.jobId] });

    totalMatches++;
  }

  // Update batch with results
  const [updatedBatch] = await db
    .update(matchBatches)
    .set({
      totalJobsEvaluated: activeJobs.length,
      totalMatches,
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(matchBatches.id, batch.id))
    .returning();

  logger.info(
    { userId, batchId: batch.id, totalJobsEvaluated: activeJobs.length, totalMatches },
    "Matching run completed",
  );

  return updatedBatch;
}

// ── Batch listing ──────────────────────────────────────────────────────────

export async function listBatches(userId: string) {
  return db
    .select()
    .from(matchBatches)
    .where(eq(matchBatches.userId, userId))
    .orderBy(desc(matchBatches.createdAt))
    .limit(20);
}

export async function getBatchWithMatches(userId: string, batchId: string) {
  const [batch] = await db
    .select()
    .from(matchBatches)
    .where(and(eq(matchBatches.id, batchId), eq(matchBatches.userId, userId)))
    .limit(1);

  if (!batch) {
    throw NotFound("Match batch not found");
  }

  const matches = await db
    .select({
      id: jobMatches.id,
      jobId: jobMatches.jobId,
      matchPercentage: jobMatches.matchPercentage,
      matchedSkills: jobMatches.matchedSkills,
      missingSkills: jobMatches.missingSkills,
      scoreBreakdown: jobMatches.scoreBreakdown,
      recommendationReason: jobMatches.recommendationReason,
      isShortlisted: jobMatches.isShortlisted,
      isViewed: jobMatches.isViewed,
      jobTitle: jobs.title,
      jobCompany: jobs.company,
      jobLocation: jobs.location,
      jobSalaryMin: jobs.salaryMin,
      jobSalaryMax: jobs.salaryMax,
      jobApplyUrl: jobs.applyUrl,
    })
    .from(jobMatches)
    .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
    .where(eq(jobMatches.batchId, batchId))
    .orderBy(desc(jobMatches.matchPercentage));

  return { batch, matches };
}

// ── User match results (latest, paginated) ─────────────────────────────────

interface ListMatchesParams {
  page: number;
  limit: number;
  minPercentage?: number;
  shortlistedOnly?: string;
}

export async function listMatches(userId: string, params: ListMatchesParams) {
  const conditions: SQL[] = [eq(jobMatches.userId, userId)];

  if (params.minPercentage != null) {
    conditions.push(gte(jobMatches.matchPercentage, String(params.minPercentage)));
  }
  if (params.shortlistedOnly === "true") {
    conditions.push(eq(jobMatches.isShortlisted, true));
  }

  const offset = (params.page - 1) * params.limit;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: jobMatches.id,
        batchId: jobMatches.batchId,
        jobId: jobMatches.jobId,
        matchPercentage: jobMatches.matchPercentage,
        matchedSkills: jobMatches.matchedSkills,
        missingSkills: jobMatches.missingSkills,
        scoreBreakdown: jobMatches.scoreBreakdown,
        recommendationReason: jobMatches.recommendationReason,
        isShortlisted: jobMatches.isShortlisted,
        isViewed: jobMatches.isViewed,
        createdAt: jobMatches.createdAt,
        jobTitle: jobs.title,
        jobCompany: jobs.company,
        jobLocation: jobs.location,
        jobSalaryMin: jobs.salaryMin,
        jobSalaryMax: jobs.salaryMax,
        jobApplyUrl: jobs.applyUrl,
      })
      .from(jobMatches)
      .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
      .where(and(...conditions))
      .orderBy(desc(jobMatches.matchPercentage))
      .limit(params.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobMatches)
      .where(and(...conditions)),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

// ── Match actions ──────────────────────────────────────────────────────────

export async function toggleShortlist(userId: string, matchId: string) {
  const [match] = await db
    .select({ id: jobMatches.id, isShortlisted: jobMatches.isShortlisted })
    .from(jobMatches)
    .where(and(eq(jobMatches.id, matchId), eq(jobMatches.userId, userId)))
    .limit(1);

  if (!match) {
    throw NotFound("Match not found");
  }

  const [updated] = await db
    .update(jobMatches)
    .set({ isShortlisted: !match.isShortlisted, updatedAt: new Date() })
    .where(eq(jobMatches.id, matchId))
    .returning();

  return updated;
}

export async function markViewed(userId: string, matchId: string) {
  const [match] = await db
    .select({ id: jobMatches.id })
    .from(jobMatches)
    .where(and(eq(jobMatches.id, matchId), eq(jobMatches.userId, userId)))
    .limit(1);

  if (!match) {
    throw NotFound("Match not found");
  }

  const [updated] = await db
    .update(jobMatches)
    .set({ isViewed: true, updatedAt: new Date() })
    .where(eq(jobMatches.id, matchId))
    .returning();

  return updated;
}
