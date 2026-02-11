import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUserPayload } from "../../utils/mocks/auth.mock.js";
import { mockPreferences } from "../../utils/mocks/fixtures.js";

vi.mock("../../../src/modules/preferences/preferences.service.js", () => ({
  createPreferences: vi.fn(),
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  deletePreferences: vi.fn(),
}));

import * as service from "../../../src/modules/preferences/preferences.service.js";
import { create, get, update, remove } from "../../../src/modules/preferences/preferences.controller.js";

describe("preferences.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("create returns 201", async () => {
    vi.mocked(service.createPreferences).mockResolvedValue(mockPreferences as any);
    const req = mockRequest({ user: mockUserPayload, body: { preferredRoles: ["dev"], locations: ["NYC"] } } as any);
    const res = mockResponse();
    await create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("get returns 200", async () => {
    vi.mocked(service.getPreferences).mockResolvedValue(mockPreferences as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await get(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("update passes body to service", async () => {
    vi.mocked(service.updatePreferences).mockResolvedValue(mockPreferences as any);
    const req = mockRequest({ user: mockUserPayload, body: { remotePreference: true } } as any);
    const res = mockResponse();
    await update(req, res);
    expect(service.updatePreferences).toHaveBeenCalledWith(mockUserPayload.userId, { remotePreference: true });
  });

  it("remove returns 200", async () => {
    vi.mocked(service.deletePreferences).mockResolvedValue({ message: "deleted" });
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await remove(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
