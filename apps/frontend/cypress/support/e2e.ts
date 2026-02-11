import "./commands";

// Overwrite cy.visit to inject localStorage auth token before React hydrates
Cypress.Commands.overwrite(
  "visit",
  (originalFn: Cypress.CommandOriginalFn<"visit">, url: string | Partial<Cypress.VisitOptions>, options?: Partial<Cypress.VisitOptions>) => {
    const token = Cypress.env("_authToken") as string | undefined;
    if (token) {
      const opts: Partial<Cypress.VisitOptions> = typeof url === "string" ? { ...options } : { ...url };
      const origBeforeLoad = opts.onBeforeLoad;
      opts.onBeforeLoad = (win) => {
        win.localStorage.setItem("auth_token", token);
        if (origBeforeLoad) origBeforeLoad(win);
      };
      if (typeof url === "string") {
        return originalFn(url, opts);
      }
      return originalFn(opts);
    }
    return originalFn(url, options as Partial<Cypress.VisitOptions>);
  },
);

// Clean up auth state after each test
afterEach(() => {
  Cypress.env("_authToken", undefined);
});

// Suppress uncaught exceptions from the app (React hydration errors, etc.)
Cypress.on("uncaught:exception", () => false);
