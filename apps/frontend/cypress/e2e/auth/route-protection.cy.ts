describe("Route protection", () => {
  it("unauthenticated user visiting /dashboard is redirected to /login", () => {
    cy.visit("/dashboard");
    cy.url().should("match", /\/login/);
  });

  it("unauthenticated user visiting /cv is redirected to /login", () => {
    cy.visit("/cv");
    cy.url().should("match", /\/login/);
  });

  it("unauthenticated user visiting /jobs is redirected to /login", () => {
    cy.visit("/jobs");
    cy.url().should("match", /\/login/);
  });

  it("authenticated user visiting /login is redirected to /dashboard", () => {
    cy.loginAsUser();
    cy.setupMockApi();
    cy.visit("/login");
    cy.url().should("match", /\/dashboard/);
  });

  it("authenticated user visiting /signup is redirected to /dashboard", () => {
    cy.loginAsUser();
    cy.setupMockApi();
    cy.visit("/signup");
    cy.url().should("match", /\/dashboard/);
  });

  it("redirect preserves callbackUrl parameter", () => {
    cy.visit("/dashboard");
    cy.url().should("match", /\/login\?callbackUrl=%2Fdashboard/);
  });
});
