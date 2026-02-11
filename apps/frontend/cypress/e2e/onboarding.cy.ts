describe("Onboarding page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("step 1: renders CV textarea", () => {
    cy.visit("/onboarding");
    cy.contains("h1, h2, h3, h4, h5, h6", "Upload your CV").should("be.visible");
    cy.contains("Paste your CV text below").should("be.visible");
    cy.get("#cvText").should("be.visible");
  });

  it("step 1: validates min 50 characters", () => {
    cy.visit("/onboarding");
    cy.get("#cvText").clear().type("Too short");
    cy.contains("button", "Next: Preferences").click();
    // Should still be on step 1
    cy.contains("h1, h2, h3, h4, h5, h6", "Upload your CV").should("be.visible");
  });

  it("step 1: 'Next: Preferences' advances to step 2", () => {
    cy.visit("/onboarding");
    const longCv =
      "A".repeat(60) + " Senior Developer with React, TypeScript, Node.js experience at Google";
    cy.get("#cvText").clear().type(longCv, { delay: 0 });
    cy.contains("button", "Next: Preferences").click();
    cy.contains("h1, h2, h3, h4, h5, h6", "Job Preferences").should("be.visible");
  });

  it("step 2: renders roles, locations, experience, salary fields", () => {
    cy.visit("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    cy.get("#cvText").clear().type(longCv, { delay: 0 });
    cy.contains("button", "Next: Preferences").click();
    cy.contains("h1, h2, h3, h4, h5, h6", "Job Preferences").should("be.visible");
    cy.get("#roles").should("be.visible");
    cy.get("#locations").should("be.visible");
    cy.get("#experience").should("be.visible");
    cy.get("#salary").should("be.visible");
  });

  it("step 2: 'Back' returns to step 1", () => {
    cy.visit("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    cy.get("#cvText").clear().type(longCv, { delay: 0 });
    cy.contains("button", "Next: Preferences").click();
    cy.contains("h1, h2, h3, h4, h5, h6", "Job Preferences").should("be.visible");
    cy.contains("button", "Back").click();
    cy.contains("h1, h2, h3, h4, h5, h6", "Upload your CV").should("be.visible");
  });

  it("step 2: 'Next: Subscription' advances to step 3", () => {
    cy.visit("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    cy.get("#cvText").clear().type(longCv, { delay: 0 });
    cy.contains("button", "Next: Preferences").click();
    cy.get("#roles").clear().type("Frontend Developer");
    cy.get("#locations").clear().type("Remote");
    cy.contains("button", "Next: Subscription").click();
    cy.contains("h1, h2, h3, h4, h5, h6", "Choose your plan").should("be.visible");
  });

  it("step 3: renders plan cards with free plan option", () => {
    cy.visit("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    cy.get("#cvText").clear().type(longCv, { delay: 0 });
    cy.contains("button", "Next: Preferences").click();
    cy.get("#roles").clear().type("Frontend Developer");
    cy.get("#locations").clear().type("Remote");
    cy.contains("button", "Next: Subscription").click();
    cy.contains("h1, h2, h3, h4, h5, h6", "Choose your plan").should("be.visible");
    cy.contains("Free").should("be.visible");
    cy.contains("button", "Complete Setup").should("be.visible");
  });

  it("step 3: 'Complete Setup' submits and redirects to /dashboard", () => {
    cy.visit("/onboarding");
    const longCv = "A".repeat(60) + " Senior Developer with React experience";
    cy.get("#cvText").clear().type(longCv, { delay: 0 });
    cy.contains("button", "Next: Preferences").click();
    cy.get("#roles").clear().type("Frontend Developer");
    cy.get("#locations").clear().type("Remote");
    cy.contains("button", "Next: Subscription").click();
    cy.contains("button", "Complete Setup").click();
    cy.url().should("match", /\/dashboard/);
  });
});
