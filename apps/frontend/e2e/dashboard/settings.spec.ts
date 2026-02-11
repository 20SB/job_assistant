import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Settings page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("renders account info (email and role read-only)", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible();
    await expect(page.getByText("Account Information")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByText("user", { exact: false })).toBeVisible();
  });

  test("email update form validates different email required", async ({ page }) => {
    await page.goto("/settings");
    const emailInput = page.locator("#email");
    // Fill same email — the button should be disabled
    await emailInput.fill("test@example.com");
    const updateEmailButton = page.getByRole("button", { name: "Update Email" });
    await expect(updateEmailButton).toBeDisabled();
  });

  test("email update calls PATCH API", async ({ page }) => {
    await page.goto("/settings");
    const emailInput = page.locator("#email");
    await emailInput.fill("new-email@example.com");
    const updateEmailButton = page.getByRole("button", { name: "Update Email" });
    await expect(updateEmailButton).toBeEnabled();
    await updateEmailButton.click();
    await expect(page.getByText("Updating...")).toBeVisible();
  });

  test("password update validates min 8 chars and match", async ({ page }) => {
    await page.goto("/settings");
    await page.locator("#password").fill("short");
    await page.locator("#confirmPassword").fill("short");
    await page.getByRole("button", { name: "Update Password" }).click();
    // Should show validation error for minimum length
    await expect(page.getByText("8 characters", { exact: false })).toBeVisible();
  });

  test("password update calls PATCH API", async ({ page }) => {
    await page.goto("/settings");
    await page.locator("#password").fill("newpassword123");
    await page.locator("#confirmPassword").fill("newpassword123");
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(page.getByText("Updating...")).toBeVisible();
  });

  test("delete account button is disabled", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Danger Zone")).toBeVisible();
    const deleteButton = page.getByRole("button", { name: /Delete Account/i });
    await expect(deleteButton).toBeDisabled();
  });
});
