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
import { mockCvSnapshot } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

describe("POST /api/cv", () => {
  it("returns 201 on valid CV creation", async () => {
    // deactivate existing CVs
    mDb.update.mockReturnValueOnce(mockUpdateChain([]));
    // get next version number
    mDb.select.mockReturnValueOnce(mockSelectChain([{ version: 1 }]));
    // insert new CV
    mDb.insert.mockReturnValueOnce(mockInsertChain([mockCvSnapshot]));

    const res = await request(app)
      .post("/api/cv")
      .set(authHeader(userToken))
      .send({ rawCvText: "Experienced software engineer with 5 years." });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
  });

  it("returns 400 on missing rawCvText", async () => {
    const res = await request(app)
      .post("/api/cv")
      .set(authHeader(userToken))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/cv")
      .send({ rawCvText: "Some CV text" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/cv/active", () => {
  it("returns 200 with active CV", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockCvSnapshot]));

    const res = await request(app)
      .get("/api/cv/active")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when no active CV", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/cv/active")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("GET /api/cv/versions", () => {
  it("returns 200 with version list", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "cv1", version: 1, isActive: true, createdAt: new Date() }]));

    const res = await request(app)
      .get("/api/cv/versions")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/cv/:id", () => {
  it("returns 200 with specific CV", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockCvSnapshot]));

    const res = await request(app)
      .get("/api/cv/cv-uuid-1111")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when not found", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/cv/nonexistent")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("PATCH /api/cv", () => {
  it("returns 200 on update (creates new version)", async () => {
    // get active CV
    mDb.select.mockReturnValueOnce(mockSelectChain([mockCvSnapshot]));
    // deactivate existing
    mDb.update.mockReturnValueOnce(mockUpdateChain([]));
    // get next version
    mDb.select.mockReturnValueOnce(mockSelectChain([{ version: 2 }]));
    // insert new version
    mDb.insert.mockReturnValueOnce(mockInsertChain([{ ...mockCvSnapshot, version: 2 }]));

    const res = await request(app)
      .patch("/api/cv")
      .set(authHeader(userToken))
      .send({ rawCvText: "Updated CV text" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("DELETE /api/cv/:id", () => {
  it("returns 200 on delete", async () => {
    // 1. existence check: select({ id, isActive })
    mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "cv-uuid-1111", isActive: true }]));
    // 2. delete
    mDb.delete.mockReturnValueOnce(mockDeleteChain([]));
    // 3. find latest remaining (active was deleted → promote)
    mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "cv2" }]));
    // 4. promote latest
    mDb.update.mockReturnValueOnce(mockUpdateChain([]));

    const res = await request(app)
      .delete("/api/cv/cv-uuid-1111")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when not found", async () => {
    // existence check returns empty → throws NotFound
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .delete("/api/cv/nonexistent")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});
