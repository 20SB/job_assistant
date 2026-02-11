import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUser } from "../../utils/mocks/fixtures.js";

vi.mock("../../../src/modules/admin/admin.service.js", () => ({
  listUsers: vi.fn(),
  getUserDetails: vi.fn(),
  listJobFetchLogs: vi.fn(),
  listMatchingLogs: vi.fn(),
  listEmailDeliveryLogs: vi.fn(),
  listTaskQueue: vi.fn(),
  getDashboardStats: vi.fn(),
}));

import * as service from "../../../src/modules/admin/admin.service.js";
import {
  listUsers, getUserDetails, listJobFetchLogs, listMatchingLogs,
  listEmailDeliveryLogs, listTaskQueue, getDashboardStats,
} from "../../../src/modules/admin/admin.controller.js";

describe("admin.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("listUsers returns 200", async () => {
    vi.mocked(service.listUsers).mockResolvedValue({ users: [], pagination: {} } as any);
    const req = mockRequest({ query: { page: 1, limit: 20 } as any });
    const res = mockResponse();
    await listUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getUserDetails passes params.id", async () => {
    vi.mocked(service.getUserDetails).mockResolvedValue(mockUser as any);
    const req = mockRequest({ params: { id: "u-1" } } as any);
    const res = mockResponse();
    await getUserDetails(req, res);
    expect(service.getUserDetails).toHaveBeenCalledWith("u-1");
  });

  it("listJobFetchLogs returns 200", async () => {
    vi.mocked(service.listJobFetchLogs).mockResolvedValue({ logs: [], pagination: {} } as any);
    const req = mockRequest({ query: { page: 1, limit: 20 } as any });
    const res = mockResponse();
    await listJobFetchLogs(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("listMatchingLogs returns 200", async () => {
    vi.mocked(service.listMatchingLogs).mockResolvedValue({ logs: [], pagination: {} } as any);
    const req = mockRequest({ query: { page: 1, limit: 20 } as any });
    const res = mockResponse();
    await listMatchingLogs(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("listEmailDeliveryLogs returns 200", async () => {
    vi.mocked(service.listEmailDeliveryLogs).mockResolvedValue({ logs: [], pagination: {} } as any);
    const req = mockRequest({ query: { page: 1, limit: 20 } as any });
    const res = mockResponse();
    await listEmailDeliveryLogs(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("listTaskQueue returns 200", async () => {
    vi.mocked(service.listTaskQueue).mockResolvedValue({ tasks: [], pagination: {} } as any);
    const req = mockRequest({ query: { page: 1, limit: 20 } as any });
    const res = mockResponse();
    await listTaskQueue(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getDashboardStats returns 200", async () => {
    vi.mocked(service.getDashboardStats).mockResolvedValue({} as any);
    const req = mockRequest();
    const res = mockResponse();
    await getDashboardStats(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
