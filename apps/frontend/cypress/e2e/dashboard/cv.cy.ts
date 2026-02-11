describe("CV page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("renders active CV view with parsed skills badges", () => {
    cy.visit("/cv");
    cy.contains("h1, h2, h3, h4, h5, h6", "My CV").should("be.visible");
    cy.contains("React").should("be.visible");
    cy.contains("TypeScript").should("be.visible");
    cy.contains("Next.js").should("be.visible");
  });

  it("renders parsed roles badges", () => {
    cy.visit("/cv");
    cy.contains("Frontend Developer").should("be.visible");
    cy.contains("Full Stack Engineer").should("be.visible");
  });

  it("shows CV text content", () => {
    cy.visit("/cv");
    cy.contains("John Doe").should("be.visible");
    cy.contains("Senior Frontend Developer").should("be.visible");
  });

  it("'Edit CV' switches to edit mode with textarea", () => {
    cy.visit("/cv");
    cy.contains("button", "Edit CV").click();
    cy.get("#cvText").should("be.visible");
  });

  it("edit mode textarea contains existing CV text", () => {
    cy.visit("/cv");
    cy.contains("button", "Edit CV").click();
    cy.get("#cvText").invoke("val").should("contain", "John Doe");
  });

  it("'Cancel' exits edit mode", () => {
    cy.visit("/cv");
    cy.contains("button", "Edit CV").click();
    cy.get("#cvText").should("be.visible");
    cy.contains("button", "Cancel").click();
    cy.contains("button", "Edit CV").should("be.visible");
  });

  it("'Save New Version' calls API and refreshes", () => {
    cy.intercept({ method: "PATCH", pathname: "/api/cv" }, (req) => {
      req.reply({ statusCode: 200, body: { status: "success", data: { version: 2 } }, delay: 200 });
    }).as("updateCv");
    cy.visit("/cv");
    cy.contains("button", "Edit CV").click();
    cy.get("#cvText")
      .clear()
      .type("Updated CV text with more than 50 characters to pass validation requirement for the form submission");
    cy.contains("button", "Save New Version").click();
    cy.contains("button", "Saving...").should("exist");
    cy.wait("@updateCv");
  });

  it("'Versions' button shows version history", () => {
    cy.visit("/cv");
    cy.contains("button", "Versions").click();
    cy.contains("Version History").should("be.visible");
  });
});
