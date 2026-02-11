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
import { mockNotificationPrefs, mockNotification } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

describe("POST /api/notifications/preferences", () => {
  it("returns 201 on valid creation", async () => {
    // check existing — none
    mDb.select.mockReturnValueOnce(mockSelectChain([]));
    // insert
    mDb.insert.mockReturnValueOnce(mockInsertChain([mockNotificationPrefs]));

    const res = await request(app)
      .post("/api/notifications/preferences")
      .set(authHeader(userToken))
      .send({ matchEmailFrequency: "daily" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/notifications/preferences")
      .send({});

    expect(res.status).toBe(401);
  });
});

describe("GET /api/notifications/preferences", () => {
  it("returns 200 with preferences", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockNotificationPrefs]));

    const res = await request(app)
      .get("/api/notifications/preferences")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when not found", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/notifications/preferences")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("PATCH /api/notifications/preferences", () => {
  it("returns 200 on update", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockNotificationPrefs]));
    mDb.update.mockReturnValueOnce(
      mockUpdateChain([{ ...mockNotificationPrefs, marketingEmails: true }]),
    );

    const res = await request(app)
      .patch("/api/notifications/preferences")
      .set(authHeader(userToken))
      .send({ marketingEmails: true });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 400 on empty body", async () => {
    const res = await request(app)
      .patch("/api/notifications/preferences")
      .set(authHeader(userToken))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });
});

describe("DELETE /api/notifications/preferences", () => {
  it("returns 200 on delete", async () => {
    // 1. existence check
    mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "notif-pref-uuid" }]));
    // 2. delete
    mDb.delete.mockReturnValueOnce(mockDeleteChain([]));

    const res = await request(app)
      .delete("/api/notifications/preferences")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/notifications", () => {
  it("returns 200 with paginated list", async () => {
    // count + items
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 1 }]))
      .mockReturnValueOnce(mockSelectChain([mockNotification]));

    const res = await request(app)
      .get("/api/notifications")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/notifications/:id", () => {
  it("returns 200 with notification", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockNotification]));

    const res = await request(app)
      .get("/api/notifications/notif-uuid-aaaa")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when not found", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/notifications/nonexistent")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});
