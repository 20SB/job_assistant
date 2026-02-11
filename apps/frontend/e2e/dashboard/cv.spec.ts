import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("CV page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("renders active CV view with parsed skills badges", async ({ page }) => {
    await page.goto("/cv");
    await expect(page.getByRole("heading", { name: "My CV" })).toBeVisible();
    await expect(page.getByText("React")).toBeVisible();
    await expect(page.getByText("TypeScript")).toBeVisible();
    await expect(page.getByText("Next.js")).toBeVisible();
  });

  test("renders parsed roles badges", async ({ page }) => {
    await page.goto("/cv");
    await expect(page.getByText("Frontend Developer")).toBeVisible();
    await expect(page.getByText("Full Stack Engineer")).toBeVisible();
  });

  test("shows CV text content", async ({ page }) => {
    await page.goto("/cv");
    await expect(page.getByText("John Doe")).toBeVisible();
    await expect(page.getByText("Senior Frontend Developer")).toBeVisible();
  });

  test("'Edit CV' switches to edit mode with textarea", async ({ page }) => {
    await page.goto("/cv");
    await page.getByRole("button", { name: "Edit CV" }).click();
    await expect(page.locator("#cvText")).toBeVisible();
  });

  test("edit mode textarea contains existing CV text", async ({ page }) => {
    await page.goto("/cv");
    await page.getByRole("button", { name: "Edit CV" }).click();
    const textarea = page.locator("#cvText");
    await expect(textarea).toHaveValue(/John Doe/);
  });

  test("'Cancel' exits edit mode", async ({ page }) => {
    await page.goto("/cv");
    await page.getByRole("button", { name: "Edit CV" }).click();
    await expect(page.locator("#cvText")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    // Should be back in view mode
    await expect(page.getByRole("button", { name: "Edit CV" })).toBeVisible();
  });

  test("'Save New Version' calls API and refreshes", async ({ page }) => {
    await page.goto("/cv");
    await page.getByRole("button", { name: "Edit CV" }).click();
    const textarea = page.locator("#cvText");
    await textarea.fill(
      "Updated CV text with more than 50 characters to pass validation requirement for the form submission",
    );
    await page.getByRole("button", { name: "Save New Version" }).click();
    // Should show saving state
    await expect(page.getByText("Saving...")).toBeVisible();
  });

  test("'Versions' button shows version history", async ({ page }) => {
    await page.goto("/cv");
    await page.getByRole("button", { name: "Versions" }).click();
    await expect(page.getByText("Version History")).toBeVisible();
  });
});
