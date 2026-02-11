import { vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

/**
 * Creates a mock Express Request object.
 */
export function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    path: "/test",
    method: "GET",
    ...overrides,
  } as unknown as Request;
}

/**
 * Creates a mock Express Response object with chainable methods.
 */
export function mockResponse(): Response & {
  _status: number;
  _json: unknown;
  _headers: Record<string, string>;
  _sent: unknown;
} {
  const res = {
    _status: 200,
    _json: undefined as unknown,
    _headers: {} as Record<string, string>,
    _sent: undefined as unknown,
    status: vi.fn().mockImplementation(function (this: any, code: number) {
      this._status = code;
      return this;
    }),
    json: vi.fn().mockImplementation(function (this: any, data: unknown) {
      this._json = data;
      return this;
    }),
    send: vi.fn().mockImplementation(function (this: any, data: unknown) {
      this._sent = data;
      return this;
    }),
    setHeader: vi.fn().mockImplementation(function (this: any, name: string, value: string) {
      this._headers[name] = value;
      return this;
    }),
  };
  return res as unknown as ReturnType<typeof mockResponse>;
}

/**
 * Creates a mock next function.
 */
export function mockNext(): NextFunction & ReturnType<typeof vi.fn> {
  return vi.fn() as NextFunction & ReturnType<typeof vi.fn>;
}
