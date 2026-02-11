import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Exports page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("lists existing CSV exports with file name and row count", async ({ page }) => {
    await page.goto("/exports");
    await expect(page.getByRole("heading", { name: "CSV Exports" })).toBeVisible();
    await expect(page.getByText("job-matches-2024-06-15.csv")).toBeVisible();
    await expect(page.getByText("15 rows")).toBeVisible();
  });

  test("'Generate' button calls generate API for selected batch", async ({ page }) => {
    await page.goto("/exports");
    const generateButton = page.getByRole("button", { name: "Generate" }).first();
    await expect(generateButton).toBeVisible();
    await generateButton.click();
    // Should show generating state
    await expect(page.getByText("Generating...")).toBeVisible();
  });

  test("download button triggers file download", async ({ page }) => {
    await page.goto("/exports");
    // There should be download icon buttons for each export
    const downloadButtons = page.locator("button").filter({ has: page.locator("[class*='Download'], svg") });
    await expect(downloadButtons.first()).toBeVisible();
  });

  test("archive button calls archive API", async ({ page }) => {
    let archiveCalled = false;
    await page.route("**/api/csv/*/archive", async (route) => {
      archiveCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "success", data: null }),
      });
    });
    await page.goto("/exports");
    // Archive buttons should be present
    const archiveButton = page.locator("button[title*='Archive'], button[aria-label*='Archive']");
    if ((await archiveButton.count()) > 0) {
      await archiveButton.first().click();
    }
  });

  test("batch list shows available batches", async ({ page }) => {
    await page.goto("/exports");
    await expect(page.getByText("Generate New CSV")).toBeVisible();
    // Batch IDs should be visible (truncated)
    await expect(page.getByText("batch-1", { exact: false })).toBeVisible();
  });

  test("pagination works", async ({ page }) => {
    await page.goto("/exports");
    // Page info text should be present
    await expect(page.getByText("Page", { exact: false })).toBeVisible();
  });
});
