import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUserPayload } from "../../utils/mocks/auth.mock.js";
import { mockPlan, mockSubscription } from "../../utils/mocks/fixtures.js";

vi.mock("../../../src/modules/subscriptions/subscriptions.service.js", () => ({
  listPlans: vi.fn(),
  getPlanById: vi.fn(),
  subscribe: vi.fn(),
  getMySubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  listPayments: vi.fn(),
}));

import * as service from "../../../src/modules/subscriptions/subscriptions.service.js";
import {
  listPlans, getPlan, subscribe, getMySubscription, cancel, listPayments,
} from "../../../src/modules/subscriptions/subscriptions.controller.js";

describe("subscriptions.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("listPlans returns 200", async () => {
    vi.mocked(service.listPlans).mockResolvedValue([mockPlan] as any);
    const res = mockResponse();
    await listPlans(mockRequest(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getPlan passes params.id", async () => {
    vi.mocked(service.getPlanById).mockResolvedValue(mockPlan as any);
    const req = mockRequest({ params: { id: "plan-1" } } as any);
    const res = mockResponse();
    await getPlan(req, res);
    expect(service.getPlanById).toHaveBeenCalledWith("plan-1");
  });

  it("subscribe returns 201", async () => {
    vi.mocked(service.subscribe).mockResolvedValue({ subscription: mockSubscription, plan: mockPlan } as any);
    const req = mockRequest({ user: mockUserPayload, body: { planId: "p-1" } } as any);
    const res = mockResponse();
    await subscribe(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("getMySubscription returns 200", async () => {
    vi.mocked(service.getMySubscription).mockResolvedValue({ subscription: mockSubscription, plan: mockPlan } as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await getMySubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("cancel returns 200", async () => {
    vi.mocked(service.cancelSubscription).mockResolvedValue(mockSubscription as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await cancel(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("listPayments returns 200", async () => {
    vi.mocked(service.listPayments).mockResolvedValue([]);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await listPayments(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
