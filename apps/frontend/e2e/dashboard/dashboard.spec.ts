import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Dashboard page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("renders welcome header with user name", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByText("test")).toBeVisible(); // email.split("@")[0]
  });

  test("shows 4 stat cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Total Matches")).toBeVisible();
    await expect(page.getByText("Shortlisted")).toBeVisible();
    await expect(page.getByText("CV Status")).toBeVisible();
    await expect(page.getByText("Plan")).toBeVisible();
  });

  test("setup progress checklist shows when setup incomplete", async ({ page }) => {
    // Mock no CV to trigger incomplete setup
    await setupMockApi(page, {
      "GET /api/cv/active": {
        status: 404,
        body: { status: "error", message: "No active CV" },
      },
    });
    await page.goto("/dashboard");
    await expect(page.getByText("Complete Your Setup")).toBeVisible();
    await expect(page.getByText("Upload CV")).toBeVisible();
  });

  test("'Refresh Matches' button calls API", async ({ page }) => {
    await page.goto("/dashboard");
    const button = page.getByRole("button", { name: "Refresh Matches" });
    await expect(button).toBeVisible();
    await button.click();
    // Button should change to "Running..." state
    await expect(page.getByText("Running...")).toBeVisible();
  });

  test("recent matches section renders job cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Recent Job Matches")).toBeVisible();
    await expect(page.getByText("Senior React Developer")).toBeVisible();
    await expect(page.getByText("TechCorp")).toBeVisible();
  });

  test("CSV exports section shows when batches exist", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("CSV Exports")).toBeVisible();
  });

  test("logout button clears auth and redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    // Desktop sidebar sign out
    await page.locator("aside").getByText("Sign out").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
