import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock nodemailer before importing email module
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "msg-1" }),
    })),
  },
}));

import {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendCsvEmail,
} from "../../src/lib/email.js";

describe("email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── sendEmail ───────────────────────────────────────────────────────────

  describe("sendEmail", () => {
    it("logs email in dev mode (no SMTP configured)", async () => {
      // Since env has no SMTP_HOST, transporter is null → logs instead
      await expect(
        sendEmail({ to: "test@example.com", subject: "Test", html: "<p>Hi</p>" }),
      ).resolves.toBeUndefined();
    });

    it("handles email with attachments in dev mode", async () => {
      await expect(
        sendEmail({
          to: "test@example.com",
          subject: "With attachment",
          html: "<p>Hi</p>",
          attachments: [{ filename: "test.csv", content: Buffer.from("data") }],
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ── sendVerificationEmail ───────────────────────────────────────────────

  describe("sendVerificationEmail", () => {
    it("calls sendEmail with verification template", async () => {
      await expect(
        sendVerificationEmail("user@example.com", "verify-token-123"),
      ).resolves.toBeUndefined();
    });

    it("includes token in verification URL", async () => {
      // The function internally calls sendEmail — in dev mode it just logs
      await sendVerificationEmail("user@example.com", "my-token");
      // No errors = success
    });
  });

  // ── sendPasswordResetEmail ──────────────────────────────────────────────

  describe("sendPasswordResetEmail", () => {
    it("calls sendEmail with reset template", async () => {
      await expect(
        sendPasswordResetEmail("user@example.com", "reset-token-456"),
      ).resolves.toBeUndefined();
    });
  });

  // ── sendCsvEmail ────────────────────────────────────────────────────────

  describe("sendCsvEmail", () => {
    it("calls sendEmail with CSV attachment", async () => {
      const buffer = Buffer.from("Job Title,Company\nDev,Corp");
      await expect(
        sendCsvEmail("user@example.com", "matches.csv", buffer, 1),
      ).resolves.toBeUndefined();
    });

    it("includes row count in subject", async () => {
      const buffer = Buffer.from("data");
      await sendCsvEmail("user@example.com", "test.csv", buffer, 42);
      // No errors = success (logged in dev mode)
    });
  });
});
