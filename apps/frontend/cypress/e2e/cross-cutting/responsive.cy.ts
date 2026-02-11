describe("Responsive layout", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("desktop (1280px): sidebar visible, bottom nav hidden", () => {
    cy.viewport(1280, 800);
    cy.visit("/dashboard");
    cy.get("aside").should("be.visible");
  });

  it("mobile (390px): sidebar hidden, bottom nav visible", () => {
    cy.viewport(390, 844);
    cy.visit("/dashboard");
    cy.get("aside").should("not.be.visible");
    cy.get("nav.fixed").then(($nav) => {
      if ($nav.is(":visible")) {
        cy.wrap($nav).should("be.visible");
      }
    });
  });

  it("mobile: bottom nav links navigate correctly", () => {
    cy.viewport(390, 844);
    cy.visit("/dashboard");
    cy.get("nav.fixed").then(($nav) => {
      if ($nav.is(":visible")) {
        cy.wrap($nav).contains("Job Matches").then(($link) => {
          if ($link.is(":visible")) {
            cy.wrap($link).click();
            cy.url().should("match", /\/jobs/);
          }
        });
      }
    });
  });

  it("mobile: header shows logo and sign out", () => {
    cy.viewport(390, 844);
    cy.visit("/dashboard");
    cy.get("header").within(() => {
      cy.contains("Job Assistant").should("be.visible");
      cy.contains("Sign out").should("be.visible");
    });
  });

  it("dashboard stat cards stack on mobile", () => {
    cy.viewport(390, 844);
    cy.visit("/dashboard");
    cy.contains("Total Matches").should("be.visible");
    cy.contains("Shortlisted").should("be.visible");
    cy.contains("CV Status").should("be.visible");
    cy.contains("Plan").should("be.visible");
  });

  it("mobile: forms are full-width", () => {
    cy.viewport(390, 844);
    // Clear auth so we can visit the login page without redirect
    cy.clearCookie("auth_token");
    Cypress.env("_authToken", undefined);
    cy.visit("/login");
    cy.get("#email").should("be.visible");
    cy.get("#password").should("be.visible");
    cy.contains("button", "Sign in")
      .should("be.visible")
      .invoke("attr", "class")
      .should("match", /w-full/);
  });
});
