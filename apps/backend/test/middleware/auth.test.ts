import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { authenticate } from "../../src/middleware/auth.js";
import { AppError } from "../../src/lib/errors.js";
import { mockRequest, mockResponse, mockNext } from "../utils/mocks/request.mock.js";

vi.mock("jsonwebtoken");

describe("authenticate middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws 401 when no authorization header", () => {
    const req = mockRequest({ headers: {} });
    expect(() => authenticate(req, mockResponse(), mockNext())).toThrow(AppError);
    try { authenticate(req, mockResponse(), mockNext()); } catch (e) {
      expect((e as AppError).statusCode).toBe(401);
      expect((e as AppError).message).toContain("Missing");
    }
  });

  it("throws 401 when header does not start with Bearer", () => {
    const req = mockRequest({ headers: { authorization: "Basic abc123" } });
    expect(() => authenticate(req, mockResponse(), mockNext())).toThrow(AppError);
  });

  it("throws 401 when token is invalid", () => {
    vi.mocked(jwt.verify).mockImplementation(() => { throw new Error("invalid"); });
    const req = mockRequest({ headers: { authorization: "Bearer invalid-token" } });
    expect(() => authenticate(req, mockResponse(), mockNext())).toThrow(AppError);
    try { authenticate(req, mockResponse(), mockNext()); } catch (e) {
      expect((e as AppError).message).toContain("Invalid or expired");
    }
  });

  it("sets req.user and calls next on valid token", () => {
    const payload = { userId: "user-1", email: "test@example.com", role: "user" };
    vi.mocked(jwt.verify).mockReturnValue(payload as any);
    const req = mockRequest({ headers: { authorization: "Bearer valid-token" } });
    const next = mockNext();

    authenticate(req, mockResponse(), next);

    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledOnce();
  });

  it("extracts token correctly (strips 'Bearer ')", () => {
    const payload = { userId: "user-1", email: "test@example.com", role: "user" };
    vi.mocked(jwt.verify).mockReturnValue(payload as any);
    const req = mockRequest({ headers: { authorization: "Bearer my-jwt-token" } });

    authenticate(req, mockResponse(), mockNext());

    expect(jwt.verify).toHaveBeenCalledWith("my-jwt-token", expect.any(String));
  });

  it("throws 401 when authorization header is empty Bearer", () => {
    vi.mocked(jwt.verify).mockImplementation(() => { throw new Error("invalid"); });
    const req = mockRequest({ headers: { authorization: "Bearer " } });
    expect(() => authenticate(req, mockResponse(), mockNext())).toThrow(AppError);
  });
});
