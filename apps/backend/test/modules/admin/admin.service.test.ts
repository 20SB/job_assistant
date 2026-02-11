import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockUser } from "../../utils/mocks/fixtures.js";
import {
  mockSelectChain,
  type MockDb,
} from "../../utils/mocks/db.mock.js";

vi.mock("../../../src/db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { db } from "../../../src/db/index.js";
const mDb = db as unknown as MockDb;

import {
  listUsers,
  getUserDetails,
  listJobFetchLogs,
  listMatchingLogs,
  listEmailDeliveryLogs,
  listTaskQueue,
  getDashboardStats,
} from "../../../src/modules/admin/admin.service.js";

describe("admin.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── listUsers ───────────────────────────────────────────────────────────

  describe("listUsers", () => {
    it("returns paginated users with subscription info", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 5 }])) // count
        .mockReturnValueOnce(mockSelectChain([mockUser])); // users

      const result = await listUsers({ page: 1, limit: 20 });
      expect(result.users).toBeDefined();
      expect(result.pagination.total).toBe(5);
    });

    it("returns empty list when no users", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([]));

      const result = await listUsers({ page: 1, limit: 20 });
      expect(result.users).toEqual([]);
    });

    it("calculates totalPages correctly", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 45 }]))
        .mockReturnValueOnce(mockSelectChain([]));

      const result = await listUsers({ page: 1, limit: 20 });
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  // ── getUserDetails ──────────────────────────────────────────────────────

  describe("getUserDetails", () => {
    it("returns user details with related data", async () => {
      mDb.query.users.findFirst.mockResolvedValue(mockUser);
      const result = await getUserDetails("user-uuid-1234");
      expect(result).toEqual(mockUser);
    });

    it("throws 404 when user not found", async () => {
      mDb.query.users.findFirst.mockResolvedValue(undefined);
      await expect(getUserDetails("bad")).rejects.toThrow(AppError);
    });
  });

  // ── listJobFetchLogs ────────────────────────────────────────────────────

  describe("listJobFetchLogs", () => {
    it("returns paginated logs", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 10 }]))
        .mockReturnValueOnce(mockSelectChain([{ id: "log-1" }]));

      const result = await listJobFetchLogs({ page: 1, limit: 20 });
      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(10);
    });
  });

  // ── listMatchingLogs ────────────────────────────────────────────────────

  describe("listMatchingLogs", () => {
    it("returns paginated matching logs", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 3 }]))
        .mockReturnValueOnce(mockSelectChain([{ id: "ml-1" }]));

      const result = await listMatchingLogs({ page: 1, limit: 20 });
      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(3);
    });
  });

  // ── listEmailDeliveryLogs ───────────────────────────────────────────────

  describe("listEmailDeliveryLogs", () => {
    it("returns paginated email logs", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 7 }]))
        .mockReturnValueOnce(mockSelectChain([{ id: "edl-1" }]));

      const result = await listEmailDeliveryLogs({ page: 1, limit: 20 });
      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(7);
    });
  });

  // ── listTaskQueue ───────────────────────────────────────────────────────

  describe("listTaskQueue", () => {
    it("returns paginated tasks", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 15 }]))
        .mockReturnValueOnce(mockSelectChain([{ id: "t-1" }]));

      const result = await listTaskQueue({ page: 1, limit: 20 });
      expect(result.tasks).toHaveLength(1);
      expect(result.pagination.total).toBe(15);
    });
  });

  // ── getDashboardStats ───────────────────────────────────────────────────

  describe("getDashboardStats", () => {
    it("returns aggregated stats", async () => {
      // Multiple select calls for different stats
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 100 }]))  // totalUsers
        .mockReturnValueOnce(mockSelectChain([{ count: 80 }]))   // activeUsers
        .mockReturnValueOnce(mockSelectChain([{ status: "active", count: 50 }, { status: "cancelled", count: 10 }])) // subscriptionStats
        .mockReturnValueOnce(mockSelectChain([{ count: 500 }]))  // totalJobs
        .mockReturnValueOnce(mockSelectChain([{ count: 3 }]))    // failedTasks
        .mockReturnValueOnce(mockSelectChain([{ status: "completed" }, { status: "completed" }, { status: "failed" }])) // recentFetches
        .mockReturnValueOnce(mockSelectChain([{ count: 200 }])); // totalMatchBatches

      const result = await getDashboardStats();

      expect(result.users.total).toBe(100);
      expect(result.users.active).toBe(80);
      expect(result.jobs.total).toBe(500);
      expect(result.tasks.failedLast24h).toBe(3);
      expect(result.matching.totalBatches).toBe(200);
    });

    it("handles empty results gracefully", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]));

      const result = await getDashboardStats();

      expect(result.users.total).toBe(0);
      expect(result.jobFetch.successRate).toBe(0);
    });

    it("calculates job fetch success rate correctly", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
        .mockReturnValueOnce(mockSelectChain([
          { status: "completed" },
          { status: "completed" },
          { status: "completed" },
          { status: "failed" },
          { status: "completed" },
        ]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]));

      const result = await getDashboardStats();
      expect(result.jobFetch.successRate).toBe(80); // 4/5 = 80%
    });
  });
});
