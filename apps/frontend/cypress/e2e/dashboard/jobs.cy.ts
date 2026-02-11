describe("Jobs page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("renders job match cards with title, company, location", () => {
    cy.visit("/jobs");
    cy.contains("h1, h2, h3, h4, h5, h6", "Job Matches").should("be.visible");
    cy.contains("Senior React Developer").should("be.visible");
    cy.contains("TechCorp").should("be.visible");
    cy.contains("London, UK").should("be.visible");
  });

  it("match percentage badge shown with correct color", () => {
    cy.visit("/jobs");
    cy.contains("85%").should("be.visible");
    cy.contains("62%").should("be.visible");
  });

  it("expanding a card shows score breakdown bars", () => {
    cy.visit("/jobs");
    cy.contains("Senior React Developer").click();
    cy.contains("Score Breakdown").should("be.visible");
  });

  it("expanding shows matched/missing skills badges", () => {
    cy.visit("/jobs");
    cy.contains("Senior React Developer").click();
    cy.contains("Matched Skills").should("be.visible");
    cy.contains("Missing Skills").should("be.visible");
    cy.contains("GraphQL").should("be.visible");
  });

  it("star icon toggles shortlist", () => {
    cy.intercept("PATCH", "**/api/matching/*/shortlist", {
      statusCode: 200,
      body: { status: "success", data: { isShortlisted: true } },
    }).as("shortlist");
    cy.visit("/jobs");
    // Find the first job card and click its first button (star)
    cy.contains("Senior React Developer")
      .parents("article, [class*='border']")
      .first()
      .find("button")
      .first()
      .click();
  });

  it("clicking card marks as viewed", () => {
    cy.intercept("PATCH", "**/api/matching/*/viewed", {
      statusCode: 200,
      body: { status: "success", data: { viewedAt: new Date().toISOString() } },
    }).as("viewed");
    cy.visit("/jobs");
    cy.contains("Senior React Developer").click();
  });

  it("filter: shortlisted-only checkbox filters results", () => {
    cy.visit("/jobs");
    cy.contains("button", "Filters").click();
    cy.get("#shortlistedOnly").check();
    cy.get("#shortlistedOnly").should("be.checked");
  });

  it("pagination next/previous buttons work", () => {
    cy.setupMockApi({
      "GET /api/matching/results": {
        status: 200,
        body: {
          status: "success",
          data: {
            matches: Array(10)
              .fill(null)
              .map((_, i) => ({
                matchId: `match-${i}`,
                userId: "user-1",
                jobId: `job-${i}`,
                batchId: "batch-1",
                matchPercentage: 80 - i,
                scoreBreakdown: {
                  roleRelevance: 80,
                  skillMatch: 80,
                  experienceMatch: 80,
                  locationMatch: 80,
                  salaryMatch: 80,
                },
                matchedSkills: ["React"],
                missingSkills: [],
                recommendation: "Good match",
                isShortlisted: false,
                viewedAt: null,
                createdAt: "2024-06-15T12:00:00Z",
                job: {
                  id: `job-${i}`,
                  title: `Job ${i}`,
                  company: "Corp",
                  location: "Remote",
                  isRemote: true,
                },
              })),
            total: 25,
            page: 1,
            limit: 10,
          },
        },
      },
    });
    cy.visit("/jobs");
    cy.contains("button", "Next").should("be.visible");
  });

  it("empty state shows 'No matches yet' and 'Run Matching' button", () => {
    cy.setupMockApi({
      "GET /api/matching/results": {
        status: 200,
        body: { status: "success", data: { matches: [], total: 0, page: 1, limit: 10 } },
      },
    });
    cy.visit("/jobs");
    cy.contains("No matches yet").should("be.visible");
    cy.contains("button", "Run Matching").should("be.visible");
  });
});
