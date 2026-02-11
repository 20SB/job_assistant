describe("Login page", () => {
  beforeEach(() => {
    cy.setupMockApi();
  });

  it("renders form with email and password fields", () => {
    cy.visit("/login");
    cy.contains("h1, h2, h3, h4, h5, h6", "Sign in").should("be.visible");
    cy.contains("Enter your email and password to sign in").should("be.visible");
    cy.get("#email").should("be.visible");
    cy.get("#password").should("be.visible");
    cy.contains("button", "Sign in").should("be.visible");
  });

  it("successful login redirects to /dashboard", () => {
    cy.visit("/login");
    cy.get("#email").clear().type("test@example.com");
    cy.get("#password").clear().type("password123");
    cy.contains("button", "Sign in").click();
    cy.url().should("match", /\/dashboard/);
  });

  it("invalid credentials show error message", () => {
    cy.setupMockApi({
      "POST /api/users/login": {
        status: 401,
        body: { status: "error", message: "Invalid credentials" },
      },
    });
    cy.visit("/login");
    cy.get("#email").clear().type("bad@test.com");
    cy.get("#password").clear().type("wrongpass");
    cy.contains("button", "Sign in").click();
    cy.contains("Invalid credentials").should("be.visible");
  });

  it("empty email shows validation error", () => {
    cy.visit("/login");
    cy.get("#password").clear().type("password123");
    cy.contains("button", "Sign in").click();
    cy.contains("Invalid email address").should("be.visible");
  });

  it("empty password shows validation error", () => {
    cy.visit("/login");
    cy.get("#email").clear().type("test@example.com");
    cy.contains("button", "Sign in").click();
    cy.contains("Password is required").should("be.visible");
  });

  it("'Sign up' link navigates to /signup", () => {
    cy.visit("/login");
    cy.contains("a", "Sign up").click();
    cy.url().should("match", /\/signup/);
  });

  it("'Forgot password?' link is present", () => {
    cy.visit("/login");
    cy.contains("a", "Forgot password?").should("be.visible");
  });
});
