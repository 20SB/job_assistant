import { test, expect } from "@playwright/test";
import { loginAsUser, loginAsAdmin } from "./helpers/auth.js";
import { setupMockApi } from "./helpers/mock-api.js";
import { mockAdminUser } from "./helpers/test-data.js";

test.describe("Admin page", () => {
  test("non-admin user does not see Admin link in sidebar", async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
    await page.goto("/dashboard");
    // Sidebar should NOT have Admin link for regular users
    await expect(page.locator("aside").getByText("Admin")).not.toBeVisible();
  });

  test.describe("as admin", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await setupMockApi(page, {
        "GET /api/users/me": {
          status: 200,
          body: { status: "success", data: mockAdminUser },
        },
      });
    });

    test("admin user sees overview tab with stats cards", async ({ page }) => {
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
      await expect(page.getByText("Total Users")).toBeVisible();
      await expect(page.getByText("142")).toBeVisible();
      await expect(page.getByText("Active Subscriptions")).toBeVisible();
    });

    test("users tab renders table with search", async ({ page }) => {
      await page.goto("/admin");
      await page.getByRole("button", { name: "Users" }).click();
      await expect(page.getByPlaceholder("Search by email...")).toBeVisible();
      await expect(page.getByText("test@example.com")).toBeVisible();
    });

    test("user search filters results", async ({ page }) => {
      await page.goto("/admin");
      await page.getByRole("button", { name: "Users" }).click();
      await page.getByPlaceholder("Search by email...").fill("admin");
      await page.getByRole("button", { name: "Search" }).click();
    });

    test("job-fetch logs tab renders log cards", async ({ page }) => {
      await page.goto("/admin");
      await page.getByRole("button", { name: "Job Fetch" }).click();
      await expect(page.getByText("completed", { exact: false })).toBeVisible();
      await expect(page.getByText("adzuna", { exact: false })).toBeVisible();
    });

    test("email logs tab renders with status badges", async ({ page }) => {
      await page.goto("/admin");
      await page.getByRole("button", { name: "Email" }).click();
      await expect(page.getByText("sent", { exact: false })).toBeVisible();
      await expect(page.getByText("Your job matches are ready")).toBeVisible();
    });

    test("tasks tab renders task cards with status", async ({ page }) => {
      await page.goto("/admin");
      await page.getByRole("button", { name: "Tasks" }).click();
      await expect(page.getByText("job_fetch", { exact: false })).toBeVisible();
      await expect(page.getByText("completed", { exact: false })).toBeVisible();
    });

    test("tab switching works correctly", async ({ page }) => {
      await page.goto("/admin");
      // Start on Overview
      await expect(page.getByText("Total Users")).toBeVisible();
      // Switch to Users
      await page.getByRole("button", { name: "Users" }).click();
      await expect(page.getByPlaceholder("Search by email...")).toBeVisible();
      // Switch to Matching
      await page.getByRole("button", { name: "Matching" }).click();
      // Switch back to Overview
      await page.getByRole("button", { name: "Overview" }).click();
      await expect(page.getByText("Total Users")).toBeVisible();
    });
  });
});
