import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockCvSnapshot, mockPreferences, mockJob, mockMatchBatch, mockJobMatch } from "../../utils/mocks/fixtures.js";
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
vi.mock("../../../src/modules/matching/matching.scorer.js", () => ({
  scoreJob: vi.fn(),
}));
vi.mock("../../../src/modules/notifications/notifications.service.js", () => ({
  notify: vi.fn().mockResolvedValue(null),
}));

import { db } from "../../../src/db/index.js";
import { scoreJob } from "../../../src/modules/matching/matching.scorer.js";
const mDb = db as unknown as MockDb;

import {
  runMatching,
  listBatches,
  getBatchWithMatches,
  listMatches,
  toggleShortlist,
  markViewed,
} from "../../../src/modules/matching/matching.service.js";

describe("matching.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── runMatching ─────────────────────────────────────────────────────────

  describe("runMatching", () => {
    it("runs matching and returns updated batch", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCvSnapshot])) // active CV
        .mockReturnValueOnce(mockSelectChain([mockPreferences])) // preferences
        .mockReturnValueOnce(mockSelectChain([mockJob])); // active jobs
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([mockMatchBatch])) // batch
        .mockReturnValueOnce(mockInsertChain([mockJobMatch])); // match insert
      mDb.update.mockReturnValue(mockUpdateChain([{ ...mockMatchBatch, status: "completed" }]));

      vi.mocked(scoreJob).mockReturnValue({
        matchPercentage: 75,
        matchedSkills: ["node.js"],
        missingSkills: ["python"],
        scoreBreakdown: { skillOverlap: 80, roleMatch: 90, locationMatch: 100, salaryCompat: 70, experienceAlign: 80 },
        recommendationReason: "Recommended: good skill match",
        excluded: false,
      });

      const result = await runMatching("user-uuid-1234", "scheduled");
      expect(result.status).toBe("completed");
    });

    it("throws 400 when no active CV", async () => {
      mDb.select.mockReturnValue(mockSelectChain([])); // no CV

      await expect(runMatching("user-1", "scheduled")).rejects.toThrow(AppError);
      try { await runMatching("user-1", "scheduled"); } catch (e) {
        expect((e as AppError).statusCode).toBe(400);
        expect((e as AppError).message).toContain("CV");
      }
    });

    it("throws 400 when no preferences", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCvSnapshot])) // CV found
        .mockReturnValueOnce(mockSelectChain([])); // no preferences

      await expect(runMatching("user-1", "scheduled")).rejects.toThrow(AppError);
      try {
        mDb.select
          .mockReturnValueOnce(mockSelectChain([mockCvSnapshot]))
          .mockReturnValueOnce(mockSelectChain([]));
        await runMatching("user-1", "scheduled");
      } catch (e) {
        expect((e as AppError).message).toContain("preferences");
      }
    });

    it("skips excluded jobs", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCvSnapshot]))
        .mockReturnValueOnce(mockSelectChain([mockPreferences]))
        .mockReturnValueOnce(mockSelectChain([mockJob]));
      mDb.insert.mockReturnValueOnce(mockInsertChain([mockMatchBatch]));
      mDb.update.mockReturnValue(mockUpdateChain([{ ...mockMatchBatch, totalMatches: 0 }]));

      vi.mocked(scoreJob).mockReturnValue({
        matchPercentage: 0,
        matchedSkills: [],
        missingSkills: [],
        scoreBreakdown: { skillOverlap: 0, roleMatch: 0, locationMatch: 0, salaryCompat: 0, experienceAlign: 0 },
        recommendationReason: "Excluded",
        excluded: true,
      });

      const result = await runMatching("user-1", "scheduled");
      expect(result.totalMatches).toBe(0);
    });

    it("skips jobs below minimum match percentage", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCvSnapshot]))
        .mockReturnValueOnce(mockSelectChain([{ ...mockPreferences, minimumMatchPercentage: 80 }]))
        .mockReturnValueOnce(mockSelectChain([mockJob]));
      mDb.insert.mockReturnValueOnce(mockInsertChain([mockMatchBatch]));
      mDb.update.mockReturnValue(mockUpdateChain([{ ...mockMatchBatch, totalMatches: 0 }]));

      vi.mocked(scoreJob).mockReturnValue({
        matchPercentage: 40, // below 80
        matchedSkills: [],
        missingSkills: [],
        scoreBreakdown: { skillOverlap: 40, roleMatch: 40, locationMatch: 40, salaryCompat: 40, experienceAlign: 40 },
        recommendationReason: "Low match",
        excluded: false,
      });

      const result = await runMatching("user-1", "scheduled");
      expect(result.totalMatches).toBe(0);
    });

    it("sends notification after matching (fire-and-forget)", async () => {
      const { notify } = await import("../../../src/modules/notifications/notifications.service.js");
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCvSnapshot]))
        .mockReturnValueOnce(mockSelectChain([mockPreferences]))
        .mockReturnValueOnce(mockSelectChain([])); // no active jobs
      mDb.insert.mockReturnValue(mockInsertChain([mockMatchBatch]));
      mDb.update.mockReturnValue(mockUpdateChain([mockMatchBatch]));

      await runMatching("user-1", "scheduled");
      expect(notify).toHaveBeenCalled();
    });

    it("scores each active job", async () => {
      const jobs = [
        { ...mockJob, id: "j1" },
        { ...mockJob, id: "j2" },
        { ...mockJob, id: "j3" },
      ];
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockCvSnapshot]))
        .mockReturnValueOnce(mockSelectChain([mockPreferences]))
        .mockReturnValueOnce(mockSelectChain(jobs));
      mDb.insert.mockReturnValue(mockInsertChain([mockMatchBatch]));
      mDb.update.mockReturnValue(mockUpdateChain([{ ...mockMatchBatch, totalMatches: 3 }]));

      vi.mocked(scoreJob).mockReturnValue({
        matchPercentage: 80,
        matchedSkills: ["react"],
        missingSkills: [],
        scoreBreakdown: { skillOverlap: 80, roleMatch: 80, locationMatch: 80, salaryCompat: 80, experienceAlign: 80 },
        recommendationReason: "Great match",
        excluded: false,
      });

      await runMatching("user-1", "scheduled");
      expect(scoreJob).toHaveBeenCalledTimes(3);
    });
  });

  // ── listBatches ─────────────────────────────────────────────────────────

  describe("listBatches", () => {
    it("returns user batches", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockMatchBatch]));
      const result = await listBatches("user-1");
      expect(result).toHaveLength(1);
    });
  });

  // ── getBatchWithMatches ─────────────────────────────────────────────────

  describe("getBatchWithMatches", () => {
    it("returns batch with matches", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockMatchBatch])) // batch
        .mockReturnValueOnce(mockSelectChain([mockJobMatch])); // matches

      const result = await getBatchWithMatches("user-1", "batch-1");
      expect(result.batch).toEqual(mockMatchBatch);
      expect(result.matches).toHaveLength(1);
    });

    it("throws 404 when batch not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getBatchWithMatches("user-1", "bad")).rejects.toThrow(AppError);
    });
  });

  // ── listMatches ─────────────────────────────────────────────────────────

  describe("listMatches", () => {
    it("returns paginated matches", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockJobMatch]))
        .mockReturnValueOnce(mockSelectChain([{ count: 1 }]));

      const result = await listMatches("user-1", { page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  // ── toggleShortlist ─────────────────────────────────────────────────────

  describe("toggleShortlist", () => {
    it("toggles shortlist flag", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "m-1", isShortlisted: false }]));
      mDb.update.mockReturnValue(mockUpdateChain([{ ...mockJobMatch, isShortlisted: true }]));

      const result = await toggleShortlist("user-1", "m-1");
      expect(result.isShortlisted).toBe(true);
    });

    it("throws 404 when match not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(toggleShortlist("user-1", "bad")).rejects.toThrow(AppError);
    });

    it("toggles from true to false", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "m-1", isShortlisted: true }]));
      mDb.update.mockReturnValue(mockUpdateChain([{ ...mockJobMatch, isShortlisted: false }]));

      const result = await toggleShortlist("user-1", "m-1");
      expect(result.isShortlisted).toBe(false);
    });
  });

  // ── markViewed ──────────────────────────────────────────────────────────

  describe("markViewed", () => {
    it("marks match as viewed", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "m-1" }]));
      mDb.update.mockReturnValue(mockUpdateChain([{ ...mockJobMatch, isViewed: true }]));

      const result = await markViewed("user-1", "m-1");
      expect(result.isViewed).toBe(true);
    });

    it("throws 404 when match not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(markViewed("user-1", "bad")).rejects.toThrow(AppError);
    });
  });
});
