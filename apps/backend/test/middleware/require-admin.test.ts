import { describe, it, expect } from "vitest";
import { requireAdmin } from "../../src/middleware/require-admin.js";
import { AppError } from "../../src/lib/errors.js";
import { mockRequest, mockResponse, mockNext } from "../utils/mocks/request.mock.js";
import { mockUserPayload, mockAdminPayload } from "../utils/mocks/auth.mock.js";

describe("requireAdmin middleware", () => {
  it("throws 401 when req.user is not set", () => {
    const req = mockRequest({ user: undefined });
    expect(() => requireAdmin(req, mockResponse(), mockNext())).toThrow(AppError);
    try { requireAdmin(req, mockResponse(), mockNext()); } catch (e) {
      expect((e as AppError).statusCode).toBe(401);
    }
  });

  it("throws 403 when user role is not admin", () => {
    const req = mockRequest({ user: mockUserPayload } as any);
    expect(() => requireAdmin(req, mockResponse(), mockNext())).toThrow(AppError);
    try { requireAdmin(req, mockResponse(), mockNext()); } catch (e) {
      expect((e as AppError).statusCode).toBe(403);
      expect((e as AppError).message).toContain("Admin");
    }
  });

  it("calls next when user is admin", () => {
    const req = mockRequest({ user: mockAdminPayload } as any);
    const next = mockNext();
    requireAdmin(req, mockResponse(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("does not throw for admin role", () => {
    const req = mockRequest({ user: mockAdminPayload } as any);
    expect(() => requireAdmin(req, mockResponse(), mockNext())).not.toThrow();
  });
});
