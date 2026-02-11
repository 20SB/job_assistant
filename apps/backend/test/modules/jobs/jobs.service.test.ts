import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockJob } from "../../utils/mocks/fixtures.js";
import {
  mockSelectChain,
  mockInsertChain,
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
vi.mock("../../../src/modules/jobs/jobs.adzuna.js", () => ({
  fetchFromAdzuna: vi.fn(),
  mapAdzunaJob: vi.fn(),
}));

import { db } from "../../../src/db/index.js";
import { fetchFromAdzuna, mapAdzunaJob } from "../../../src/modules/jobs/jobs.adzuna.js";
const mDb = db as unknown as MockDb;

import {
  listJobs,
  getJobById,
  triggerFetch,
  listFetchLogs,
} from "../../../src/modules/jobs/jobs.service.js";

describe("jobs.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── listJobs ────────────────────────────────────────────────────────────

  describe("listJobs", () => {
    it("returns paginated job list", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockJob]))
        .mockReturnValueOnce(mockSelectChain([{ count: 1 }]));

      const result = await listJobs({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("calculates pagination correctly", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockJob]))
        .mockReturnValueOnce(mockSelectChain([{ count: 100 }]));

      const result = await listJobs({ page: 2, limit: 10 });
      expect(result.pagination.totalPages).toBe(10);
      expect(result.pagination.page).toBe(2);
    });

    it("returns empty list when no jobs match", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]));

      const result = await listJobs({ page: 1, limit: 20 });
      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  // ── getJobById ──────────────────────────────────────────────────────────

  describe("getJobById", () => {
    it("returns job when found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockJob]));
      const result = await getJobById("job-uuid-3333");
      expect(result).toEqual(mockJob);
    });

    it("throws 404 when job not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getJobById("nonexistent")).rejects.toThrow(AppError);
    });
  });

  // ── triggerFetch ────────────────────────────────────────────────────────

  describe("triggerFetch", () => {
    it("fetches jobs and inserts them", async () => {
      const rawJob = { id: "1", title: "Dev" };
      vi.mocked(fetchFromAdzuna).mockResolvedValue([rawJob as any]);
      vi.mocked(mapAdzunaJob).mockReturnValue(mockJob as any);
      mDb.insert.mockReturnValue(mockInsertChain([{ id: "job-1" }]));

      const result = await triggerFetch({ roles: ["dev"], maxPages: 1 });

      expect(fetchFromAdzuna).toHaveBeenCalled();
      expect(mapAdzunaJob).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("handles deduplication (empty returning = duplicate)", async () => {
      vi.mocked(fetchFromAdzuna).mockResolvedValue([{ id: "1", title: "Dev" } as any]);
      vi.mocked(mapAdzunaJob).mockReturnValue(mockJob as any);
      // First insert: job insert with onConflictDoNothing → empty (duplicate)
      // Second insert: log entry
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([]))  // duplicate job
        .mockReturnValueOnce(mockInsertChain([{ id: "log-1", status: "completed" }])); // fetch log

      const result = await triggerFetch({ roles: ["dev"], maxPages: 1 });
      expect(result).toBeDefined();
    });

    it("iterates over roles × locations × pages", async () => {
      vi.mocked(fetchFromAdzuna).mockResolvedValue([]);
      mDb.insert.mockReturnValue(mockInsertChain([{}]));

      await triggerFetch({
        roles: ["dev", "engineer"],
        locations: ["London", "Berlin"],
        maxPages: 2,
      });

      // 2 roles × 2 locations × 2 pages = 8 calls
      expect(fetchFromAdzuna).toHaveBeenCalledTimes(8);
    });

    it("continues on fetch error for individual page", async () => {
      vi.mocked(fetchFromAdzuna)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce([]);
      mDb.insert.mockReturnValue(mockInsertChain([{}]));

      const result = await triggerFetch({ roles: ["dev"], maxPages: 2 });
      expect(result).toBeDefined(); // didn't throw
    });

    it("logs fetch results", async () => {
      vi.mocked(fetchFromAdzuna).mockResolvedValue([]);
      mDb.insert.mockReturnValue(mockInsertChain([{ id: "log-1", status: "completed" }]));

      const result = await triggerFetch({ roles: ["dev"], maxPages: 1 });
      expect(result).toBeDefined();
    });

    it("uses default empty locations when none provided", async () => {
      vi.mocked(fetchFromAdzuna).mockResolvedValue([]);
      mDb.insert.mockReturnValue(mockInsertChain([{}]));

      await triggerFetch({ roles: ["dev"], maxPages: 1 });

      expect(fetchFromAdzuna).toHaveBeenCalledWith(
        expect.objectContaining({ role: "dev", location: undefined }),
      );
    });
  });

  // ── listFetchLogs ───────────────────────────────────────────────────────

  describe("listFetchLogs", () => {
    it("returns fetch logs", async () => {
      const logs = [{ id: "log-1", status: "completed" }];
      mDb.select.mockReturnValue(mockSelectChain(logs));

      const result = await listFetchLogs();
      expect(result).toEqual(logs);
    });

    it("defaults to 20 results", async () => {
      const selectChain = mockSelectChain([]);
      mDb.select.mockReturnValue(selectChain);

      await listFetchLogs();

      expect(selectChain.limit).toHaveBeenCalledWith(20);
    });
  });
});
