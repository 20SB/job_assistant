import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  csvExports,
  jobMatches,
  jobs,
  matchBatches,
  users,
} from "../../db/schema.js";
import { logger } from "../../lib/logger.js";
import { NotFound, BadRequest } from "../../lib/errors.js";
import { sendCsvEmail } from "../../lib/email.js";

// ── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCsvField(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatSalary(
  min: string | null,
  max: string | null,
  currency: string | null,
): string {
  if (!min && !max) return "";
  const cur = currency ?? "";
  if (min && max)
    return `${cur} ${Number(min).toLocaleString("en-IN")} - ${Number(max).toLocaleString("en-IN")}`;
  if (min) return `${cur} ${Number(min).toLocaleString("en-IN")}+`;
  return `Up to ${cur} ${Number(max!).toLocaleString("en-IN")}`;
}

const CSV_HEADERS = [
  "Job Title",
  "Company",
  "Location",
  "Salary",
  "Match %",
  "Matched Skills",
  "Missing Skills",
  "Apply URL",
];

interface CsvRow {
  jobTitle: string;
  jobCompany: string | null;
  jobLocation: string | null;
  jobSalaryMin: string | null;
  jobSalaryMax: string | null;
  jobSalaryCurrency: string | null;
  matchPercentage: string;
  matchedSkills: string[] | null;
  missingSkills: string[] | null;
  jobApplyUrl: string | null;
}

function buildCsvBuffer(rows: CsvRow[]): Buffer {
  const header = CSV_HEADERS.map(escapeCsvField).join(",");
  const dataLines = rows.map((r) => {
    const fields = [
      r.jobTitle,
      r.jobCompany,
      r.jobLocation,
      formatSalary(r.jobSalaryMin, r.jobSalaryMax, r.jobSalaryCurrency),
      `${Number(r.matchPercentage).toFixed(1)}%`,
      (r.matchedSkills ?? []).join("; "),
      (r.missingSkills ?? []).join("; "),
      r.jobApplyUrl,
    ];
    return fields.map(escapeCsvField).join(",");
  });
  return Buffer.from([header, ...dataLines].join("\n"), "utf-8");
}

// ── Shared query for batch match rows ────────────────────────────────────────

async function fetchBatchRows(batchId: string) {
  return db
    .select({
      jobTitle: jobs.title,
      jobCompany: jobs.company,
      jobLocation: jobs.location,
      jobSalaryMin: jobs.salaryMin,
      jobSalaryMax: jobs.salaryMax,
      jobSalaryCurrency: jobs.salaryCurrency,
      matchPercentage: jobMatches.matchPercentage,
      matchedSkills: jobMatches.matchedSkills,
      missingSkills: jobMatches.missingSkills,
      jobApplyUrl: jobs.applyUrl,
    })
    .from(jobMatches)
    .innerJoin(jobs, eq(jobMatches.jobId, jobs.id))
    .where(eq(jobMatches.batchId, batchId))
    .orderBy(desc(jobMatches.matchPercentage));
}

// ── Generate CSV ─────────────────────────────────────────────────────────────

export async function generateCsv(
  userId: string,
  batchId: string,
  sendEmailFlag: boolean,
) {
  // Verify batch ownership and status
  const [batch] = await db
    .select()
    .from(matchBatches)
    .where(and(eq(matchBatches.id, batchId), eq(matchBatches.userId, userId)))
    .limit(1);

  if (!batch) throw NotFound("Match batch not found");
  if (batch.status !== "completed")
    throw BadRequest("Match batch is not completed");

  // Fetch match rows with job data
  const rows = await fetchBatchRows(batchId);
  if (rows.length === 0)
    throw BadRequest("No matches found in this batch to export");

  // Build CSV
  const buffer = buildCsvBuffer(rows);
  const fileName = `job-matches-${batchId.slice(0, 8)}-${Date.now()}.csv`;

  // Persist metadata
  const [csvExport] = await db
    .insert(csvExports)
    .values({
      userId,
      batchId,
      fileName,
      filePath: null,
      fileSize: buffer.length,
      totalRows: rows.length,
    })
    .returning();

  logger.info(
    { userId, batchId, exportId: csvExport.id, totalRows: rows.length },
    "CSV export generated",
  );

  // Send email if requested
  if (sendEmailFlag) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      await sendCsvEmail(user.email, fileName, buffer, rows.length);
      logger.info(
        { userId, exportId: csvExport.id, to: user.email },
        "CSV email sent",
      );
    }
  }

  return csvExport;
}

// ── Download CSV ─────────────────────────────────────────────────────────────

export async function downloadCsv(userId: string, exportId: string) {
  const [csvExport] = await db
    .select()
    .from(csvExports)
    .where(and(eq(csvExports.id, exportId), eq(csvExports.userId, userId)))
    .limit(1);

  if (!csvExport) throw NotFound("CSV export not found");
  if (csvExport.isArchived) throw BadRequest("This export has been archived");

  // Regenerate CSV from DB
  const rows = await fetchBatchRows(csvExport.batchId);
  const buffer = buildCsvBuffer(rows);

  return { fileName: csvExport.fileName, buffer };
}

// ── List exports ─────────────────────────────────────────────────────────────

interface ListExportsParams {
  page: number;
  limit: number;
}

export async function listExports(userId: string, params: ListExportsParams) {
  const offset = (params.page - 1) * params.limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(csvExports)
      .where(
        and(eq(csvExports.userId, userId), eq(csvExports.isArchived, false)),
      )
      .orderBy(desc(csvExports.createdAt))
      .limit(params.limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(csvExports)
      .where(
        and(eq(csvExports.userId, userId), eq(csvExports.isArchived, false)),
      ),
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

// ── Archive export ───────────────────────────────────────────────────────────

export async function archiveExport(userId: string, exportId: string) {
  const [existing] = await db
    .select({ id: csvExports.id })
    .from(csvExports)
    .where(and(eq(csvExports.id, exportId), eq(csvExports.userId, userId)))
    .limit(1);

  if (!existing) throw NotFound("CSV export not found");

  const [updated] = await db
    .update(csvExports)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(csvExports.id, exportId))
    .returning();

  logger.info({ userId, exportId }, "CSV export archived");

  return updated;
}
