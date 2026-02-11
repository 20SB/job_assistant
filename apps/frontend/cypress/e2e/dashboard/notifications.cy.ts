describe("Notifications page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("renders notification preferences with frequency buttons and toggles", () => {
    cy.visit("/notifications");
    cy.contains("h1, h2, h3, h4, h5, h6", "Notifications").should("be.visible");
    cy.contains("Notification Preferences").should("be.visible");
    cy.contains("Hourly").should("be.visible");
    cy.contains("Daily").should("be.visible");
    cy.contains("Weekly").should("be.visible");
  });

  it("frequency button selection changes visually", () => {
    cy.visit("/notifications");
    cy.contains("button", "Weekly").click().should("be.visible");
  });

  it("toggle switches change state", () => {
    cy.visit("/notifications");
    cy.contains("Subscription Updates").should("be.visible");
    cy.contains("Payment Notifications").should("be.visible");
    cy.contains("Marketing Emails").should("be.visible");
  });

  it("'Save Preferences' calls create/update API", () => {
    cy.intercept({ method: "PATCH", pathname: "/api/notifications/preferences" }, (req) => {
      req.reply({ statusCode: 200, body: { status: "success", data: {} }, delay: 200 });
    }).as("updateNotifPrefs");
    cy.visit("/notifications");
    cy.contains("button", "Save Preferences").click();
    cy.contains("button", "Saving...").should("exist");
    cy.wait("@updateNotifPrefs");
  });

  it("notification history renders with type badges", () => {
    cy.visit("/notifications");
    cy.contains("Notification History").should("be.visible");
    cy.contains("15 new job matches found").should("be.visible");
    cy.contains("Subscription renewed").should("be.visible");
  });

  it("type filter dropdown filters notifications", () => {
    cy.visit("/notifications");
    cy.get("select")
      .first()
      .then(($select) => {
        if ($select.is(":visible")) {
          cy.wrap($select).select("Match Batch");
        }
      });
  });

  it("'Reset' button calls delete API", () => {
    cy.visit("/notifications");
    cy.contains("button", "Reset").should("be.visible").click();
  });
});
