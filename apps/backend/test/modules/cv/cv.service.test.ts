import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockCvSnapshot } from "../../utils/mocks/fixtures.js";
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
  createCv,
  getActiveCv,
  getCvById,
  listCvVersions,
  updateCv,
  deleteCv,
} from "../../../src/modules/cv/cv.service.js";

describe("cv.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createCv ────────────────────────────────────────────────────────────

  describe("createCv", () => {
    it("deactivates existing active CV and creates new one", async () => {
      // 1st update: deactivate existing
      mDb.update.mockReturnValue(mockUpdateChain([]));
      // 1st select: get latest version → version 2
      mDb.select.mockReturnValue(mockSelectChain([{ version: 2 }]));
      // insert: new cv
      const newCv = { ...mockCvSnapshot, version: 3 };
      mDb.insert.mockReturnValue(mockInsertChain([newCv]));

      const result = await createCv("user-uuid-1234", {
        rawCvText: "My CV text",
      });

      expect(result.version).toBe(3);
      expect(mDb.update).toHaveBeenCalled(); // deactivate previous
      expect(mDb.insert).toHaveBeenCalled();
    });

    it("creates first version when no existing CVs", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.select.mockReturnValue(mockSelectChain([])); // no previous versions
      mDb.insert.mockReturnValue(mockInsertChain([{ ...mockCvSnapshot, version: 1 }]));

      const result = await createCv("user-uuid-1234", {
        rawCvText: "First CV",
      });

      expect(result.version).toBe(1);
    });

    it("sets default inputMethod to 'text'", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.select.mockReturnValue(mockSelectChain([]));
      const insertChain = mockInsertChain([mockCvSnapshot]);
      mDb.insert.mockReturnValue(insertChain);

      await createCv("user-uuid-1234", { rawCvText: "CV" });

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({ inputMethod: "text" }),
      );
    });

    it("passes optional parsed fields", async () => {
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.select.mockReturnValue(mockSelectChain([]));
      const insertChain = mockInsertChain([mockCvSnapshot]);
      mDb.insert.mockReturnValue(insertChain);

      await createCv("user-uuid-1234", {
        rawCvText: "CV",
        parsedSkills: ["react"],
        parsedRoles: ["dev"],
        experienceYears: 5,
      });

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          parsedSkills: ["react"],
          parsedRoles: ["dev"],
          experienceYears: "5",
        }),
      );
    });
  });

  // ── getActiveCv ─────────────────────────────────────────────────────────

  describe("getActiveCv", () => {
    it("returns active CV when found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockCvSnapshot]));
      const result = await getActiveCv("user-uuid-1234");
      expect(result).toEqual(mockCvSnapshot);
    });

    it("throws 404 when no active CV", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getActiveCv("user-uuid-1234")).rejects.toThrow(AppError);
      try { await getActiveCv("user-uuid-1234"); } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });

  // ── getCvById ───────────────────────────────────────────────────────────

  describe("getCvById", () => {
    it("returns CV when found and belongs to user", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockCvSnapshot]));
      const result = await getCvById("user-uuid-1234", "cv-uuid-1111");
      expect(result).toEqual(mockCvSnapshot);
    });

    it("throws 404 when CV not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(getCvById("user-uuid-1234", "nonexistent")).rejects.toThrow(AppError);
    });
  });

  // ── listCvVersions ─────────────────────────────────────────────────────

  describe("listCvVersions", () => {
    it("returns list of CV versions", async () => {
      const versions = [
        { id: "cv-1", version: 2, isActive: true, inputMethod: "text", experienceYears: "5", seniority: "mid", createdAt: new Date() },
        { id: "cv-2", version: 1, isActive: false, inputMethod: "text", experienceYears: "3", seniority: "junior", createdAt: new Date() },
      ];
      mDb.select.mockReturnValue(mockSelectChain(versions));

      const result = await listCvVersions("user-uuid-1234");
      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(2);
    });

    it("returns empty array when no CVs", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      const result = await listCvVersions("user-uuid-1234");
      expect(result).toEqual([]);
    });
  });

  // ── updateCv ────────────────────────────────────────────────────────────

  describe("updateCv", () => {
    it("creates new snapshot merging with active CV", async () => {
      // First select: find active CV
      mDb.select.mockReturnValueOnce(mockSelectChain([mockCvSnapshot]));
      // createCv internals:
      mDb.update.mockReturnValue(mockUpdateChain([])); // deactivate
      mDb.select.mockReturnValueOnce(mockSelectChain([{ version: 1 }])); // latest version
      const newCv = { ...mockCvSnapshot, version: 2, parsedSkills: ["updated-skill"] };
      mDb.insert.mockReturnValue(mockInsertChain([newCv]));

      const result = await updateCv("user-uuid-1234", {
        parsedSkills: ["updated-skill"],
      });

      expect(result.version).toBe(2);
    });

    it("throws 404 when no active CV to update", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(
        updateCv("user-uuid-1234", { rawCvText: "New text" }),
      ).rejects.toThrow(AppError);
    });

    it("preserves existing fields when not provided in update", async () => {
      mDb.select.mockReturnValueOnce(mockSelectChain([mockCvSnapshot]));
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.select.mockReturnValueOnce(mockSelectChain([{ version: 1 }]));
      const insertChain = mockInsertChain([{ ...mockCvSnapshot, version: 2 }]);
      mDb.insert.mockReturnValue(insertChain);

      await updateCv("user-uuid-1234", {}); // empty update

      expect(insertChain.values).toHaveBeenCalledWith(
        expect.objectContaining({
          rawCvText: mockCvSnapshot.rawCvText, // preserved from active
        }),
      );
    });
  });

  // ── deleteCv ────────────────────────────────────────────────────────────

  describe("deleteCv", () => {
    it("deletes a CV snapshot", async () => {
      mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "cv-1", isActive: false }]));
      mDb.delete.mockReturnValue(mockDeleteChain());

      const result = await deleteCv("user-uuid-1234", "cv-1");
      expect(result.message).toContain("deleted");
    });

    it("throws 404 when CV not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(deleteCv("user-uuid-1234", "nonexistent")).rejects.toThrow(AppError);
    });

    it("promotes latest remaining CV when deleting active CV", async () => {
      // select: find cv to delete (active)
      mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "cv-1", isActive: true }]));
      // delete
      mDb.delete.mockReturnValue(mockDeleteChain());
      // select: find latest remaining
      mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "cv-2" }]));
      // update: promote
      mDb.update.mockReturnValue(mockUpdateChain([]));

      await deleteCv("user-uuid-1234", "cv-1");

      expect(mDb.update).toHaveBeenCalled(); // promoted cv-2
    });

    it("does not promote when no remaining CVs after deletion", async () => {
      mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "cv-1", isActive: true }]));
      mDb.delete.mockReturnValue(mockDeleteChain());
      mDb.select.mockReturnValueOnce(mockSelectChain([])); // no remaining

      await deleteCv("user-uuid-1234", "cv-1");

      // update should not be called for promotion
      expect(mDb.update).not.toHaveBeenCalled();
    });

    it("does not promote when deleting inactive CV", async () => {
      mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "cv-1", isActive: false }]));
      mDb.delete.mockReturnValue(mockDeleteChain());

      await deleteCv("user-uuid-1234", "cv-1");

      expect(mDb.update).not.toHaveBeenCalled();
    });
  });
});
