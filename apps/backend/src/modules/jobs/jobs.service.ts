import { eq, and, desc, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "../../db/index.js";
import { jobs, jobFetchLogs } from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { NotFound, BadRequest } from "../../lib/errors.js";
import { fetchFromAdzuna, mapAdzunaJob } from "./jobs.adzuna.js";

// ── Job listing ────────────────────────────────────────────────────────────

interface ListJobsParams {
  page: number;
  limit: number;
  search?: string;
  location?: string;
  company?: string;
  remote?: string;
  category?: string;
}

export async function listJobs(params: ListJobsParams) {
  const conditions: SQL[] = [eq(jobs.isActive, true)];

  if (params.search) {
    conditions.push(ilike(jobs.title, `%${params.search}%`));
  }
  if (params.location) {
    conditions.push(ilike(jobs.location, `%${params.location}%`));
  }
  if (params.company) {
    conditions.push(ilike(jobs.company, `%${params.company}%`));
  }
  if (params.remote === "true") {
    conditions.push(eq(jobs.isRemote, true));
  }
  if (params.category) {
    conditions.push(ilike(jobs.category, `%${params.category}%`));
  }

  const offset = (params.page - 1) * params.limit;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: jobs.id,
        externalJobId: jobs.externalJobId,
        source: jobs.source,
        title: jobs.title,
        company: jobs.company,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
        location: jobs.location,
        isRemote: jobs.isRemote,
        category: jobs.category,
        contractType: jobs.contractType,
        applyUrl: jobs.applyUrl,
        postedDate: jobs.postedDate,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.postedDate))
      .limit(params.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
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

export async function getJobById(jobId: string) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    throw NotFound("Job not found");
  }

  return job;
}

// ── Job fetch orchestration ────────────────────────────────────────────────

interface TriggerFetchParams {
  roles: string[];
  locations?: string[];
  maxPages: number;
}

export async function triggerFetch(params: TriggerFetchParams) {
  const startedAt = new Date();
  let totalFetched = 0;
  let totalNew = 0;
  let totalDuplicates = 0;
  let totalFailed = 0;

  try {
    for (const role of params.roles) {
      const locationList = params.locations?.length ? params.locations : [undefined];

      for (const location of locationList) {
        for (let page = 1; page <= params.maxPages; page++) {
          let rawJobs;
          try {
            rawJobs = await fetchFromAdzuna({ role, location, page });
          } catch (err) {
            totalFailed++;
            logger.error({ err, role, location, page }, "Failed to fetch page from Adzuna");
            continue;
          }

          totalFetched += rawJobs.length;

          for (const rawJob of rawJobs) {
            const mapped = mapAdzunaJob(rawJob);

            try {
              const inserted = await db
                .insert(jobs)
                .values(mapped)
                .onConflictDoNothing({ target: jobs.externalJobId })
                .returning({ id: jobs.id });

              if (inserted.length > 0) {
                totalNew++;
              } else {
                totalDuplicates++;
              }
            } catch {
              totalFailed++;
            }
          }
        }
      }
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const [log] = await db
      .insert(jobFetchLogs)
      .values({
        source: "adzuna",
        searchParams: { roles: params.roles, locations: params.locations, maxPages: params.maxPages },
        totalFetched,
        totalNew,
        totalDuplicates,
        totalFailed,
        status: "completed",
        durationMs,
        startedAt,
        completedAt,
      })
      .returning();

    logger.info(
      { totalFetched, totalNew, totalDuplicates, totalFailed, durationMs },
      "Job fetch completed",
    );

    return log;
  } catch (err) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const [log] = await db
      .insert(jobFetchLogs)
      .values({
        source: "adzuna",
        searchParams: { roles: params.roles, locations: params.locations, maxPages: params.maxPages },
        totalFetched,
        totalNew,
        totalDuplicates,
        totalFailed,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
        durationMs,
        startedAt,
        completedAt,
      })
      .returning();

    logger.error({ err }, "Job fetch failed");

    return log;
  }
}

// ── Fetch logs ─────────────────────────────────────────────────────────────

export async function listFetchLogs(limit = 20) {
  return db
    .select()
    .from(jobFetchLogs)
    .orderBy(desc(jobFetchLogs.startedAt))
    .limit(limit);
}
