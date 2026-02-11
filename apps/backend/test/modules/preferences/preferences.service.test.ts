import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockPreferences } from "../../utils/mocks/fixtures.js";
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

import { db } from "../../../src/db/index.js";
const mDb = db as unknown as MockDb;

import {
  createPreferences,
  getPreferences,
  updatePreferences,
  deletePreferences,
} from "../../../src/modules/preferences/preferences.service.js";

describe("preferences.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createPreferences ───────────────────────────────────────────────────

  describe("createPreferences", () => {
    it("creates preferences when none exist", async () => {
      mDb.select.mockReturnValue(mockSelectChain([])); // no existing
      mDb.insert.mockReturnValue(mockInsertChain([mockPreferences]));

      const result = await createPreferences("user-uuid-1234", {
        preferredRoles: ["software engineer"],
        locations: ["Bangalore"],
      });

      expect(result).toEqual(mockPreferences);
      expect(mDb.insert).toHaveBeenCalled();
    });

    it("throws 409 when preferences already exist", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "existing" }]));

      await expect(
        createPreferences("user-uuid-1234", {
          preferredRoles: ["software engineer"],
          locations: ["Bangalore"],
        }),
      ).rejects.toThrow(AppError);

      try {
        await createPreferences("user-uuid-1234", {
          preferredRoles: ["software engineer"],
          locations: ["Bangalore"],
        });
      } catch (e) {
        expect((e as AppError).statusCode).toBe(409);
      }
    });

    it("sets default values for optional fields", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      const insertChain = mockInsertChain([mockPreferences]);
      mDb.insert.mockReturnValue(insertChain);

      await createPreferences("user-uuid-1234", {
        preferredRoles: ["dev"],
        locations: ["Remote"],
      });

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          remotePreference: false,
          salaryCurrency: "INR",
          employmentType: "full_time",
          minimumMatchPercentage: 50,
        }),
      );
    });

    it("converts numeric fields to strings", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      const insertChain = mockInsertChain([mockPreferences]);
      mDb.insert.mockReturnValue(insertChain);

      await createPreferences("user-uuid-1234", {
        preferredRoles: ["dev"],
        locations: ["Remote"],
        expectedSalaryMin: 1000000,
        expectedSalaryMax: 2000000,
      });

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedSalaryMin: "1000000",
          expectedSalaryMax: "2000000",
        }),
      );
    });
  });

  // ── getPreferences ──────────────────────────────────────────────────────

  describe("getPreferences", () => {
    it("returns preferences when found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockPreferences]));
      const result = await getPreferences("user-uuid-1234");
      expect(result).toEqual(mockPreferences);
    });

    it("throws 404 when not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getPreferences("user-uuid-1234")).rejects.toThrow(AppError);
      try { await getPreferences("user-uuid-1234"); } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });

  // ── updatePreferences ───────────────────────────────────────────────────

  describe("updatePreferences", () => {
    it("updates when preferences exist", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockPreferences]));
      const updated = { ...mockPreferences, remotePreference: true };
      mDb.update.mockReturnValue(mockUpdateChain([updated]));

      const result = await updatePreferences("user-uuid-1234", {
        remotePreference: true,
      });

      expect(result).toEqual(updated);
    });

    it("throws 404 when preferences don't exist", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(
        updatePreferences("user-uuid-1234", { remotePreference: true }),
      ).rejects.toThrow(AppError);
    });

    it("performs sparse update (only provided fields)", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockPreferences]));
      const updateChain = mockUpdateChain([mockPreferences]);
      mDb.update.mockReturnValue(updateChain);

      await updatePreferences("user-uuid-1234", { locations: ["Mumbai"] });

      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ locations: ["Mumbai"] }),
      );
    });
  });

  // ── deletePreferences ───────────────────────────────────────────────────

  describe("deletePreferences", () => {
    it("deletes existing preferences", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "pref-1" }]));
      mDb.delete.mockReturnValue(mockDeleteChain());

      const result = await deletePreferences("user-uuid-1234");
      expect(result.message).toContain("deleted");
    });

    it("throws 404 when preferences don't exist", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(deletePreferences("user-uuid-1234")).rejects.toThrow(AppError);
    });
  });
});
