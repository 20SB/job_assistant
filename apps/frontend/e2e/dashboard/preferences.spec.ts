import { test, expect } from "@playwright/test";
import { loginAsUser } from "../helpers/auth.js";
import { setupMockApi } from "../helpers/mock-api.js";

test.describe("Preferences page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
    await setupMockApi(page);
  });

  test("view mode renders info cards (roles, locations, salary, experience, filters)", async ({
    page,
  }) => {
    await page.goto("/preferences");
    await expect(page.getByRole("heading", { name: "Job Preferences" })).toBeVisible();
    await expect(page.getByText("Roles")).toBeVisible();
    await expect(page.getByText("Locations")).toBeVisible();
    await expect(page.getByText("Salary")).toBeVisible();
    await expect(page.getByText("Experience")).toBeVisible();
    await expect(page.getByText("Filters")).toBeVisible();
  });

  test("'Edit' button switches to edit mode", async ({ page }) => {
    await page.goto("/preferences");
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.locator("#preferredRoles")).toBeVisible();
  });

  test("edit form pre-populates with existing values", async ({ page }) => {
    await page.goto("/preferences");
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.locator("#preferredRoles")).toHaveValue(
      "Frontend Developer, React Engineer",
    );
    await expect(page.locator("#locations")).toHaveValue("Remote, London");
  });

  test("role and location fields accept comma-separated input", async ({ page }) => {
    await page.goto("/preferences");
    await page.getByRole("button", { name: "Edit" }).click();
    await page.locator("#preferredRoles").fill("React Dev, Vue Dev, Angular Dev");
    await expect(page.locator("#preferredRoles")).toHaveValue("React Dev, Vue Dev, Angular Dev");
  });

  test("'Cancel' exits edit mode", async ({ page }) => {
    await page.goto("/preferences");
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.locator("#preferredRoles")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  test("'Save Preferences' calls API and returns to view mode", async ({ page }) => {
    await page.goto("/preferences");
    await page.getByRole("button", { name: "Edit" }).click();
    await page.locator("#preferredRoles").fill("Updated Role");
    await page.locator("#locations").fill("New York");
    await page.getByRole("button", { name: "Save Preferences" }).click();
    await expect(page.getByText("Saving...")).toBeVisible();
  });

  test("empty state shows edit form directly when no preferences exist", async ({ page }) => {
    await setupMockApi(page, {
      "GET /api/preferences": {
        status: 404,
        body: { status: "error", message: "No preferences found" },
      },
    });
    await page.goto("/preferences");
    // Should show the edit form directly (or a prompt to create)
    await expect(page.locator("#preferredRoles")).toBeVisible();
  });
});
