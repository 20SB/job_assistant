import { mockAdminUser } from "../../support/test-data";

describe("Navigation", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("desktop sidebar shows all nav links", () => {
    cy.visit("/dashboard");
    cy.get("aside").within(() => {
      cy.contains("Dashboard").should("be.visible");
      cy.contains("Job Matches").should("be.visible");
      cy.contains("CSV Exports").should("be.visible");
      cy.contains("Notifications").should("be.visible");
      cy.contains("My CV").should("be.visible");
      cy.contains("Preferences").should("be.visible");
      cy.contains("Subscription").should("be.visible");
      cy.contains("Settings").should("be.visible");
    });
  });

  it("sidebar active page is highlighted", () => {
    cy.visit("/dashboard");
    cy.get("aside")
      .contains("a", "Dashboard")
      .invoke("attr", "class")
      .should("match", /text-blue/);
  });

  it("sidebar 'Admin' link only shows for admin users", () => {
    cy.visit("/dashboard");
    cy.get("aside").contains("Admin").should("not.exist");
  });

  it("admin sidebar shows Admin link", () => {
    cy.loginAsAdmin();
    cy.setupMockApi({
      "GET /api/users/me": {
        status: 200,
        body: { status: "success", data: mockAdminUser },
      },
    });
    cy.visit("/dashboard");
    cy.get("aside").contains("Admin").should("be.visible");
  });

  it("logo click navigates to /dashboard", () => {
    cy.visit("/cv");
    cy.get("aside").contains("Job Assistant").click();
    cy.url().should("match", /\/dashboard/);
  });

  it("sidebar logout calls logout and redirects", () => {
    cy.visit("/dashboard");
    cy.get("aside").contains("Sign out").click();
    cy.url().should("match", /\/login/);
  });

  it("dark mode toggle changes theme class on html", () => {
    cy.visit("/dashboard");
    cy.get('button[aria-label="Toggle theme"]').should("be.visible").click();
    cy.get("html").then(($html) => {
      const hasDarkAfterFirst = $html.hasClass("dark");
      cy.get('button[aria-label="Toggle theme"]').click();
      cy.get("html").then(($html2) => {
        const hasDarkAfterSecond = $html2.hasClass("dark");
        expect(hasDarkAfterFirst).not.to.eq(hasDarkAfterSecond);
      });
    });
  });
});
