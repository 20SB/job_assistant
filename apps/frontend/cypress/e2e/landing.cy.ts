describe("Landing page", () => {
  it("renders hero section with CTA buttons", () => {
    cy.visit("/");
    cy.contains("Stop Searching.").should("be.visible");
    cy.contains("a", "Get Started for Free").should("be.visible");
    cy.contains("a", "How it works").should("be.visible");
  });

  it("'Get Started for Free' button navigates to /signup", () => {
    cy.visit("/");
    cy.contains("a", "Get Started for Free").click();
    cy.url().should("match", /\/signup/);
  });

  it("pricing section shows plan cards", () => {
    cy.visit("/");
    cy.contains("h1, h2, h3, h4, h5, h6", "Simple, transparent pricing").should("be.visible");
    cy.contains("Free").should("be.visible");
    cy.contains("Starter").should("be.visible");
    cy.contains("Pro").should("be.visible");
  });

  it("FAQ items expand/collapse on click", () => {
    cy.visit("/");
    cy.contains("How does the AI matching algorithm work?").should("be.visible").click();
    cy.get("details")
      .filter(":contains('AI matching algorithm')")
      .should("have.attr", "open");
  });

  it("footer links are present", () => {
    cy.visit("/");
    cy.contains("Privacy Policy").should("be.visible");
    cy.contains("Terms of Service").should("be.visible");
    cy.contains("Contact").should("be.visible");
  });
});
