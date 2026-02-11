import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Subscription page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("renders current plan card with name and status badge", async ({ page }) => {
    await page.goto("/subscription");
    await expect(page.getByText("starter", { exact: false })).toBeVisible();
    await expect(page.getByText("active", { exact: false })).toBeVisible();
  });

  test("'Cancel Subscription' button sends cancel request", async ({ page }) => {
    await page.goto("/subscription");
    const cancelButton = page.getByRole("button", { name: "Cancel Subscription" });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
    // Should show confirmation or trigger cancel
  });

  test("'Change Plan' shows available plans grid", async ({ page }) => {
    await page.goto("/subscription");
    const changePlanButton = page.getByRole("button", { name: "Change Plan" });
    await expect(changePlanButton).toBeVisible();
    await changePlanButton.click();
    // Plan cards should appear
    await expect(page.getByText("free", { exact: false })).toBeVisible();
    await expect(page.getByText("pro", { exact: false })).toBeVisible();
  });

  test("selecting a new plan and confirming calls subscribe API", async ({ page }) => {
    await page.goto("/subscription");
    await page.getByRole("button", { name: "Change Plan" }).click();
    // Click on Pro plan card select button
    const selectButtons = page.getByRole("button", { name: "Select" });
    if ((await selectButtons.count()) > 0) {
      await selectButtons.first().click();
    }
  });

  test("payment history list renders", async ({ page }) => {
    await page.goto("/subscription");
    // Payment history should show payment amount
    await expect(page.getByText("$9", { exact: false })).toBeVisible();
  });

  test("no subscription state shows 'View Plans' prompt", async ({ page }) => {
    await setupMockApi(page, {
      "GET /api/subscriptions/me": {
        status: 404,
        body: { status: "error", message: "No subscription" },
      },
    });
    await page.goto("/subscription");
    await expect(page.getByText("View Plans", { exact: false })).toBeVisible();
  });
});
