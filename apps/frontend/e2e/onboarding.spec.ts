import { test, expect } from "@playwright/test";
import { loginAsUser } from "./helpers/auth.js";
import { setupMockApi } from "./helpers/mock-api.js";

test.describe("Onboarding page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("step 1: renders CV textarea", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: "Upload your CV" })).toBeVisible();
    await expect(page.getByText("Paste your CV text below")).toBeVisible();
    await expect(page.locator("#cvText")).toBeVisible();
  });

  test("step 1: validates min 50 characters", async ({ page }) => {
    await page.goto("/onboarding");
    await page.locator("#cvText").fill("Too short");
    await page.getByRole("button", { name: "Next: Preferences" }).click();
    // The button should be disabled or an error shown — CV too short
    // Check that we're still on step 1 (heading still visible)
    await expect(page.getByRole("heading", { name: "Upload your CV" })).toBeVisible();
  });

  test("step 1: 'Next: Preferences' advances to step 2", async ({ page }) => {
    await page.goto("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React, TypeScript, Node.js experience at Google";
    await page.locator("#cvText").fill(longCv);
    await page.getByRole("button", { name: "Next: Preferences" }).click();
    await expect(page.getByRole("heading", { name: "Job Preferences" })).toBeVisible();
  });

  test("step 2: renders roles, locations, experience, salary fields", async ({ page }) => {
    await page.goto("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    await page.locator("#cvText").fill(longCv);
    await page.getByRole("button", { name: "Next: Preferences" }).click();
    await expect(page.getByRole("heading", { name: "Job Preferences" })).toBeVisible();
    await expect(page.locator("#roles")).toBeVisible();
    await expect(page.locator("#locations")).toBeVisible();
    await expect(page.locator("#experience")).toBeVisible();
    await expect(page.locator("#salary")).toBeVisible();
  });

  test("step 2: 'Back' returns to step 1", async ({ page }) => {
    await page.goto("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    await page.locator("#cvText").fill(longCv);
    await page.getByRole("button", { name: "Next: Preferences" }).click();
    await expect(page.getByRole("heading", { name: "Job Preferences" })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("heading", { name: "Upload your CV" })).toBeVisible();
  });

  test("step 2: 'Next: Subscription' advances to step 3", async ({ page }) => {
    await page.goto("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    await page.locator("#cvText").fill(longCv);
    await page.getByRole("button", { name: "Next: Preferences" }).click();
    await page.locator("#roles").fill("Frontend Developer");
    await page.locator("#locations").fill("Remote");
    await page.getByRole("button", { name: "Next: Subscription" }).click();
    await expect(page.getByRole("heading", { name: "Choose your plan" })).toBeVisible();
  });

  test("step 3: renders plan cards with free plan option", async ({ page }) => {
    await page.goto("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    await page.locator("#cvText").fill(longCv);
    await page.getByRole("button", { name: "Next: Preferences" }).click();
    await page.locator("#roles").fill("Frontend Developer");
    await page.locator("#locations").fill("Remote");
    await page.getByRole("button", { name: "Next: Subscription" }).click();
    await expect(page.getByRole("heading", { name: "Choose your plan" })).toBeVisible();
    await expect(page.getByText("Free", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Complete Setup" })).toBeVisible();
  });

  test("step 3: 'Complete Setup' submits and redirects to /dashboard", async ({ page }) => {
    await page.goto("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    await page.locator("#cvText").fill(longCv);
    await page.getByRole("button", { name: "Next: Preferences" }).click();
    await page.locator("#roles").fill("Frontend Developer");
    await page.locator("#locations").fill("Remote");
    await page.getByRole("button", { name: "Next: Subscription" }).click();
    await page.getByRole("button", { name: "Complete Setup" }).click();
    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
