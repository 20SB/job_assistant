import { mockAdminUser } from "../support/test-data";

describe("Admin page", () => {
  it("non-admin user does not see Admin link in sidebar", () => {
    cy.loginAsUser();
    cy.setupMockApi();
    cy.visit("/dashboard");
    cy.get("aside").contains("Admin").should("not.exist");
  });

  describe("as admin", () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.setupMockApi({
        "GET /api/users/me": {
          status: 200,
          body: { status: "success", data: mockAdminUser },
        },
      });
    });

    it("admin user sees overview tab with stats cards", () => {
      cy.visit("/admin");
      cy.contains("h1, h2, h3, h4, h5, h6", "Admin Dashboard").should("be.visible");
      cy.contains("Total Users").should("be.visible");
      cy.contains("142").should("be.visible");
      cy.contains("Active Subscriptions").should("be.visible");
    });

    it("users tab renders table with search", () => {
      cy.visit("/admin");
      cy.contains("button", "Users").click();
      cy.get("[placeholder='Search by email...']").should("be.visible");
      cy.contains("test@example.com").should("be.visible");
    });

    it("user search filters results", () => {
      cy.visit("/admin");
      cy.contains("button", "Users").click();
      cy.get("[placeholder='Search by email...']").clear().type("admin");
      cy.contains("button", "Search").click();
    });

    it("job-fetch logs tab renders log cards", () => {
      cy.visit("/admin");
      cy.contains("button", "Job Fetch").click();
      cy.contains("completed").should("be.visible");
      cy.contains("adzuna").should("be.visible");
    });

    it("email logs tab renders with status badges", () => {
      cy.visit("/admin");
      cy.contains("button", "Email").click();
      cy.contains("sent").should("be.visible");
      cy.contains("Your job matches are ready").should("be.visible");
    });

    it("tasks tab renders task cards with status", () => {
      cy.visit("/admin");
      cy.contains("button", "Tasks").click();
      cy.contains("job_fetch").should("be.visible");
      cy.contains("completed").should("be.visible");
    });

    it("tab switching works correctly", () => {
      cy.visit("/admin");
      cy.contains("Total Users").should("be.visible");
      cy.contains("button", "Users").click();
      cy.get("[placeholder='Search by email...']").should("be.visible");
      cy.contains("button", "Matching").click();
      cy.contains("button", "Overview").click();
      cy.contains("Total Users").should("be.visible");
    });
  });
});
