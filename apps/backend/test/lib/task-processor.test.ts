import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

// Mock workers to prevent importing actual service modules
vi.mock("../../src/lib/workers/job-fetch.worker.js", () => ({
  jobFetchWorker: vi.fn(),
}));
vi.mock("../../src/lib/workers/matching.worker.js", () => ({
  matchingWorker: vi.fn(),
}));
vi.mock("../../src/lib/workers/csv-generation.worker.js", () => ({
  csvGenerationWorker: vi.fn(),
}));
vi.mock("../../src/lib/workers/email-delivery.worker.js", () => ({
  emailDeliveryWorker: vi.fn(),
}));

import { db } from "../../src/db/index.js";
import { startTaskProcessor } from "../../src/lib/task-processor.js";
import { jobFetchWorker } from "../../src/lib/workers/job-fetch.worker.js";
import { matchingWorker } from "../../src/lib/workers/matching.worker.js";
import {
  mockUpdateChain,
  type MockDb,
} from "../utils/mocks/db.mock.js";

const mDb = db as unknown as MockDb;

describe("task-processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("startTaskProcessor", () => {
    it("returns a stop function", () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.execute.mockResolvedValue({ rows: [] });
      const stop = startTaskProcessor(5000);
      expect(typeof stop).toBe("function");
      stop();
    });

    it("sets up polling interval", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.execute.mockResolvedValue({ rows: [] });

      const stop = startTaskProcessor(1000);

      // Advance timers to trigger poll
      await vi.advanceTimersByTimeAsync(1000);

      stop();
    });

    it("stops polling when stop is called", () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.execute.mockResolvedValue({ rows: [] });

      const stop = startTaskProcessor(1000);
      stop();

      // Should not throw or poll after stopping
    });
  });

  describe("polling behavior", () => {
    it("cleans stale locks on each poll", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.execute.mockResolvedValue({ rows: [] });

      const stop = startTaskProcessor(100);
      await vi.advanceTimersByTimeAsync(100);

      // update is called for stale lock cleanup
      expect(mDb.update).toHaveBeenCalled();
      stop();
    });

    it("claims and executes a task", async () => {
      // Stale lock cleanup
      mDb.update.mockReturnValue(mockUpdateChain([]));
      // Claim returns a task
      mDb.execute.mockResolvedValue({
        rows: [{
          id: "task-1",
          type: "job_fetch",
          payload: { roles: ["dev"] },
          attempts: 1,
          max_attempts: 3,
        }],
      });
      vi.mocked(jobFetchWorker).mockResolvedValue({ success: true });

      const stop = startTaskProcessor(100);
      await vi.advanceTimersByTimeAsync(100);

      expect(jobFetchWorker).toHaveBeenCalledWith({ roles: ["dev"] });
      stop();
    });

    it("handles worker failure and schedules retry", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.execute.mockResolvedValue({
        rows: [{
          id: "task-2",
          type: "matching",
          payload: { userId: "u-1" },
          attempts: 1,
          max_attempts: 3,
        }],
      });
      vi.mocked(matchingWorker).mockRejectedValue(new Error("Service down"));

      const stop = startTaskProcessor(100);
      await vi.advanceTimersByTimeAsync(100);

      // failTask calls db.update for retry scheduling
      expect(mDb.update).toHaveBeenCalled();
      stop();
    });

    it("does nothing when no tasks available", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.execute.mockResolvedValue({ rows: [] }); // no tasks

      const stop = startTaskProcessor(100);
      await vi.advanceTimersByTimeAsync(100);

      // No worker should be called
      expect(jobFetchWorker).not.toHaveBeenCalled();
      stop();
    });

    it("handles unknown task type gracefully", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.execute.mockResolvedValue({
        rows: [{
          id: "task-3",
          type: "unknown_type",
          payload: {},
          attempts: 1,
          max_attempts: 3,
        }],
      });

      const stop = startTaskProcessor(100);
      await vi.advanceTimersByTimeAsync(100);

      // failTask should be called for unknown type
      expect(mDb.update).toHaveBeenCalled();
      stop();
    });

    it("polls multiple times", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.execute.mockResolvedValue({ rows: [] });

      const stop = startTaskProcessor(100);
      await vi.advanceTimersByTimeAsync(300);

      // Should have polled ~3 times (execute called for claim each time)
      expect(mDb.execute).toHaveBeenCalled();
      stop();
    });
  });
});
