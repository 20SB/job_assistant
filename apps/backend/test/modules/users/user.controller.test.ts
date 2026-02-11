import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRequest, mockResponse } from "../../utils/mocks/request.mock.js";
import { mockUserPayload } from "../../utils/mocks/auth.mock.js";

vi.mock("../../../src/modules/users/user.service.js", () => ({
  signup: vi.fn(),
  login: vi.fn(),
  verifyEmail: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

import * as userService from "../../../src/modules/users/user.service.js";
import {
  signup, login, verifyEmail, forgotPassword, resetPassword, getMe, updateMe,
} from "../../../src/modules/users/user.controller.js";

describe("user.controller", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("signup returns 201 with user data", async () => {
    const data = { user: { id: "u-1" } };
    vi.mocked(userService.signup).mockResolvedValue(data);
    const req = mockRequest({ body: { email: "a@b.com", password: "pass" } });
    const res = mockResponse();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: "success", data });
  });

  it("login returns 200 with token", async () => {
    const data = { token: "jwt", user: { id: "u-1" } };
    vi.mocked(userService.login).mockResolvedValue(data as any);
    const req = mockRequest({ body: { email: "a@b.com", password: "pass" } });
    const res = mockResponse();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("verifyEmail calls service with token", async () => {
    vi.mocked(userService.verifyEmail).mockResolvedValue({ message: "ok" });
    const req = mockRequest({ body: { token: "abc" } });
    const res = mockResponse();
    await verifyEmail(req, res);
    expect(userService.verifyEmail).toHaveBeenCalledWith("abc");
  });

  it("forgotPassword calls service with email", async () => {
    vi.mocked(userService.forgotPassword).mockResolvedValue({ message: "ok" });
    const req = mockRequest({ body: { email: "a@b.com" } });
    const res = mockResponse();
    await forgotPassword(req, res);
    expect(userService.forgotPassword).toHaveBeenCalledWith("a@b.com");
  });

  it("resetPassword calls service with token and password", async () => {
    vi.mocked(userService.resetPassword).mockResolvedValue({ message: "ok" });
    const req = mockRequest({ body: { token: "tok", password: "new" } });
    const res = mockResponse();
    await resetPassword(req, res);
    expect(userService.resetPassword).toHaveBeenCalledWith("tok", "new");
  });

  it("getMe uses req.user.userId", async () => {
    vi.mocked(userService.getProfile).mockResolvedValue({ id: "u-1" } as any);
    const req = mockRequest({ user: mockUserPayload } as any);
    const res = mockResponse();
    await getMe(req, res);
    expect(userService.getProfile).toHaveBeenCalledWith(mockUserPayload.userId);
  });

  it("updateMe passes req.body to service", async () => {
    vi.mocked(userService.updateProfile).mockResolvedValue({ id: "u-1" } as any);
    const req = mockRequest({ user: mockUserPayload, body: { email: "new@b.com" } } as any);
    const res = mockResponse();
    await updateMe(req, res);
    expect(userService.updateProfile).toHaveBeenCalledWith(mockUserPayload.userId, { email: "new@b.com" });
  });
});
