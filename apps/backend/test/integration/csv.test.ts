import request from "supertest";
import { app } from "../../src/app.js";
import { db } from "../../src/db/index.js";
import {
  mockSelectChain,
  mockInsertChain,
  mockUpdateChain,
  type MockDb,
} from "../utils/mocks/db.mock.js";
import { mockCsvExport, mockTask } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

/** Mock getUserPlan to return a starter subscription */
function mockStarterPlan() {
  mDb.select
    .mockReturnValueOnce(
      mockSelectChain([
        { planId: "plan-uuid-4444", status: "active", currentPeriodEnd: new Date() },
      ]),
    )
    .mockReturnValueOnce(
      mockSelectChain([{ id: "plan-uuid-4444", name: "starter" }]),
    );
}

describe("POST /api/csv/generate", () => {
  it("returns 202 on successful generation trigger", async () => {
    mockStarterPlan();
    // enqueue task
    mDb.insert.mockReturnValueOnce(mockInsertChain([mockTask]));

    const res = await request(app)
      .post("/api/csv/generate")
      .set(authHeader(userToken))
      .send({ batchId: "550e8400-e29b-41d4-a716-446655440000" });

    expect(res.status).toBe(202);
    expect(res.body.status).toBe("success");
    expect(res.body.data.taskId).toBeDefined();
  });

  it("returns 403 for user without subscription", async () => {
    // getUserPlan: no subscription
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .post("/api/csv/generate")
      .set(authHeader(userToken))
      .send({ batchId: "550e8400-e29b-41d4-a716-446655440000" });

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/csv/generate")
      .send({ batchId: "550e8400-e29b-41d4-a716-446655440000" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/csv/exports", () => {
  it("returns 200 with exports list", async () => {
    mockStarterPlan();
    // listExports: Promise.all([items, count])
    mDb.select
      .mockReturnValueOnce(mockSelectChain([mockCsvExport]))
      .mockReturnValueOnce(mockSelectChain([{ count: 1 }]));

    const res = await request(app)
      .get("/api/csv/exports")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/csv/download/:id", () => {
  it("returns 200 with CSV content type", async () => {
    mockStarterPlan();
    // downloadCsv: get export
    mDb.select.mockReturnValueOnce(mockSelectChain([mockCsvExport]));
    // get matches + jobs for CSV rebuild
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/csv/download/export-uuid-8888")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
  });
});

describe("PATCH /api/csv/:id/archive", () => {
  it("returns 200 on archive", async () => {
    mockStarterPlan();
    // get export
    mDb.select.mockReturnValueOnce(mockSelectChain([mockCsvExport]));
    // update isArchived
    mDb.update.mockReturnValueOnce(mockUpdateChain([{ ...mockCsvExport, isArchived: true }]));

    const res = await request(app)
      .patch("/api/csv/export-uuid-8888/archive")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});
