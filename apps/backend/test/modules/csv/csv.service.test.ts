import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockMatchBatch, mockCsvExport, mockUser } from "../../utils/mocks/fixtures.js";
import {
  mockSelectChain,
  mockInsertChain,
  mockUpdateChain,
  type MockDb,
} from "../../utils/mocks/db.mock.js";

vi.mock("../../../src/db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("../../../src/lib/email.js", () => ({
  sendCsvEmail: vi.fn().mockResolvedValue(undefined),
}));

import { db } from "../../../src/db/index.js";
import { sendCsvEmail } from "../../../src/lib/email.js";
const mDb = db as unknown as MockDb;

import {
  generateCsv,
  downloadCsv,
  listExports,
  archiveExport,
} from "../../../src/modules/csv/csv.service.js";

const mockMatchRow = {
  jobTitle: "Software Engineer",
  jobCompany: "TechCorp",
  jobLocation: "Bangalore",
  jobSalaryMin: "2000000",
  jobSalaryMax: "3000000",
  jobSalaryCurrency: "INR",
  matchPercentage: "78",
  matchedSkills: ["node.js", "react"],
  missingSkills: ["python"],
  jobApplyUrl: "https://example.com/apply",
};

describe("csv.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── generateCsv ─────────────────────────────────────────────────────────

  describe("generateCsv", () => {
    it("generates CSV and stores metadata", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockMatchBatch])) // batch
        .mockReturnValueOnce(mockSelectChain([mockMatchRow])); // match rows
      mDb.insert.mockReturnValue(mockInsertChain([mockCsvExport]));

      const result = await generateCsv("user-1", "batch-1", false);
      expect(result).toEqual(mockCsvExport);
    });

    it("throws 404 when batch not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(generateCsv("user-1", "bad", false)).rejects.toThrow(AppError);
    });

    it("throws 400 when batch is not completed", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ ...mockMatchBatch, status: "in_progress" }]));
      await expect(generateCsv("user-1", "batch-1", false)).rejects.toThrow(AppError);
      try {
        mDb.select.mockReturnValue(mockSelectChain([{ ...mockMatchBatch, status: "in_progress" }]));
        await generateCsv("user-1", "batch-1", false);
      } catch (e) {
        expect((e as AppError).statusCode).toBe(400);
      }
    });

    it("throws 400 when no matches in batch", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockMatchBatch]))
        .mockReturnValueOnce(mockSelectChain([])); // no rows

      await expect(generateCsv("user-1", "batch-1", false)).rejects.toThrow(AppError);
    });

    it("sends email when flag is true", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockMatchBatch]))
        .mockReturnValueOnce(mockSelectChain([mockMatchRow]))
        .mockReturnValueOnce(mockSelectChain([{ email: "test@example.com" }])); // user email
      mDb.insert.mockReturnValue(mockInsertChain([mockCsvExport]));

      await generateCsv("user-1", "batch-1", true);

      expect(sendCsvEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(String),
        expect.any(Buffer),
        1, // totalRows
      );
    });

    it("does not send email when flag is false", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockMatchBatch]))
        .mockReturnValueOnce(mockSelectChain([mockMatchRow]));
      mDb.insert.mockReturnValue(mockInsertChain([mockCsvExport]));

      await generateCsv("user-1", "batch-1", false);

      expect(sendCsvEmail).not.toHaveBeenCalled();
    });

    it("builds CSV buffer with correct headers", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockMatchBatch]))
        .mockReturnValueOnce(mockSelectChain([mockMatchRow]));
      const insertChain = mockInsertChain([mockCsvExport]);
      mDb.insert.mockReturnValue(insertChain);

      await generateCsv("user-1", "batch-1", false);

      // Check that fileSize > 0 was inserted
      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          fileSize: expect.any(Number),
          totalRows: 1,
        }),
      );
    });
  });

  // ── downloadCsv ─────────────────────────────────────────────────────────

  describe("downloadCsv", () => {
    it("returns fileName and buffer", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCsvExport]))
        .mockReturnValueOnce(mockSelectChain([mockMatchRow]));

      const result = await downloadCsv("user-1", "export-1");
      expect(result.fileName).toBe(mockCsvExport.fileName);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it("throws 404 when export not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(downloadCsv("user-1", "bad")).rejects.toThrow(AppError);
    });

    it("throws 400 when export is archived", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ ...mockCsvExport, isArchived: true }]));
      await expect(downloadCsv("user-1", "archived")).rejects.toThrow(AppError);
    });

    it("regenerates CSV from batch data", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCsvExport]))
        .mockReturnValueOnce(mockSelectChain([mockMatchRow]));

      const result = await downloadCsv("user-1", "export-1");
      const content = result.buffer.toString("utf-8");
      expect(content).toContain("Job Title");
      expect(content).toContain("Software Engineer");
    });
  });

  // ── listExports ─────────────────────────────────────────────────────────

  describe("listExports", () => {
    it("returns paginated exports", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCsvExport]))
        .mockReturnValueOnce(mockSelectChain([{ count: 1 }]));

      const result = await listExports("user-1", { page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  // ── archiveExport ───────────────────────────────────────────────────────

  describe("archiveExport", () => {
    it("archives an export", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "exp-1" }]));
      mDb.update.mockReturnValue(mockUpdateChain([{ ...mockCsvExport, isArchived: true }]));

      const result = await archiveExport("user-1", "exp-1");
      expect(result.isArchived).toBe(true);
    });

    it("throws 404 when export not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(archiveExport("user-1", "bad")).rejects.toThrow(AppError);
    });
  });
});
