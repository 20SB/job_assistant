import request from "supertest";
import { app } from "../../src/app.js";
import { db } from "../../src/db/index.js";
import {
  mockSelectChain,
  mockInsertChain,
  type MockDb,
} from "../utils/mocks/db.mock.js";
import { mockJob, mockTask } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

describe("GET /api/jobs", () => {
  it("returns 200 with paginated job list", async () => {
    // listJobs: count + items
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 1 }]))
      .mockReturnValueOnce(mockSelectChain([mockJob]));

    const res = await request(app)
      .get("/api/jobs")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/jobs");

    expect(res.status).toBe(401);
  });
});

describe("GET /api/jobs/:id", () => {
  it("returns 200 with job details", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockJob]));

    const res = await request(app)
      .get("/api/jobs/job-uuid-3333")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when not found", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/jobs/nonexistent")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("GET /api/jobs/fetch-logs", () => {
  it("returns 200 with fetch logs", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/jobs/fetch-logs")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("POST /api/jobs/fetch", () => {
  it("returns 202 on valid fetch trigger", async () => {
    // enqueue task
    mDb.insert.mockReturnValueOnce(mockInsertChain([mockTask]));

    const res = await request(app)
      .post("/api/jobs/fetch")
      .set(authHeader(userToken))
      .send({ roles: ["software engineer"] });

    expect(res.status).toBe(202);
    expect(res.body.status).toBe("success");
    expect(res.body.data.taskId).toBeDefined();
  });

  it("returns 400 on missing roles", async () => {
    const res = await request(app)
      .post("/api/jobs/fetch")
      .set(authHeader(userToken))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });
});
