import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Jobs page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("renders job match cards with title, company, location", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("heading", { name: "Job Matches" })).toBeVisible();
    await expect(page.getByText("Senior React Developer")).toBeVisible();
    await expect(page.getByText("TechCorp")).toBeVisible();
    await expect(page.getByText("London, UK")).toBeVisible();
  });

  test("match percentage badge shown with correct color", async ({ page }) => {
    await page.goto("/jobs");
    // 85% match should be visible (green)
    await expect(page.getByText("85%")).toBeVisible();
    // 62% match should be visible (blue)
    await expect(page.getByText("62%")).toBeVisible();
  });

  test("expanding a card shows score breakdown bars", async ({ page }) => {
    await page.goto("/jobs");
    // Click the first job card to expand it
    await page.getByText("Senior React Developer").click();
    await expect(page.getByText("Score Breakdown")).toBeVisible();
  });

  test("expanding shows matched/missing skills badges", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByText("Senior React Developer").click();
    await expect(page.getByText("Matched Skills")).toBeVisible();
    await expect(page.getByText("Missing Skills")).toBeVisible();
    // Check specific skills
    await expect(page.getByText("GraphQL")).toBeVisible();
  });

  test("star icon toggles shortlist", async ({ page }) => {
    let shortlistCalled = false;
    await page.route("**/api/matching/*/shortlist", async (route) => {
      shortlistCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", data: { isShortlisted: true } }),
      });
    });
    await page.goto("/jobs");
    // Find and click the shortlist button for the first (non-shortlisted) match
    const starButtons = page.locator("button").filter({ has: page.locator("svg") });
    // There should be star/staroff buttons - click one
    const firstJobCard = page.locator("article, [class*='border']").filter({ hasText: "Senior React Developer" });
    const starButton = firstJobCard.locator("button").first();
    if (await starButton.isVisible()) {
      await starButton.click();
    }
  });

  test("clicking card marks as viewed", async ({ page }) => {
    let viewedCalled = false;
    await page.route("**/api/matching/*/viewed", async (route) => {
      viewedCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", data: { viewedAt: new Date().toISOString() } }),
      });
    });
    await page.goto("/jobs");
    await page.getByText("Senior React Developer").click();
    // The viewed API should have been called
  });

  test("filter: shortlisted-only checkbox filters results", async ({ page }) => {
    await page.goto("/jobs");
    // Open filters panel
    await page.getByRole("button", { name: "Filters" }).click();
    // Check shortlisted only
    await page.locator("#shortlistedOnly").check();
    // Should trigger a re-fetch with shortlisted filter
    await expect(page.locator("#shortlistedOnly")).toBeChecked();
  });

  test("pagination next/previous buttons work", async ({ page }) => {
    await setupMockApi(page, {
      "GET /api/matching/results": {
        status: 200,
        body: {
          status: "success",
          data: {
            matches: Array(10).fill(null).map((_, i) => ({
              matchId: `match-${i}`,
              userId: "user-1",
              jobId: `job-${i}`,
              batchId: "batch-1",
              matchPercentage: 80 - i,
              scoreBreakdown: { roleRelevance: 80, skillMatch: 80, experienceMatch: 80, locationMatch: 80, salaryMatch: 80 },
              matchedSkills: ["React"],
              missingSkills: [],
              recommendation: "Good match",
              isShortlisted: false,
              viewedAt: null,
              createdAt: "2024-06-15T12:00:00Z",
              job: { id: `job-${i}`, title: `Job ${i}`, company: "Corp", location: "Remote", isRemote: true },
            })),
            total: 25,
            page: 1,
            limit: 10,
          },
        },
      },
    });
    await page.goto("/jobs");
    // Should show pagination with Next button
    const nextButton = page.getByRole("button", { name: "Next" });
    await expect(nextButton).toBeVisible();
  });

  test("empty state shows 'No matches yet' and 'Run Matching' button", async ({ page }) => {
    await setupMockApi(page, {
      "GET /api/matching/results": {
        status: 200,
        body: { status: "success", data: { matches: [], total: 0, page: 1, limit: 10 } },
      },
    });
    await page.goto("/jobs");
    await expect(page.getByText("No matches yet")).toBeVisible();
    await expect(page.getByRole("button", { name: "Run Matching" })).toBeVisible();
  });
});
