import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Route protection", () => {
  test("unauthenticated user visiting /dashboard is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /cv is redirected to /login", async ({ page }) => {
    await page.goto("/cv");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /jobs is redirected to /login", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page).toHaveURL(/\/login/);
  });

  test("authenticated user visiting /login is redirected to /dashboard", async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("authenticated user visiting /signup is redirected to /dashboard", async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("redirect preserves callbackUrl parameter", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
  });
});
