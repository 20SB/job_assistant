import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUserPayload } from "../../utils/mocks/auth.mock.js";
import { mockNotificationPrefs, mockNotification } from "../../utils/mocks/fixtures.js";

vi.mock("../../../src/modules/notifications/notifications.service.js", () => ({
  createPreferences: vi.fn(),
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  deletePreferences: vi.fn(),
  listNotifications: vi.fn(),
  getNotification: vi.fn(),
}));
vi.mock("../../../src/modules/notifications/notifications.schemas.js", () => ({
  listNotificationsSchema: { parse: vi.fn((q: any) => ({ page: 1, limit: 20, ...q })) },
}));

import * as service from "../../../src/modules/notifications/notifications.service.js";
import {
  createPreferences, getPreferences, updatePreferences, deletePreferences,
  listNotifications, getNotification,
} from "../../../src/modules/notifications/notifications.controller.js";

describe("notifications.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("createPreferences returns 201", async () => {
    vi.mocked(service.createPreferences).mockResolvedValue(mockNotificationPrefs as any);
    const req = mockRequest({ user: mockUserPayload, body: {} } as any);
    const res = mockResponse();
    await createPreferences(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("getPreferences returns 200", async () => {
    vi.mocked(service.getPreferences).mockResolvedValue(mockNotificationPrefs as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await getPreferences(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("updatePreferences passes body", async () => {
    vi.mocked(service.updatePreferences).mockResolvedValue(mockNotificationPrefs as any);
    const req = mockRequest({ user: mockUserPayload, body: { marketingEmails: true } } as any);
    const res = mockResponse();
    await updatePreferences(req, res);
    expect(service.updatePreferences).toHaveBeenCalledWith(mockUserPayload.userId, { marketingEmails: true });
  });

  it("deletePreferences returns 200", async () => {
    vi.mocked(service.deletePreferences).mockResolvedValue({ message: "deleted" });
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await deletePreferences(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("listNotifications returns 200", async () => {
    vi.mocked(service.listNotifications).mockResolvedValue({ items: [], pagination: {} } as any);
    const req = mockRequest({ user: mockUserPayload, query: {} } as any);
    const res = mockResponse();
    await listNotifications(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("getNotification passes params.id", async () => {
    vi.mocked(service.getNotification).mockResolvedValue(mockNotification as any);
    const req = mockRequest({ user: mockUserPayload, params: { id: "n-1" } } as any);
    const res = mockResponse();
    await getNotification(req, res);
    expect(service.getNotification).toHaveBeenCalledWith(mockUserPayload.userId, "n-1");
  });
});
