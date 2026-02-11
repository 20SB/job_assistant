import { describe, it, expect } from "vitest";
import { errorHandler } from "../../src/lib/error-handler.js";
import { AppError } from "../../src/lib/errors.js";
import { mockRequest, mockResponse, mockNext } from "../utils/mocks/request.mock.js";

describe("errorHandler", () => {
  it("handles AppError with correct status code and message", () => {
    const err = new AppError("Not found", 404);
    const req = mockRequest({ path: "/test", method: "GET" });
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Not found",
    });
  });

  it("handles generic Error with 500 and generic message", () => {
    const err = new Error("Something unexpected");
    const req = mockRequest({ path: "/test", method: "POST" });
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal server error",
    });
  });

  it("does not leak internal error details for generic errors", () => {
    const err = new Error("DB connection lost: password=secret");
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res._json).toEqual({
      status: "error",
      message: "Internal server error",
    });
  });

  it("handles AppError with various status codes", () => {
    const err = new AppError("Conflict", 409);
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res._json).toEqual({ status: "error", message: "Conflict" });
  });

  it("preserves error message for AppError", () => {
    const err = new AppError("Email already registered", 409);
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res._json).toEqual({
      status: "error",
      message: "Email already registered",
    });
  });
});
