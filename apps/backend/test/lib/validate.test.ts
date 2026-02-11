import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validate } from "../../src/lib/validate.js";
import { AppError } from "../../src/lib/errors.js";
import { mockRequest, mockResponse, mockNext } from "../utils/mocks/request.mock.js";

const testSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().positive(),
});

describe("validate middleware", () => {
  it("passes valid body and replaces req.body with parsed data", () => {
    const req = mockRequest({ body: { name: "Alice", age: 30 } });
    const res = mockResponse();
    const next = mockNext();

    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: "Alice", age: 30 });
  });

  it("throws AppError 400 on invalid body", () => {
    const req = mockRequest({ body: { name: "", age: -5 } });
    const res = mockResponse();
    const next = mockNext();

    expect(() => validate(testSchema)(req, res, next)).toThrow(AppError);

    try {
      validate(testSchema)(req, res, next);
    } catch (err) {
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it("includes field paths in error message", () => {
    const req = mockRequest({ body: {} });
    const res = mockResponse();
    const next = mockNext();

    try {
      validate(testSchema)(req, res, next);
    } catch (err) {
      expect((err as AppError).message).toContain("name");
    }
  });

  it("validates query params when target is 'query'", () => {
    const querySchema = z.object({ page: z.coerce.number().default(1) });
    const req = mockRequest({ query: { page: "3" } as any });
    const res = mockResponse();
    const next = mockNext();

    validate(querySchema, "query")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.query).toEqual({ page: 3 });
  });

  it("validates params when target is 'params'", () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const validUuid = "550e8400-e29b-41d4-a716-446655440000";
    const req = mockRequest({ params: { id: validUuid } as any });
    const res = mockResponse();
    const next = mockNext();

    validate(paramsSchema, "params")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.params).toEqual({ id: validUuid });
  });

  it("throws on invalid params", () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const req = mockRequest({ params: { id: "not-a-uuid" } as any });
    const res = mockResponse();
    const next = mockNext();

    expect(() => validate(paramsSchema, "params")(req, res, next)).toThrow(AppError);
  });

  it("defaults target to body", () => {
    const req = mockRequest({ body: { name: "Bob", age: 25 } });
    const res = mockResponse();
    const next = mockNext();

    validate(testSchema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("coerces string numbers in body", () => {
    const req = mockRequest({ body: { name: "Charlie", age: "42" } });
    const res = mockResponse();
    const next = mockNext();

    validate(testSchema)(req, res, next);

    expect(req.body.age).toBe(42);
  });
});
