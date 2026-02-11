import request from "supertest";
import { app } from "../../src/app.js";
import { db } from "../../src/db/index.js";
import {
  mockSelectChain,
  mockInsertChain,
  mockUpdateChain,
  mockDeleteChain,
  type MockDb,
} from "../utils/mocks/db.mock.js";
import { mockPreferences } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

const validPreferences = {
  preferredRoles: ["software engineer"],
  locations: ["Bangalore"],
};

describe("POST /api/preferences", () => {
  it("returns 201 on valid creation", async () => {
    // check existing — none
    mDb.select.mockReturnValueOnce(mockSelectChain([]));
    // insert
    mDb.insert.mockReturnValueOnce(mockInsertChain([mockPreferences]));

    const res = await request(app)
      .post("/api/preferences")
      .set(authHeader(userToken))
      .send(validPreferences);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
  });

  it("returns 400 on missing required fields", async () => {
    const res = await request(app)
      .post("/api/preferences")
      .set(authHeader(userToken))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/preferences")
      .send(validPreferences);

    expect(res.status).toBe(401);
  });

  it("returns 409 if preferences already exist", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockPreferences]));

    const res = await request(app)
      .post("/api/preferences")
      .set(authHeader(userToken))
      .send(validPreferences);

    expect(res.status).toBe(409);
    expect(res.body.status).toBe("error");
  });
});

describe("GET /api/preferences", () => {
  it("returns 200 with preferences", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockPreferences]));

    const res = await request(app)
      .get("/api/preferences")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when not found", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/preferences")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("PATCH /api/preferences", () => {
  it("returns 200 on sparse update", async () => {
    // get existing
    mDb.select.mockReturnValueOnce(mockSelectChain([mockPreferences]));
    // update
    mDb.update.mockReturnValueOnce(mockUpdateChain([{ ...mockPreferences, remotePreference: true }]));

    const res = await request(app)
      .patch("/api/preferences")
      .set(authHeader(userToken))
      .send({ remotePreference: true });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 400 on empty body", async () => {
    const res = await request(app)
      .patch("/api/preferences")
      .set(authHeader(userToken))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });
});

describe("DELETE /api/preferences", () => {
  it("returns 200 on delete", async () => {
    // 1. existence check
    mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "pref-uuid-2222" }]));
    // 2. delete
    mDb.delete.mockReturnValueOnce(mockDeleteChain([]));

    const res = await request(app)
      .delete("/api/preferences")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});
