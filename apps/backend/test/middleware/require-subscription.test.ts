import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireSubscription } from "../../src/middleware/require-subscription.js";
import { AppError } from "../../src/lib/errors.js";
import { mockRequest, mockResponse, mockNext } from "../utils/mocks/request.mock.js";
import { mockUserPayload } from "../utils/mocks/auth.mock.js";

// Mock the getUserPlan function
vi.mock("../../src/modules/subscriptions/subscriptions.service.js", () => ({
  getUserPlan: vi.fn(),
}));

import { getUserPlan } from "../../src/modules/subscriptions/subscriptions.service.js";
const mGetUserPlan = vi.mocked(getUserPlan);

describe("requireSubscription middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 403 when user has no active subscription", async () => {
    mGetUserPlan.mockResolvedValue(null);
    const req = mockRequest({ user: mockUserPayload } as any);
    const middleware = requireSubscription("starter");

    await expect(middleware(req, mockResponse(), mockNext())).rejects.toThrow(AppError);
    try { await middleware(req, mockResponse(), mockNext()); } catch (e) {
      expect((e as AppError).statusCode).toBe(403);
      expect((e as AppError).message).toContain("active subscription");
    }
  });

  it("throws 403 when user plan is below required tier", async () => {
    mGetUserPlan.mockResolvedValue({ name: "free" } as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const middleware = requireSubscription("starter");

    await expect(middleware(req, mockResponse(), mockNext())).rejects.toThrow(AppError);
    try { await middleware(req, mockResponse(), mockNext()); } catch (e) {
      expect((e as AppError).message).toContain("starter");
    }
  });

  it("calls next when user plan meets required tier", async () => {
    mGetUserPlan.mockResolvedValue({ name: "pro" } as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const next = mockNext();

    await requireSubscription("starter")(req, mockResponse(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next when user plan exactly matches required tier", async () => {
    mGetUserPlan.mockResolvedValue({ name: "starter" } as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const next = mockNext();

    await requireSubscription("starter")(req, mockResponse(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("power_user plan passes all tier checks", async () => {
    mGetUserPlan.mockResolvedValue({ name: "power_user" } as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const next = mockNext();

    await requireSubscription("pro")(req, mockResponse(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("defaults to free tier when no minimum specified", async () => {
    mGetUserPlan.mockResolvedValue({ name: "free" } as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const next = mockNext();

    await requireSubscription()(req, mockResponse(), next);
    expect(next).toHaveBeenCalledOnce();
  });
});
