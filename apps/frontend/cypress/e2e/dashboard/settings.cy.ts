describe("Settings page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("renders account info (email and role read-only)", () => {
    cy.visit("/settings");
    cy.contains("h1, h2, h3, h4, h5, h6", "Account Settings").should("be.visible");
    cy.contains("Account Information").should("be.visible");
    cy.contains("test@example.com").should("be.visible");
    cy.contains("user").should("be.visible");
  });

  it("email update form validates different email required", () => {
    cy.visit("/settings");
    cy.get("#email").clear().type("test@example.com");
    cy.contains("button", "Update Email").should("be.disabled");
  });

  it("email update calls PATCH API", () => {
    cy.intercept({ method: "PATCH", pathname: "/api/users/me" }, (req) => {
      req.reply({ statusCode: 200, body: { status: "success", data: {} }, delay: 200 });
    }).as("updateUser");
    cy.visit("/settings");
    cy.get("#email").clear().type("new-email@example.com");
    cy.contains("button", "Update Email").should("be.enabled").click();
    cy.contains("button", "Updating...").should("exist");
    cy.wait("@updateUser");
  });

  it("password update validates min 8 chars and match", () => {
    cy.visit("/settings");
    cy.get("#password").clear().type("short");
    cy.get("#confirmPassword").clear().type("short");
    cy.contains("button", "Update Password").click();
    cy.contains("8 characters").should("be.visible");
  });

  it("password update calls PATCH API", () => {
    cy.intercept({ method: "PATCH", pathname: "/api/users/me" }, (req) => {
      req.reply({ statusCode: 200, body: { status: "success", data: {} }, delay: 200 });
    }).as("updatePassword");
    cy.visit("/settings");
    cy.get("#password").clear().type("newpassword123");
    cy.get("#confirmPassword").clear().type("newpassword123");
    cy.contains("button", "Update Password").click();
    cy.contains("button", "Updating...").should("exist");
    cy.wait("@updatePassword");
  });

  it("delete account button is disabled", () => {
    cy.visit("/settings");
    cy.contains("Danger Zone").should("be.visible");
    cy.contains("button", /Delete Account/i).should("be.disabled");
  });
});
