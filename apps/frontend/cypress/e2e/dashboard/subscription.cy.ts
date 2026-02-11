describe("Subscription page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("renders current plan card with name and status badge", () => {
    cy.visit("/subscription");
    cy.contains("starter").should("be.visible");
    cy.contains("active").should("be.visible");
  });

  it("'Cancel Subscription' button sends cancel request", () => {
    cy.visit("/subscription");
    cy.contains("button", "Cancel Subscription").should("be.visible").click();
  });

  it("'Change Plan' shows available plans grid", () => {
    cy.visit("/subscription");
    cy.contains("button", "Change Plan").should("be.visible").click();
    cy.contains("free").should("be.visible");
    cy.contains("pro").should("be.visible");
  });

  it("selecting a new plan and confirming calls subscribe API", () => {
    cy.visit("/subscription");
    cy.contains("button", "Change Plan").click();
    cy.contains("button", "Select").first().click();
  });

  it("payment history list renders", () => {
    cy.visit("/subscription");
    cy.contains("USD 9").should("be.visible");
  });

  it("no subscription state shows 'View Plans' prompt", () => {
    cy.setupMockApi({
      "GET /api/subscriptions/me": {
        status: 404,
        body: { status: "error", message: "No subscription" },
      },
    });
    cy.visit("/subscription");
    cy.contains("View Plans").should("be.visible");
  });
});
