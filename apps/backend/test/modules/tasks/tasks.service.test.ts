import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockTask } from "../../utils/mocks/fixtures.js";
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

import { db } from "../../../src/db/index.js";
const mDb = db as unknown as MockDb;

import {
  enqueue,
  getTask,
  listTasks,
} from "../../../src/modules/tasks/tasks.service.js";

describe("tasks.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── enqueue ─────────────────────────────────────────────────────────────

  describe("enqueue", () => {
    it("inserts a task and returns it", async () => {
      mDb.insert.mockReturnValue(mockInsertChain([mockTask]));

      const result = await enqueue("job_fetch", { roles: ["engineer"] });
      expect(result).toEqual(mockTask);
      expect(mDb.insert).toHaveBeenCalled();
    });

    it("uses default options when not provided", async () => {
      const insertChain = mockInsertChain([mockTask]);
      mDb.insert.mockReturnValue(insertChain);

      await enqueue("matching", { userId: "user-1" });

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 0,
          maxAttempts: 3,
        }),
      );
    });

    it("uses custom options when provided", async () => {
      const insertChain = mockInsertChain([mockTask]);
      mDb.insert.mockReturnValue(insertChain);

      const scheduledFor = new Date("2025-06-01");
      await enqueue("csv_generation", { batchId: "b1" }, {
        priority: 5,
        maxAttempts: 5,
        scheduledFor,
      });

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 5,
          maxAttempts: 5,
          scheduledFor,
        }),
      );
    });

    it("accepts all task types", async () => {
      mDb.insert.mockReturnValue(mockInsertChain([mockTask]));

      for (const type of ["job_fetch", "matching", "csv_generation", "email_delivery"] as const) {
        await enqueue(type, {});
        expect(mDb.insert).toHaveBeenCalled();
      }
    });
  });

  // ── getTask ─────────────────────────────────────────────────────────────

  describe("getTask", () => {
    it("returns task when found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockTask]));
      const result = await getTask("task-uuid-bbbb");
      expect(result).toEqual(mockTask);
    });

    it("throws 404 when task not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getTask("nonexistent")).rejects.toThrow(AppError);
      try { await getTask("nonexistent"); } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });

  // ── listTasks ───────────────────────────────────────────────────────────

  describe("listTasks", () => {
    it("returns paginated tasks", async () => {
      const selectChain = mockSelectChain([mockTask]);
      mDb.select.mockReturnValue(selectChain);

      // listTasks uses Promise.all with two select calls
      // Need to mock select to return different chains for each call
      const countChain = mockSelectChain([{ count: 1 }]);
      mDb.select
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(countChain);

      const result = await listTasks({ page: 1, limit: 20 });
      expect(result.tasks).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it("calculates totalPages correctly", async () => {
      const selectChain = mockSelectChain([mockTask]);
      const countChain = mockSelectChain([{ count: 45 }]);
      mDb.select
        .mockReturnValueOnce(selectChain)
        .mockReturnValueOnce(countChain);

      const result = await listTasks({ page: 1, limit: 20 });
      expect(result.pagination.totalPages).toBe(3); // ceil(45/20)
    });
  });
});
