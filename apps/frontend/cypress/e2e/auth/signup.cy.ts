describe("Signup page", () => {
  beforeEach(() => {
    cy.setupMockApi();
  });

  it("renders form with email, password, and confirm fields", () => {
    cy.visit("/signup");
    cy.contains("h1, h2, h3, h4, h5, h6", "Create an account").should("be.visible");
    cy.contains("Enter your email below to create your account").should("be.visible");
    cy.get("#email").should("be.visible");
    cy.get("#password").should("be.visible");
    cy.get("#confirmPassword").should("be.visible");
    cy.contains("button", "Create account").should("be.visible");
  });

  it("successful signup redirects to /verify", () => {
    cy.visit("/signup");
    cy.get("#email").clear().type("new@example.com");
    cy.get("#password").clear().type("password123");
    cy.get("#confirmPassword").clear().type("password123");
    cy.contains("button", "Create account").click();
    cy.url().should("match", /\/verify/);
  });

  it("password mismatch shows validation error", () => {
    cy.visit("/signup");
    cy.get("#email").clear().type("test@example.com");
    cy.get("#password").clear().type("password123");
    cy.get("#confirmPassword").clear().type("different456");
    cy.contains("button", "Create account").click();
    cy.contains("Passwords don't match").should("be.visible");
  });

  it("duplicate email shows error", () => {
    cy.setupMockApi({
      "POST /api/users/signup": {
        status: 409,
        body: { status: "error", message: "Email already exists" },
      },
    });
    cy.visit("/signup");
    cy.get("#email").clear().type("existing@example.com");
    cy.get("#password").clear().type("password123");
    cy.get("#confirmPassword").clear().type("password123");
    cy.contains("button", "Create account").click();
    cy.contains("Email already exists").should("be.visible");
  });

  it("'Sign in' link navigates to /login", () => {
    cy.visit("/signup");
    cy.contains("a", "Sign in").click();
    cy.url().should("match", /\/login/);
  });

  it("short password shows validation error", () => {
    cy.visit("/signup");
    cy.get("#email").clear().type("test@example.com");
    cy.get("#password").clear().type("short");
    cy.get("#confirmPassword").clear().type("short");
    cy.contains("button", "Create account").click();
    cy.contains("Password must be at least 8 characters").should("be.visible");
  });
});
