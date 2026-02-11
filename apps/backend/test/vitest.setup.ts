import { vi } from "vitest";

// ── Mock config/env.ts globally ────────────────────────────────────────────
vi.mock("../src/config/env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 8000,
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    JWT_SECRET: "test-jwt-secret-that-is-at-least-32-chars-long",
    JWT_EXPIRES_IN: "7d",
    BCRYPT_SALT_ROUNDS: 4, // fast for tests
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
vi.mock("../src/lib/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
  },
}));
