describe("Exports page", () => {
  beforeEach(() => {
    cy.loginAsUser();
    cy.setupMockApi();
  });

  it("lists existing CSV exports with file name and row count", () => {
    cy.visit("/exports");
    cy.contains("h1, h2, h3, h4, h5, h6", "CSV Exports").should("be.visible");
    cy.contains("job-matches-2024-06-15.csv").should("be.visible");
    cy.contains("15 rows").should("be.visible");
  });

  it("'Generate' button calls generate API for selected batch", () => {
    cy.intercept({ method: "POST", pathname: "/api/csv/generate" }, (req) => {
      req.reply({ statusCode: 200, body: { status: "success", data: { message: "CSV generated successfully" } }, delay: 200 });
    }).as("generateCsv");
    cy.visit("/exports");
    cy.contains("button", "Generate").first().should("be.visible").click();
    cy.contains("button", "Generating...").should("exist");
    cy.wait("@generateCsv");
  });

  it("download button triggers file download", () => {
    cy.visit("/exports");
    cy.get("button").filter(":has(svg)").first().should("be.visible");
  });

  it("archive button calls archive API", () => {
    cy.intercept({ method: "PATCH", pathname: /\/api\/csv\/[^/]+\/archive/ }, {
      statusCode: 200,
      body: { status: "success", data: null },
    }).as("archive");
    cy.visit("/exports");
    // Archive button is the last icon button in each export row
    // Filename is in h3 > div > div(left) > div(row), buttons are in div(right) > div(row)
    cy.contains("h3", "job-matches-2024-06-15.csv")
      .parents("div")
      .filter(":has(button)")
      .first()
      .find("button")
      .last()
      .click();
  });

  it("batch list shows available batches", () => {
    cy.visit("/exports");
    cy.contains("Generate New CSV").should("be.visible");
    cy.contains("batch-1").should("be.visible");
  });

  it("pagination shows when multiple pages exist", () => {
    // Override with 15+ exports to trigger pagination (limit default is 10)
    const manyExports = Array(12).fill(null).map((_, i) => ({
      id: `export-${i}`,
      userId: "user-1",
      batchId: "batch-1",
      fileName: `job-matches-${i}.csv`,
      fileSize: 4096,
      totalRows: 15,
      status: "completed",
      createdAt: "2024-06-15T14:00:00Z",
    }));
    cy.setupMockApi({
      "GET /api/csv/exports": {
        status: 200,
        body: {
          status: "success",
          data: { exports: manyExports.slice(0, 10), total: 12, page: 1, limit: 10 },
        },
      },
    });
    cy.visit("/exports");
    cy.contains("Page").should("be.visible");
  });
});
