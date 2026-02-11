import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchFromAdzuna, mapAdzunaJob, type AdzunaJob } from "../../../src/modules/jobs/jobs.adzuna.js";

describe("jobs.adzuna", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // ── fetchFromAdzuna ─────────────────────────────────────────────────────

  describe("fetchFromAdzuna", () => {
    it("fetches jobs from Adzuna API", async () => {
      const mockResults = [
        { id: "1", title: "Dev", company: null, description: "desc", redirect_url: "url", created: "2025-01-01" },
      ];
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: mockResults, count: 1, mean: 50000 }),
      } as Response);

      const result = await fetchFromAdzuna({ role: "developer" });
      expect(result).toEqual(mockResults);
      expect(globalThis.fetch).toHaveBeenCalledOnce();
    });

    it("builds correct URL with parameters", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [], count: 0, mean: 0 }),
      } as Response);

      await fetchFromAdzuna({ role: "engineer", location: "London", page: 2, resultsPerPage: 25 });

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(calledUrl).toContain("/jobs/in/search/2");
      expect(calledUrl).toContain("what=engineer");
      expect(calledUrl).toContain("where=London");
      expect(calledUrl).toContain("results_per_page=25");
    });

    it("returns empty array when API credentials missing", async () => {
      // Override env mock for this test
      const envModule = await import("../../../src/config/env.js");
      const originalId = envModule.env.ADZUNA_APP_ID;
      const originalKey = envModule.env.ADZUNA_APP_KEY;
      (envModule.env as any).ADZUNA_APP_ID = undefined;
      (envModule.env as any).ADZUNA_APP_KEY = undefined;

      const result = await fetchFromAdzuna({ role: "dev" });
      expect(result).toEqual([]);

      // Restore
      (envModule.env as any).ADZUNA_APP_ID = originalId;
      (envModule.env as any).ADZUNA_APP_KEY = originalKey;
    });

    it("throws on non-ok response", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve("Forbidden"),
      } as Response);

      await expect(fetchFromAdzuna({ role: "dev" })).rejects.toThrow("Adzuna API returned 403");
    });

    it("defaults to page 1 and 50 results per page", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [], count: 0, mean: 0 }),
      } as Response);

      await fetchFromAdzuna({ role: "dev" });

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(calledUrl).toContain("/search/1");
      expect(calledUrl).toContain("results_per_page=50");
    });

    it("does not include 'where' param when location not provided", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [], count: 0, mean: 0 }),
      } as Response);

      await fetchFromAdzuna({ role: "dev" });

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(calledUrl).not.toContain("where=");
    });
  });

  // ── mapAdzunaJob ────────────────────────────────────────────────────────

  describe("mapAdzunaJob", () => {
    const fullRawJob: AdzunaJob = {
      id: "12345",
      title: "Software Engineer",
      company: { display_name: "TechCorp" },
      description: "Build things",
      salary_min: 50000,
      salary_max: 80000,
      location: { display_name: "London, UK", area: ["UK", "London"] },
      category: { label: "IT Jobs" },
      contract_type: "permanent",
      redirect_url: "https://example.com/apply",
      created: "2025-01-15T10:00:00Z",
    };

    it("maps all fields correctly", () => {
      const mapped = mapAdzunaJob(fullRawJob);
      expect(mapped.externalJobId).toBe("12345");
      expect(mapped.source).toBe("adzuna");
      expect(mapped.title).toBe("Software Engineer");
      expect(mapped.company).toBe("TechCorp");
      expect(mapped.description).toBe("Build things");
      expect(mapped.salaryMin).toBe("50000");
      expect(mapped.salaryMax).toBe("80000");
      expect(mapped.salaryCurrency).toBe("INR");
      expect(mapped.location).toBe("London, UK");
      expect(mapped.isRemote).toBe(false);
      expect(mapped.category).toBe("IT Jobs");
      expect(mapped.contractType).toBe("permanent");
      expect(mapped.applyUrl).toBe("https://example.com/apply");
      expect(mapped.postedDate).toBeInstanceOf(Date);
    });

    it("handles null company", () => {
      const raw = { ...fullRawJob, company: null };
      expect(mapAdzunaJob(raw).company).toBeNull();
    });

    it("handles null location", () => {
      const raw = { ...fullRawJob, location: null };
      expect(mapAdzunaJob(raw).location).toBeNull();
    });

    it("handles null salary", () => {
      const raw = { ...fullRawJob, salary_min: undefined, salary_max: undefined };
      expect(mapAdzunaJob(raw).salaryMin).toBeNull();
      expect(mapAdzunaJob(raw).salaryMax).toBeNull();
    });

    it("handles null category", () => {
      const raw = { ...fullRawJob, category: null };
      expect(mapAdzunaJob(raw).category).toBeNull();
    });

    it("stores rawData as the full Adzuna object", () => {
      const mapped = mapAdzunaJob(fullRawJob);
      expect(mapped.rawData).toBeDefined();
    });
  });
});
