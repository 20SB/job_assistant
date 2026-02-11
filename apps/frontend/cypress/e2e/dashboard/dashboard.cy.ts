describe("Dashboard page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("renders welcome header with user name", () => {
    cy.visit("/dashboard");
    cy.contains("Welcome back").should("be.visible");
    cy.contains("test").should("be.visible"); // email.split("@")[0]
  });

  it("shows 4 stat cards", () => {
    cy.visit("/dashboard");
    cy.contains("Total Matches").should("be.visible");
    cy.contains("Shortlisted").should("be.visible");
    cy.contains("CV Status").should("be.visible");
    cy.contains("Plan").should("be.visible");
  });

  it("setup progress checklist shows when setup incomplete", () => {
    cy.setupMockApi({
      "GET /api/cv/active": {
        status: 404,
        body: { status: "error", message: "No active CV" },
      },
    });
    cy.visit("/dashboard");
    cy.contains("Complete Your Setup").should("be.visible");
    cy.contains("Upload CV").should("be.visible");
  });

  it("'Refresh Matches' button calls API", () => {
    cy.intercept({ method: "POST", pathname: "/api/matching/run" }, (req) => {
      req.reply({ statusCode: 200, body: { status: "success", data: { batchId: "batch-1", message: "Matching started" } }, delay: 200 });
    }).as("matchingRun");
    cy.visit("/dashboard");
    cy.contains("button", "Refresh Matches").should("be.visible").click();
    cy.contains("button", "Running...").should("exist");
    cy.wait("@matchingRun");
  });

  it("recent matches section renders job cards", () => {
    cy.visit("/dashboard");
    cy.contains("Recent Job Matches").should("be.visible");
    cy.contains("Senior React Developer").should("be.visible");
    cy.contains("TechCorp").should("be.visible");
  });

  it("CSV exports section shows when batches exist", () => {
    cy.visit("/dashboard");
    cy.contains("CSV Exports").should("be.visible");
  });

  it("logout button clears auth and redirects to /login", () => {
    cy.visit("/dashboard");
    cy.get("aside").contains("Sign out").click();
    cy.url().should("match", /\/login/);
  });
});
