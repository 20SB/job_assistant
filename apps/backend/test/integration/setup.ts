import { vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { db } from "../../src/db/index.js";
import type { MockDb } from "../utils/mocks/db.mock.js";

// ── Mock config/env.ts globally ────────────────────────────────────────────
vi.mock("../../src/config/env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 8000,
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    JWT_SECRET: "test-jwt-secret-that-is-at-least-32-chars-long",
    JWT_EXPIRES_IN: "7d",
    BCRYPT_SALT_ROUNDS: 4,
    SMTP_HOST: undefined,
    SMTP_PORT: undefined,
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
    EMAIL_FROM: undefined,
    FRONTEND_URL: "http://localhost:3000",
    ADZUNA_APP_ID: "test-app-id",
    ADZUNA_APP_KEY: "test-app-key",
    ADZUNA_BASE_URL: "https://api.adzuna.com/v1/api",
    ADZUNA_COUNTRY: "in",
    WORKER_POLL_INTERVAL_MS: 5000,
  },
}));

// ── Mock lib/logger.ts globally ────────────────────────────────────────────
vi.mock("../../src/lib/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
  },
}));

// ── Mock db/index.js ───────────────────────────────────────────────────────
vi.mock("../../src/db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
    query: {
      users: { findFirst: vi.fn() },
    },
  },
}));

// ── Mock lib/email.js (skip real SMTP) ─────────────────────────────────────
vi.mock("../../src/lib/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendCsvEmail: vi.fn().mockResolvedValue(undefined),
}));

// ── Mock lib/task-processor.js (noop) ──────────────────────────────────────
vi.mock("../../src/lib/task-processor.js", () => ({
  startTaskProcessor: vi.fn(),
}));

// ── Global beforeEach: clear call history + reset DB mock queues ───────────
const mDb = db as unknown as MockDb;
beforeEach(() => {
  vi.clearAllMocks();
  // Reset DB mocks to clear leftover mockReturnValueOnce queues,
  // but leave bcrypt/email/logger implementations intact
  mDb.select.mockReset();
  mDb.insert.mockReset();
  mDb.update.mockReset();
  mDb.delete.mockReset();
  mDb.execute.mockReset();
});

// ── JWT helpers ────────────────────────────────────────────────────────────
const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";

export function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const userToken = generateToken({
  userId: "user-uuid-1234",
  email: "test@example.com",
  role: "user",
});

export const adminToken = generateToken({
  userId: "admin-uuid-5678",
  email: "admin@example.com",
  role: "admin",
});
