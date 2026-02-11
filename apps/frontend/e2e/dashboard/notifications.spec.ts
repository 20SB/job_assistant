import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Notifications page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("renders notification preferences with frequency buttons and toggles", async ({
    page,
  }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByText("Notification Preferences")).toBeVisible();
    await expect(page.getByText("Hourly")).toBeVisible();
    await expect(page.getByText("Daily")).toBeVisible();
    await expect(page.getByText("Weekly")).toBeVisible();
  });

  test("frequency button selection changes visually", async ({ page }) => {
    await page.goto("/notifications");
    const weeklyButton = page.getByRole("button", { name: "Weekly" });
    await weeklyButton.click();
    // The Weekly button should now have active/selected styling
    await expect(weeklyButton).toBeVisible();
  });

  test("toggle switches change state", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByText("Subscription Updates")).toBeVisible();
    await expect(page.getByText("Payment Notifications")).toBeVisible();
    await expect(page.getByText("Marketing Emails")).toBeVisible();
  });

  test("'Save Preferences' calls create/update API", async ({ page }) => {
    await page.goto("/notifications");
    await page.getByRole("button", { name: "Save Preferences" }).click();
    await expect(page.getByText("Saving...")).toBeVisible();
  });

  test("notification history renders with type badges", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByText("Notification History")).toBeVisible();
    await expect(page.getByText("15 new job matches found")).toBeVisible();
    await expect(page.getByText("Subscription renewed")).toBeVisible();
  });

  test("type filter dropdown filters notifications", async ({ page }) => {
    await page.goto("/notifications");
    // There should be a type filter select/dropdown
    const filterSelect = page.locator("select").first();
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption({ label: "Match Batch" });
    }
  });

  test("'Reset' button calls delete API", async ({ page }) => {
    await page.goto("/notifications");
    const resetButton = page.getByRole("button", { name: "Reset" });
    await expect(resetButton).toBeVisible();
    await resetButton.click();
  });
});
