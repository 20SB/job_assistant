import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUserPayload } from "../../utils/mocks/auth.mock.js";

vi.mock("../../../src/modules/matching/matching.service.js", () => ({
  listBatches: vi.fn(),
  getBatchWithMatches: vi.fn(),
  listMatches: vi.fn(),
  toggleShortlist: vi.fn(),
  markViewed: vi.fn(),
}));
vi.mock("../../../src/modules/tasks/tasks.service.js", () => ({
  enqueue: vi.fn(),
}));
vi.mock("../../../src/modules/matching/matching.schemas.js", () => ({
  listMatchesSchema: { parse: vi.fn((q: any) => ({ page: 1, limit: 20, ...q })) },
}));

import * as service from "../../../src/modules/matching/matching.service.js";
import * as tasksService from "../../../src/modules/tasks/tasks.service.js";
import {
  runMatching, listBatches, getBatch, listMatches, toggleShortlist, markViewed,
} from "../../../src/modules/matching/matching.controller.js";

describe("matching.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("runMatching enqueues task and returns 202", async () => {
    vi.mocked(tasksService.enqueue).mockResolvedValue({ id: "t-1" } as any);
    const req = mockRequest({ user: mockUserPayload, body: { trigger: "scheduled" } } as any);
    const res = mockResponse();
    await runMatching(req, res);
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("listBatches returns 200", async () => {
    vi.mocked(service.listBatches).mockResolvedValue([]);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await listBatches(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getBatch passes params.id", async () => {
    vi.mocked(service.getBatchWithMatches).mockResolvedValue({ batch: {}, matches: [] } as any);
    const req = mockRequest({ user: mockUserPayload, params: { id: "b-1" } } as any);
    const res = mockResponse();
    await getBatch(req, res);
    expect(service.getBatchWithMatches).toHaveBeenCalledWith(mockUserPayload.userId, "b-1");
  });

  it("listMatches returns 200", async () => {
    vi.mocked(service.listMatches).mockResolvedValue({ items: [], pagination: {} } as any);
    const req = mockRequest({ user: mockUserPayload, query: {} } as any);
    const res = mockResponse();
    await listMatches(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("toggleShortlist passes params", async () => {
    vi.mocked(service.toggleShortlist).mockResolvedValue({} as any);
    const req = mockRequest({ user: mockUserPayload, params: { id: "m-1" } } as any);
    const res = mockResponse();
    await toggleShortlist(req, res);
    expect(service.toggleShortlist).toHaveBeenCalledWith(mockUserPayload.userId, "m-1");
  });

  it("markViewed passes params", async () => {
    vi.mocked(service.markViewed).mockResolvedValue({} as any);
    const req = mockRequest({ user: mockUserPayload, params: { id: "m-1" } } as any);
    const res = mockResponse();
    await markViewed(req, res);
    expect(service.markViewed).toHaveBeenCalledWith(mockUserPayload.userId, "m-1");
  });
});
