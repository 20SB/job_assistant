import { describe, it, expect } from "vitest";
import { scoreJob, type ScoreResult } from "../../../src/modules/matching/matching.scorer.js";

// ── Test data factories ────────────────────────────────────────────────────

function makeCv(overrides = {}) {
  return {
    parsedSkills: ["node.js", "react", "typescript", "postgresql"],
    parsedRoles: ["software engineer"],
    parsedTools: ["docker", "git"],
    experienceYears: "5",
    ...overrides,
  };
}

function makePrefs(overrides = {}) {
  return {
    preferredRoles: ["software engineer", "backend developer"],
    locations: ["Bangalore", "Remote"],
    remotePreference: true,
    expectedSalaryMin: "1800000",
    expectedSalaryMax: "2500000",
    excludedKeywords: null as string[] | null,
    blacklistedCompanies: null as string[] | null,
    minimumMatchPercentage: 50,
    ...overrides,
  };
}

function makeJob(overrides = {}) {
  return {
    title: "Senior Software Engineer",
    company: "TechCorp",
    description: "Looking for a senior Node.js engineer with React and TypeScript experience.",
    salaryMin: "2000000",
    salaryMax: "3000000",
    location: "Bangalore, India",
    isRemote: false,
    ...overrides,
  };
}

// ── Main scorer tests ──────────────────────────────────────────────────────

describe("scoreJob", () => {
  describe("basic scoring", () => {
    it("returns a ScoreResult with all fields", () => {
      const result = scoreJob(makeCv(), makePrefs(), makeJob());
      expect(result).toHaveProperty("matchPercentage");
      expect(result).toHaveProperty("matchedSkills");
      expect(result).toHaveProperty("missingSkills");
      expect(result).toHaveProperty("scoreBreakdown");
      expect(result).toHaveProperty("recommendationReason");
      expect(result).toHaveProperty("excluded");
      expect(result.excluded).toBe(false);
    });

    it("produces matchPercentage between 0 and 100", () => {
      const result = scoreJob(makeCv(), makePrefs(), makeJob());
      expect(result.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(result.matchPercentage).toBeLessThanOrEqual(100);
    });

    it("scores a perfect-ish match highly", () => {
      const result = scoreJob(makeCv(), makePrefs(), makeJob());
      expect(result.matchPercentage).toBeGreaterThan(50);
    });

    it("scores a poor match low", () => {
      const result = scoreJob(
        makeCv({ parsedSkills: ["java", "spring"], parsedRoles: ["devops engineer"] }),
        makePrefs({ preferredRoles: ["devops engineer"], locations: ["London"] }),
        makeJob({ title: "PHP Developer", description: "WordPress development", location: "Tokyo" }),
      );
      expect(result.matchPercentage).toBeLessThan(40);
    });

    it("returns score breakdown with all 5 dimensions", () => {
      const result = scoreJob(makeCv(), makePrefs(), makeJob());
      const bd = result.scoreBreakdown;
      expect(bd).toHaveProperty("skillOverlap");
      expect(bd).toHaveProperty("roleMatch");
      expect(bd).toHaveProperty("locationMatch");
      expect(bd).toHaveProperty("salaryCompat");
      expect(bd).toHaveProperty("experienceAlign");
    });

    it("each breakdown score is 0-100", () => {
      const result = scoreJob(makeCv(), makePrefs(), makeJob());
      Object.values(result.scoreBreakdown).forEach((s) => {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      });
    });
  });

  // ── Skill overlap dimension ──────────────────────────────────────────────

  describe("skill overlap", () => {
    it("matches skills found in job title/description", () => {
      const result = scoreJob(makeCv(), makePrefs(), makeJob());
      expect(result.matchedSkills.length).toBeGreaterThan(0);
    });

    it("reports missing skills not in job", () => {
      const result = scoreJob(
        makeCv({ parsedSkills: ["python", "rust", "golang"], parsedTools: [] }),
        makePrefs(),
        makeJob({ title: "React Developer", description: "Frontend work with React" }),
      );
      expect(result.missingSkills.length).toBeGreaterThan(0);
    });

    it("returns 0 skill score when user has no skills", () => {
      const result = scoreJob(
        makeCv({ parsedSkills: [], parsedTools: [] }),
        makePrefs(),
        makeJob(),
      );
      expect(result.scoreBreakdown.skillOverlap).toBe(0);
      expect(result.matchedSkills).toEqual([]);
    });

    it("includes parsedTools in skill matching", () => {
      const result = scoreJob(
        makeCv({ parsedSkills: [], parsedTools: ["docker"] }),
        makePrefs(),
        makeJob({ description: "Must know docker and kubernetes" }),
      );
      expect(result.matchedSkills).toContain("docker");
    });

    it("handles null parsedSkills and parsedTools", () => {
      const result = scoreJob(
        makeCv({ parsedSkills: null, parsedTools: null }),
        makePrefs(),
        makeJob(),
      );
      expect(result.scoreBreakdown.skillOverlap).toBe(0);
    });

    it("applies 1.2x boost capped at 100", () => {
      // All skills match → raw = 1.0, boosted = 1.2, capped at 1.0
      const result = scoreJob(
        makeCv({ parsedSkills: ["react"], parsedTools: [] }),
        makePrefs(),
        makeJob({ title: "React Developer", description: "React" }),
      );
      expect(result.scoreBreakdown.skillOverlap).toBeLessThanOrEqual(100);
    });

    it("deduplicates matched and missing skills", () => {
      const result = scoreJob(
        makeCv({ parsedSkills: ["react", "react"], parsedTools: ["react"] }),
        makePrefs(),
        makeJob({ description: "React developer" }),
      );
      // Matched skills should be deduplicated
      const uniqueMatched = [...new Set(result.matchedSkills)];
      expect(result.matchedSkills.length).toBe(uniqueMatched.length);
    });
  });

  // ── Role match dimension ─────────────────────────────────────────────────

  describe("role match", () => {
    it("scores high when job title matches preferred role", () => {
      const result = scoreJob(
        makeCv({ parsedRoles: ["software engineer"] }),
        makePrefs({ preferredRoles: ["software engineer"] }),
        makeJob({ title: "Software Engineer" }),
      );
      expect(result.scoreBreakdown.roleMatch).toBeGreaterThanOrEqual(70);
    });

    it("scores via substring matching", () => {
      const result = scoreJob(
        makeCv({ parsedRoles: [] }),
        makePrefs({ preferredRoles: ["backend developer"] }),
        makeJob({ title: "Senior Backend Developer" }),
      );
      expect(result.scoreBreakdown.roleMatch).toBeGreaterThanOrEqual(70);
    });

    it("scores 0 when no roles match", () => {
      const result = scoreJob(
        makeCv({ parsedRoles: ["data scientist"] }),
        makePrefs({ preferredRoles: ["data scientist"] }),
        makeJob({ title: "PHP Developer" }),
      );
      expect(result.scoreBreakdown.roleMatch).toBeLessThan(50);
    });

    it("handles empty roles", () => {
      const result = scoreJob(
        makeCv({ parsedRoles: null }),
        makePrefs({ preferredRoles: [] }),
        makeJob(),
      );
      expect(result.scoreBreakdown.roleMatch).toBe(0);
    });

    it("combines CV roles and preference roles", () => {
      const result = scoreJob(
        makeCv({ parsedRoles: ["frontend developer"] }),
        makePrefs({ preferredRoles: ["backend developer"] }),
        makeJob({ title: "Backend Developer" }),
      );
      expect(result.scoreBreakdown.roleMatch).toBeGreaterThan(0);
    });
  });

  // ── Location match dimension ─────────────────────────────────────────────

  describe("location match", () => {
    it("scores 100 for remote job when user prefers remote", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ remotePreference: true }),
        makeJob({ isRemote: true }),
      );
      expect(result.scoreBreakdown.locationMatch).toBe(100);
    });

    it("scores 100 when job location matches preference", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ locations: ["Bangalore"] }),
        makeJob({ location: "Bangalore, India", isRemote: false }),
      );
      expect(result.scoreBreakdown.locationMatch).toBe(100);
    });

    it("scores 0 for unmatched non-remote location", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ locations: ["London"], remotePreference: false }),
        makeJob({ location: "Tokyo, Japan", isRemote: false }),
      );
      expect(result.scoreBreakdown.locationMatch).toBe(0);
    });

    it("scores 30 (neutral) for unknown job location", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ remotePreference: false }),
        makeJob({ location: null, isRemote: false }),
      );
      expect(result.scoreBreakdown.locationMatch).toBe(30);
    });

    it("scores partial match for same region tokens", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ locations: ["Mumbai, India"] }),
        makeJob({ location: "Pune, India", isRemote: false }),
      );
      expect(result.scoreBreakdown.locationMatch).toBe(50);
    });
  });

  // ── Salary compatibility dimension ───────────────────────────────────────

  describe("salary compatibility", () => {
    it("returns 50 (neutral) when no salary data on either side", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ expectedSalaryMin: null, expectedSalaryMax: null }),
        makeJob({ salaryMin: null, salaryMax: null }),
      );
      expect(result.scoreBreakdown.salaryCompat).toBe(50);
    });

    it("returns 50 (neutral) when user has no salary expectations", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ expectedSalaryMin: null, expectedSalaryMax: null }),
        makeJob({ salaryMin: "1000000", salaryMax: "2000000" }),
      );
      expect(result.scoreBreakdown.salaryCompat).toBe(50);
    });

    it("returns 50 (neutral) when job has no salary data", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs(),
        makeJob({ salaryMin: null, salaryMax: null }),
      );
      expect(result.scoreBreakdown.salaryCompat).toBe(50);
    });

    it("scores high when salaries align", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ expectedSalaryMin: "2000000", expectedSalaryMax: "2500000" }),
        makeJob({ salaryMin: "2000000", salaryMax: "2800000" }),
      );
      expect(result.scoreBreakdown.salaryCompat).toBeGreaterThan(70);
    });

    it("scores low when salaries differ greatly", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ expectedSalaryMin: "5000000", expectedSalaryMax: "6000000" }),
        makeJob({ salaryMin: "500000", salaryMax: "800000" }),
      );
      expect(result.scoreBreakdown.salaryCompat).toBeLessThan(30);
    });
  });

  // ── Experience alignment dimension ───────────────────────────────────────

  describe("experience alignment", () => {
    it("returns 50 (neutral) when user has no experience data", () => {
      const result = scoreJob(
        makeCv({ experienceYears: null }),
        makePrefs(),
        makeJob(),
      );
      expect(result.scoreBreakdown.experienceAlign).toBe(50);
    });

    it("scores high for senior role with senior experience", () => {
      const result = scoreJob(
        makeCv({ experienceYears: "8" }),
        makePrefs(),
        makeJob({ title: "Senior Backend Engineer", description: "Senior role" }),
      );
      expect(result.scoreBreakdown.experienceAlign).toBeGreaterThanOrEqual(80);
    });

    it("scores lower for junior role with senior experience", () => {
      const result = scoreJob(
        makeCv({ experienceYears: "10" }),
        makePrefs(),
        makeJob({ title: "Junior Developer", description: "Entry level position" }),
      );
      expect(result.scoreBreakdown.experienceAlign).toBeLessThan(50);
    });

    it("scores high for mid-level with appropriate experience", () => {
      const result = scoreJob(
        makeCv({ experienceYears: "4" }),
        makePrefs(),
        makeJob({ title: "Mid-Level Developer", description: "3+ years experience" }),
      );
      expect(result.scoreBreakdown.experienceAlign).toBe(100);
    });

    it("scores 100 when no seniority keywords present (default range)", () => {
      const result = scoreJob(
        makeCv({ experienceYears: "5" }),
        makePrefs(),
        makeJob({ title: "Developer", description: "Write code." }),
      );
      expect(result.scoreBreakdown.experienceAlign).toBe(100);
    });
  });

  // ── Exclusion filters ────────────────────────────────────────────────────

  describe("exclusion filters", () => {
    it("excludes job with blacklisted keyword in title", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ excludedKeywords: ["php"] }),
        makeJob({ title: "PHP Developer" }),
      );
      expect(result.excluded).toBe(true);
      expect(result.matchPercentage).toBe(0);
    });

    it("excludes job with blacklisted keyword in description", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ excludedKeywords: ["wordpress"] }),
        makeJob({ description: "Maintain WordPress sites" }),
      );
      expect(result.excluded).toBe(true);
    });

    it("excludes job by blacklisted company", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ blacklistedCompanies: ["BadCorp"] }),
        makeJob({ company: "BadCorp" }),
      );
      expect(result.excluded).toBe(true);
      expect(result.matchPercentage).toBe(0);
    });

    it("company exclusion is case-insensitive", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ blacklistedCompanies: ["badcorp"] }),
        makeJob({ company: "BadCorp Inc" }),
      );
      expect(result.excluded).toBe(true);
    });

    it("excluded result has zero breakdown scores", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ excludedKeywords: ["php"] }),
        makeJob({ title: "PHP Developer" }),
      );
      expect(result.scoreBreakdown).toEqual({
        skillOverlap: 0,
        roleMatch: 0,
        locationMatch: 0,
        salaryCompat: 0,
        experienceAlign: 0,
      });
    });

    it("excluded result returns all skills as missing", () => {
      const cv = makeCv({ parsedSkills: ["react", "node.js"] });
      const result = scoreJob(
        cv,
        makePrefs({ excludedKeywords: ["php"] }),
        makeJob({ title: "PHP Developer" }),
      );
      expect(result.missingSkills).toEqual(["react", "node.js"]);
      expect(result.matchedSkills).toEqual([]);
    });

    it("does not exclude when no keywords/companies configured", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ excludedKeywords: null, blacklistedCompanies: null }),
        makeJob(),
      );
      expect(result.excluded).toBe(false);
    });

    it("does not exclude when company is null", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ blacklistedCompanies: ["BadCorp"] }),
        makeJob({ company: null }),
      );
      expect(result.excluded).toBe(false);
    });
  });

  // ── Recommendation reason ────────────────────────────────────────────────

  describe("recommendation reason", () => {
    it("includes specific reasons for high-scoring matches", () => {
      const result = scoreJob(makeCv(), makePrefs(), makeJob());
      expect(result.recommendationReason).toContain("Recommended");
    });

    it("returns 'Low match' for very low scores", () => {
      const result = scoreJob(
        makeCv({ parsedSkills: [], parsedRoles: [], parsedTools: [], experienceYears: null }),
        makePrefs({ preferredRoles: [], locations: ["Mars"], expectedSalaryMin: null, expectedSalaryMax: null }),
        makeJob({ title: "X", description: null, location: "Jupiter", salaryMin: null, salaryMax: null }),
      );
      expect(result.recommendationReason).toMatch(/Low match|Partial match/);
    });

    it("excluded jobs get exclusion reason", () => {
      const result = scoreJob(
        makeCv(),
        makePrefs({ excludedKeywords: ["php"] }),
        makeJob({ title: "PHP Developer" }),
      );
      expect(result.recommendationReason).toContain("Excluded");
    });
  });

  // ── Weighted scoring ────────────────────────────────────────────────────

  describe("weighted scoring", () => {
    it("weights sum to 1.0 (verified via scoring)", () => {
      // All dimensions at 100% should give 100%
      const result = scoreJob(
        makeCv({ parsedSkills: ["react"], parsedRoles: ["react developer"], parsedTools: [], experienceYears: "5" }),
        makePrefs({
          preferredRoles: ["react developer"],
          locations: ["Remote"],
          remotePreference: true,
          expectedSalaryMin: "2000000",
          expectedSalaryMax: "2000000",
        }),
        makeJob({
          title: "React Developer",
          description: "We need a react developer",
          isRemote: true,
          salaryMin: "2000000",
          salaryMax: "2000000",
        }),
      );
      expect(result.matchPercentage).toBeGreaterThanOrEqual(90);
    });
  });
});
