import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockNotificationPrefs, mockNotification, mockUser } from "../../utils/mocks/fixtures.js";
import {
  mockSelectChain,
  mockInsertChain,
  mockUpdateChain,
  mockDeleteChain,
  type MockDb,
} from "../../utils/mocks/db.mock.js";

vi.mock("../../../src/db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("../../../src/lib/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { db } from "../../../src/db/index.js";
import { sendEmail } from "../../../src/lib/email.js";
const mDb = db as unknown as MockDb;

import {
  createPreferences,
  getPreferences,
  updatePreferences,
  deletePreferences,
  listNotifications,
  getNotification,
  notify,
} from "../../../src/modules/notifications/notifications.service.js";

describe("notifications.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createPreferences ───────────────────────────────────────────────────

  describe("createPreferences", () => {
    it("creates notification preferences", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      mDb.insert.mockReturnValue(mockInsertChain([mockNotificationPrefs]));

      const result = await createPreferences("user-uuid-1234", {});
      expect(result).toEqual(mockNotificationPrefs);
    });

    it("throws 409 when preferences already exist", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "existing" }]));
      await expect(createPreferences("user-1", {})).rejects.toThrow(AppError);
      try { await createPreferences("user-1", {}); } catch (e) {
        expect((e as AppError).statusCode).toBe(409);
      }
    });

    it("sets default values", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      const insertChain = mockInsertChain([mockNotificationPrefs]);
      mDb.insert.mockReturnValue(insertChain);

      await createPreferences("user-1", {});

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          matchEmailFrequency: "daily",
          subscriptionEmails: true,
          paymentEmails: true,
          marketingEmails: false,
        }),
      );
    });
  });

  // ── getPreferences ──────────────────────────────────────────────────────

  describe("getPreferences", () => {
    it("returns preferences", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockNotificationPrefs]));
      const result = await getPreferences("user-1");
      expect(result).toEqual(mockNotificationPrefs);
    });

    it("throws 404 when not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getPreferences("user-1")).rejects.toThrow(AppError);
    });
  });

  // ── updatePreferences ───────────────────────────────────────────────────

  describe("updatePreferences", () => {
    it("updates existing preferences", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockNotificationPrefs]));
      const updated = { ...mockNotificationPrefs, marketingEmails: true };
      mDb.update.mockReturnValue(mockUpdateChain([updated]));

      const result = await updatePreferences("user-1", { marketingEmails: true });
      expect(result.marketingEmails).toBe(true);
    });

    it("throws 404 when preferences don't exist", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(updatePreferences("user-1", {})).rejects.toThrow(AppError);
    });
  });

  // ── deletePreferences ───────────────────────────────────────────────────

  describe("deletePreferences", () => {
    it("deletes preferences", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "np-1" }]));
      mDb.delete.mockReturnValue(mockDeleteChain());

      const result = await deletePreferences("user-1");
      expect(result.message).toContain("deleted");
    });

    it("throws 404 when not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(deletePreferences("user-1")).rejects.toThrow(AppError);
    });
  });

  // ── listNotifications ───────────────────────────────────────────────────

  describe("listNotifications", () => {
    it("returns paginated notifications", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([mockNotification]))
        .mockReturnValueOnce(mockSelectChain([{ count: 1 }]));

      const result = await listNotifications("user-1", { page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("filters by type when provided", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([]))
        .mockReturnValueOnce(mockSelectChain([{ count: 0 }]));

      const result = await listNotifications("user-1", {
        page: 1,
        limit: 20,
        type: "match_batch",
      });
      expect(result.items).toEqual([]);
    });
  });

  // ── getNotification ─────────────────────────────────────────────────────

  describe("getNotification", () => {
    it("returns notification when found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockNotification]));
      const result = await getNotification("user-1", "notif-1");
      expect(result).toEqual(mockNotification);
    });

    it("throws 404 when not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getNotification("user-1", "notif-1")).rejects.toThrow(AppError);
    });
  });

  // ── notify ──────────────────────────────────────────────────────────────

  describe("notify", () => {
    it("sends email and creates notification record", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ email: "test@example.com" }])) // user
        .mockReturnValueOnce(mockSelectChain([mockNotificationPrefs])); // prefs
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([mockNotification])) // notification
        .mockReturnValueOnce(mockInsertChain([{}])); // email delivery log
      mDb.update.mockReturnValue(mockUpdateChain([]));

      const result = await notify("user-1", "match_batch", {
        subject: "Matches Ready",
        html: "<h1>Done</h1>",
      });

      expect(result).toEqual(mockNotification);
      expect(sendEmail).toHaveBeenCalled();
    });

    it("returns null when user not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));

      const result = await notify("unknown", "match_batch", {
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBeNull();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("skips subscription email when user opted out", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ email: "test@example.com" }]))
        .mockReturnValueOnce(mockSelectChain([{ ...mockNotificationPrefs, subscriptionEmails: false }]));

      const result = await notify("user-1", "subscription_renewal", {
        subject: "Sub renewed",
        html: "<p>Renewed</p>",
      });

      expect(result).toBeNull();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("skips payment email when user opted out", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ email: "test@example.com" }]))
        .mockReturnValueOnce(mockSelectChain([{ ...mockNotificationPrefs, paymentEmails: false }]));

      const result = await notify("user-1", "payment_failure", {
        subject: "Payment failed",
        html: "<p>Failed</p>",
      });

      expect(result).toBeNull();
    });

    it("still sends when no preferences configured (no opt-out)", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ email: "test@example.com" }]))
        .mockReturnValueOnce(mockSelectChain([])); // no prefs
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([mockNotification]))
        .mockReturnValueOnce(mockInsertChain([{}]));
      mDb.update.mockReturnValue(mockUpdateChain([]));

      await notify("user-1", "match_batch", {
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(sendEmail).toHaveBeenCalled();
    });

    it("logs delivery failure but still creates notification", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ email: "test@example.com" }]))
        .mockReturnValueOnce(mockSelectChain([]));
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([mockNotification]))
        .mockReturnValueOnce(mockInsertChain([{}]));
      mDb.update.mockReturnValue(mockUpdateChain([]));
      vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP error"));

      const result = await notify("user-1", "welcome", {
        subject: "Welcome",
        html: "<p>Hi</p>",
      });

      expect(result).toEqual(mockNotification);
    });

    it("passes attachments to sendEmail", async () => {
      mDb.select
        .mockReturnValueOnce(mockSelectChain([{ email: "test@example.com" }]))
        .mockReturnValueOnce(mockSelectChain([]));
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([mockNotification]))
        .mockReturnValueOnce(mockInsertChain([{}]));
      mDb.update.mockReturnValue(mockUpdateChain([]));

      const attachment = { filename: "test.csv", content: Buffer.from("data") };
      await notify("user-1", "match_batch", {
        subject: "CSV",
        html: "<p>Here</p>",
        attachments: [attachment],
      });

      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [attachment],
        }),
      );
    });
  });
});
