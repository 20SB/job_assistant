import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockPlan, mockFreePlan, mockSubscription } from "../../utils/mocks/fixtures.js";
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
vi.mock("../../../src/modules/notifications/notifications.service.js", () => ({
  notify: vi.fn().mockResolvedValue(null),
}));

import { db } from "../../../src/db/index.js";
const mDb = db as unknown as MockDb;

import {
  listPlans,
  getPlanById,
  subscribe,
  getMySubscription,
  cancelSubscription,
  listPayments,
  getUserPlan,
} from "../../../src/modules/subscriptions/subscriptions.service.js";

describe("subscriptions.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── listPlans ───────────────────────────────────────────────────────────

  describe("listPlans", () => {
    it("returns active plans", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockPlan, mockFreePlan]));
      const result = await listPlans();
      expect(result).toHaveLength(2);
    });
  });

  // ── getPlanById ─────────────────────────────────────────────────────────

  describe("getPlanById", () => {
    it("returns plan when found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockPlan]));
      const result = await getPlanById("plan-uuid-4444");
      expect(result).toEqual(mockPlan);
    });

    it("throws 404 when plan not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getPlanById("nonexistent")).rejects.toThrow(AppError);
    });
  });

  // ── subscribe ───────────────────────────────────────────────────────────

  describe("subscribe", () => {
    it("creates subscription for valid plan", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockPlan])) // plan exists
        .mockReturnValueOnce(mockSelectChain([])); // no existing subscription
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([mockSubscription])) // subscription
        .mockReturnValueOnce(mockInsertChain([{}])); // payment

      const result = await subscribe("user-uuid-1234", "plan-uuid-4444");
      expect(result.subscription).toEqual(mockSubscription);
      expect(result.plan).toEqual(mockPlan);
    });

    it("throws 404 for inactive/missing plan", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(subscribe("user-1", "bad-plan")).rejects.toThrow(AppError);
    });

    it("throws 409 when user already has active subscription", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockPlan])) // plan exists
        .mockReturnValueOnce(mockSelectChain([{ id: "existing-sub", status: "active" }])); // active sub

      await expect(subscribe("user-1", "plan-1")).rejects.toThrow(AppError);

      // Re-mock for the second call in the try/catch
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockPlan]))
        .mockReturnValueOnce(mockSelectChain([{ id: "existing-sub", status: "active" }]));
      try { await subscribe("user-1", "plan-1"); } catch (e) {
        expect((e as AppError).statusCode).toBe(409);
      }
    });

    it("does not create payment for free plan", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockFreePlan]))
        .mockReturnValueOnce(mockSelectChain([]));
      mDb.insert.mockReturnValue(mockInsertChain([mockSubscription]));

      await subscribe("user-1", "plan-free");

      // Only 1 insert (subscription), not 2 (subscription + payment)
      expect(mDb.insert).toHaveBeenCalledTimes(1);
    });

    it("creates payment for paid plan", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockPlan])) // paid plan
        .mockReturnValueOnce(mockSelectChain([]));
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([mockSubscription]))
        .mockReturnValueOnce(mockInsertChain([{}]));

      await subscribe("user-1", "plan-paid");

      expect(mDb.insert).toHaveBeenCalledTimes(2);
    });

    it("sends notification (fire-and-forget)", async () => {
      const { notify } = await import("../../../src/modules/notifications/notifications.service.js");
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockPlan]))
        .mockReturnValueOnce(mockSelectChain([]));
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([mockSubscription]))
        .mockReturnValueOnce(mockInsertChain([{}]));

      await subscribe("user-1", "plan-1");

      expect(notify).toHaveBeenCalledWith(
        "user-1",
        "subscription_renewal",
        expect.objectContaining({ subject: expect.any(String) }),
      );
    });
  });

  // ── getMySubscription ───────────────────────────────────────────────────

  describe("getMySubscription", () => {
    it("returns subscription with plan", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockSubscription]))
        .mockReturnValueOnce(mockSelectChain([mockPlan]));

      const result = await getMySubscription("user-uuid-1234");
      expect(result.subscription).toEqual(mockSubscription);
      expect(result.plan).toEqual(mockPlan);
    });

    it("throws 404 when no active subscription", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getMySubscription("user-1")).rejects.toThrow(AppError);
    });
  });

  // ── cancelSubscription ──────────────────────────────────────────────────

  describe("cancelSubscription", () => {
    it("cancels active subscription", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockSubscription]));
      const cancelled = { ...mockSubscription, status: "cancelled" };
      mDb.update.mockReturnValue(mockUpdateChain([cancelled]));

      const result = await cancelSubscription("user-uuid-1234");
      expect(result.status).toBe("cancelled");
    });

    it("throws 404 when no active subscription to cancel", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(cancelSubscription("user-1")).rejects.toThrow(AppError);
    });
  });

  // ── listPayments ────────────────────────────────────────────────────────

  describe("listPayments", () => {
    it("returns user payments", async () => {
      const payments = [{ id: "pay-1", amount: "499" }];
      mDb.select.mockReturnValue(mockSelectChain(payments));

      const result = await listPayments("user-1");
      expect(result).toEqual(payments);
    });
  });

  // ── getUserPlan ─────────────────────────────────────────────────────────

  describe("getUserPlan", () => {
    it("returns plan when user has active subscription", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ planId: "p-1", status: "active", currentPeriodEnd: new Date() }]))
        .mockReturnValueOnce(mockSelectChain([mockPlan]));

      const result = await getUserPlan("user-1");
      expect(result).toEqual(mockPlan);
    });

    it("returns null when no active subscription", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      const result = await getUserPlan("user-1");
      expect(result).toBeNull();
    });

    it("returns null when plan not found for subscription", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ planId: "orphan", status: "active" }]))
        .mockReturnValueOnce(mockSelectChain([]));

      const result = await getUserPlan("user-1");
      expect(result).toBeNull();
    });
  });
});
