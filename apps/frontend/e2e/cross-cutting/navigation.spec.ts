import { test, expect } from "@playwright/test";
import { loginAsUser, loginAsAdmin } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";
import { mockAdminUser } from "../helpers/test-data.js";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("desktop sidebar shows all nav links", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator("aside");
    await expect(sidebar.getByText("Dashboard")).toBeVisible();
    await expect(sidebar.getByText("Job Matches")).toBeVisible();
    await expect(sidebar.getByText("CSV Exports")).toBeVisible();
    await expect(sidebar.getByText("Notifications")).toBeVisible();
    await expect(sidebar.getByText("My CV")).toBeVisible();
    await expect(sidebar.getByText("Preferences")).toBeVisible();
    await expect(sidebar.getByText("Subscription")).toBeVisible();
    await expect(sidebar.getByText("Settings")).toBeVisible();
  });

  test("sidebar active page is highlighted", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.locator("aside");
    const dashboardLink = sidebar.getByRole("link", { name: "Dashboard" });
    // Active link should have blue styling
    await expect(dashboardLink).toHaveClass(/text-blue/);
  });

  test("sidebar 'Admin' link only shows for admin users", async ({ page }) => {
    // Regular user should NOT see Admin
    await page.goto("/dashboard");
    await expect(page.locator("aside").getByText("Admin")).not.toBeVisible();
  });

  test("admin sidebar shows Admin link", async ({ page }) => {
    await loginAsAdmin(page);
    await setupMockApi(page, {
      "GET /api/users/me": {
        status: 200,
        body: { status: "success", data: mockAdminUser },
      },
    });
    await page.goto("/dashboard");
    await expect(page.locator("aside").getByText("Admin")).toBeVisible();
  });

  test("logo click navigates to /dashboard", async ({ page }) => {
    await page.goto("/cv");
    await page.locator("aside").getByText("Job Assistant").click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sidebar logout calls logout and redirects", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("aside").getByText("Sign out").click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("dark mode toggle changes theme class on html", async ({ page }) => {
    await page.goto("/dashboard");
    const toggleButton = page.getByRole("button", { name: "Toggle theme" });
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();
    // After toggling, the html element should have "dark" class (or it was removed)
    const htmlEl = page.locator("html");
    const hasDark = await htmlEl.evaluate((el) => el.classList.contains("dark"));
    // Toggle again
    await toggleButton.click();
    const hasDark2 = await htmlEl.evaluate((el) => el.classList.contains("dark"));
    // The two states should be different
    expect(hasDark).not.toBe(hasDark2);
  });
});
