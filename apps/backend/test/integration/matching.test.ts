import request from "supertest";
import { app } from "../../src/app.js";
import { db } from "../../src/db/index.js";
import {
  mockSelectChain,
  mockInsertChain,
  mockUpdateChain,
  type MockDb,
} from "../utils/mocks/db.mock.js";
import { mockMatchBatch, mockJobMatch, mockTask } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

describe("POST /api/matching/run", () => {
  it("returns 202 on successful matching trigger", async () => {
    mDb.insert.mockReturnValueOnce(mockInsertChain([mockTask]));

    const res = await request(app)
      .post("/api/matching/run")
      .set(authHeader(userToken))
      .send({ trigger: "scheduled" });

    expect(res.status).toBe(202);
    expect(res.body.status).toBe("success");
    expect(res.body.data.taskId).toBeDefined();
  });

  it("returns 202 with default trigger when body is empty", async () => {
    mDb.insert.mockReturnValueOnce(mockInsertChain([mockTask]));

    const res = await request(app)
      .post("/api/matching/run")
      .set(authHeader(userToken))
      .send({});

    expect(res.status).toBe(202);
    expect(res.body.status).toBe("success");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/matching/run")
      .send({ trigger: "scheduled" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/matching/batches", () => {
  it("returns 200 with batches list", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockMatchBatch]));

    const res = await request(app)
      .get("/api/matching/batches")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/matching/batches/:id", () => {
  it("returns 200 with batch details", async () => {
    // get batch
    mDb.select.mockReturnValueOnce(mockSelectChain([mockMatchBatch]));
    // get matches with jobs
    mDb.select.mockReturnValueOnce(mockSelectChain([{ ...mockJobMatch, jobTitle: "Engineer" }]));

    const res = await request(app)
      .get("/api/matching/batches/batch-uuid-6666")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when not found", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/matching/batches/nonexistent")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("GET /api/matching/results", () => {
  it("returns 200 with paginated results", async () => {
    // count + items
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 1 }]))
      .mockReturnValueOnce(mockSelectChain([mockJobMatch]));

    const res = await request(app)
      .get("/api/matching/results")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("supports query params for filtering", async () => {
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/matching/results?minPercentage=70&shortlistedOnly=true")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("PATCH /api/matching/:id/shortlist", () => {
  it("returns 200 on toggle shortlist", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockJobMatch]));
    mDb.update.mockReturnValueOnce(mockUpdateChain([{ ...mockJobMatch, isShortlisted: true }]));

    const res = await request(app)
      .patch("/api/matching/match-uuid-7777/shortlist")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("PATCH /api/matching/:id/viewed", () => {
  it("returns 200 on mark viewed", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockJobMatch]));
    mDb.update.mockReturnValueOnce(mockUpdateChain([{ ...mockJobMatch, isViewed: true }]));

    const res = await request(app)
      .patch("/api/matching/match-uuid-7777/viewed")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});
