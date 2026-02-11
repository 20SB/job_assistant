import request from "supertest";
import { app } from "../../src/app.js";
import { db } from "../../src/db/index.js";
import { mockSelectChain, type MockDb } from "../utils/mocks/db.mock.js";
import { mockTask } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

describe("GET /api/tasks", () => {
  it("returns 200 with paginated task list", async () => {
    // count + items
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 1 }]))
      .mockReturnValueOnce(mockSelectChain([mockTask]));

    const res = await request(app)
      .get("/api/tasks")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/tasks");

    expect(res.status).toBe(401);
  });
});

describe("GET /api/tasks/:id", () => {
  it("returns 200 with task details", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockTask]));

    const res = await request(app)
      .get("/api/tasks/task-uuid-bbbb")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when not found", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/tasks/nonexistent")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});
