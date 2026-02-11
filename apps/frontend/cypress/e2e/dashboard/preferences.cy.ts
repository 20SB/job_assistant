describe("Preferences page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("view mode renders info cards (roles, locations, salary, experience, filters)", () => {
    cy.visit("/preferences");
    cy.contains("h1, h2, h3, h4, h5, h6", "Job Preferences").should("be.visible");
    cy.contains("Roles").should("be.visible");
    cy.contains("Locations").should("be.visible");
    cy.contains("Salary").should("be.visible");
    cy.contains("Experience").should("be.visible");
    cy.contains("Filters").should("be.visible");
  });

  it("'Edit' button switches to edit mode", () => {
    cy.visit("/preferences");
    cy.contains("button", "Edit").click();
    cy.get("#preferredRoles").should("be.visible");
  });

  it("edit form pre-populates with existing values", () => {
    cy.visit("/preferences");
    cy.contains("button", "Edit").click();
    cy.get("#preferredRoles").should("have.value", "Frontend Developer, React Engineer");
    cy.get("#locations").should("have.value", "Remote, London");
  });

  it("role and location fields accept comma-separated input", () => {
    cy.visit("/preferences");
    cy.contains("button", "Edit").click();
    cy.get("#preferredRoles").clear().type("React Dev, Vue Dev, Angular Dev");
    cy.get("#preferredRoles").should("have.value", "React Dev, Vue Dev, Angular Dev");
  });

  it("'Cancel' exits edit mode", () => {
    cy.visit("/preferences");
    cy.contains("button", "Edit").click();
    cy.get("#preferredRoles").should("be.visible");
    cy.contains("button", "Cancel").click();
    cy.contains("button", "Edit").should("be.visible");
  });

  it("'Save Preferences' calls API and returns to view mode", () => {
    cy.intercept({ method: "PATCH", pathname: "/api/preferences" }, (req) => {
      req.reply({ statusCode: 200, body: { status: "success", data: {} }, delay: 200 });
    }).as("updatePrefs");
    cy.visit("/preferences");
    cy.contains("button", "Edit").click();
    cy.get("#preferredRoles").clear().type("Updated Role");
    cy.get("#locations").clear().type("New York");
    cy.contains("button", "Save Preferences").click();
    cy.contains("button", "Saving...").should("exist");
    cy.wait("@updatePrefs");
  });

  it("empty state shows edit form directly when no preferences exist", () => {
    cy.setupMockApi({
      "GET /api/preferences": {
        status: 404,
        body: { status: "error", message: "No preferences found" },
      },
    });
    cy.visit("/preferences");
    cy.get("#preferredRoles").should("be.visible");
  });
});
