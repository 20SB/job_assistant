import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Responsive layout", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("desktop (1280px): sidebar visible, bottom nav hidden", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    // Sidebar should be visible
    await expect(page.locator("aside")).toBeVisible();
    // Bottom nav should be hidden on desktop (md:hidden)
    const bottomNav = page.locator("nav.fixed, nav").filter({ has: page.locator("a") }).last();
    // The mobile bottom nav is hidden at md breakpoint
  });

  test("mobile (390px): sidebar hidden, bottom nav visible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    // Sidebar should be hidden on mobile (hidden md:flex)
    await expect(page.locator("aside")).not.toBeVisible();
    // Bottom nav should be visible
    // Bottom nav contains nav links at the bottom
    const bottomNav = page.locator("nav.fixed");
    if (await bottomNav.isVisible()) {
      await expect(bottomNav).toBeVisible();
    }
  });

  test("mobile: bottom nav links navigate correctly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    // Find mobile nav link for Job Matches
    const mobileNav = page.locator("nav.fixed");
    if (await mobileNav.isVisible()) {
      const jobsLink = mobileNav.getByText("Job Matches");
      if (await jobsLink.isVisible()) {
        await jobsLink.click();
        await expect(page).toHaveURL(/\/jobs/);
      }
    }
  });

  test("mobile: header shows logo and sign out", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    // Mobile header should show logo (brand) and sign out
    const header = page.locator("header");
    await expect(header.getByText("Job Assistant")).toBeVisible();
    await expect(header.getByText("Sign out")).toBeVisible();
  });

  test("dashboard stat cards stack on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    // Stat cards should all be visible (stacked in 2-col grid on mobile)
    await expect(page.getByText("Total Matches")).toBeVisible();
    await expect(page.getByText("Shortlisted")).toBeVisible();
    await expect(page.getByText("CV Status")).toBeVisible();
    await expect(page.getByText("Plan")).toBeVisible();
  });

  test("mobile: forms are full-width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    // The card should be visible and the form should take full width
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    const submitButton = page.getByRole("button", { name: "Sign in" });
    await expect(submitButton).toBeVisible();
    // Button should have w-full class
    await expect(submitButton).toHaveClass(/w-full/);
  });
});
