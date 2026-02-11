import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  Conflict,
} from "../../src/lib/errors.js";

describe("AppError", () => {
  it("creates an error with message and status code", () => {
    const err = new AppError("Something broke", 500);
    expect(err.message).toBe("Something broke");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("supports non-operational errors", () => {
    const err = new AppError("Fatal", 500, false);
    expect(err.isOperational).toBe(false);
  });

  it("preserves prototype chain (instanceof works)", () => {
    const err = new AppError("test", 400);
    expect(err instanceof AppError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe("Error factory functions", () => {
  it("BadRequest creates 400 error", () => {
    const err = BadRequest("Invalid input");
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("Invalid input");
  });

  it("BadRequest uses default message", () => {
    const err = BadRequest();
    expect(err.message).toBe("Bad request");
  });

  it("Unauthorized creates 401 error", () => {
    const err = Unauthorized("No token");
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("No token");
  });

  it("Forbidden creates 403 error", () => {
    const err = Forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Forbidden");
  });

  it("NotFound creates 404 error", () => {
    const err = NotFound("Resource missing");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Resource missing");
  });

  it("Conflict creates 409 error", () => {
    const err = Conflict("Already exists");
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe("Already exists");
  });
});
