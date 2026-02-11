import request from "supertest";
import { vi } from "vitest";
import { app } from "../../src/app.js";
import { db } from "../../src/db/index.js";
import {
  mockSelectChain,
  mockInsertChain,
  mockUpdateChain,
  type MockDb,
} from "../utils/mocks/db.mock.js";
import { mockPlan, mockSubscription } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

// The subscribe flow calls notify() which we need to handle
vi.mock("../../src/modules/notifications/notifications.service.js", () => ({
  notify: vi.fn().mockResolvedValue(undefined),
}));

const mDb = db as unknown as MockDb;

describe("GET /api/subscriptions/plans", () => {
  it("returns 200 with plans list (no auth needed)", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockPlan]));

    const res = await request(app).get("/api/subscriptions/plans");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe("GET /api/subscriptions/plans/:id", () => {
  it("returns 200 with plan details", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockPlan]));

    const res = await request(app).get("/api/subscriptions/plans/plan-uuid-4444");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 for nonexistent plan", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app).get("/api/subscriptions/plans/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("POST /api/subscriptions/subscribe", () => {
  it("returns 201 on successful subscription", async () => {
    // get plan
    mDb.select.mockReturnValueOnce(mockSelectChain([mockPlan]));
    // check existing subscription — none
    mDb.select.mockReturnValueOnce(mockSelectChain([]));
    // insert subscription
    mDb.insert.mockReturnValueOnce(mockInsertChain([mockSubscription]));
    // insert payment (for paid plan)
    mDb.insert.mockReturnValueOnce(mockInsertChain([{ id: "pay1" }]));

    const res = await request(app)
      .post("/api/subscriptions/subscribe")
      .set(authHeader(userToken))
      .send({ planId: "550e8400-e29b-41d4-a716-446655440000" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/api/subscriptions/subscribe")
      .send({ planId: "550e8400-e29b-41d4-a716-446655440000" });

    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid planId", async () => {
    const res = await request(app)
      .post("/api/subscriptions/subscribe")
      .set(authHeader(userToken))
      .send({ planId: "not-a-uuid" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });
});

describe("GET /api/subscriptions/me", () => {
  it("returns 200 with active subscription", async () => {
    // find subscription
    mDb.select.mockReturnValueOnce(mockSelectChain([mockSubscription]));
    // find plan
    mDb.select.mockReturnValueOnce(mockSelectChain([mockPlan]));

    const res = await request(app)
      .get("/api/subscriptions/me")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 404 when no subscription", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/subscriptions/me")
      .set(authHeader(userToken));

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("error");
  });
});

describe("POST /api/subscriptions/cancel", () => {
  it("returns 200 on cancel", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockSubscription]));
    mDb.update.mockReturnValueOnce(mockUpdateChain([{ ...mockSubscription, status: "cancelled" }]));

    const res = await request(app)
      .post("/api/subscriptions/cancel")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/subscriptions/payments", () => {
  it("returns 200 with payments list", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "pay1", amount: "499", status: "pending" }]));

    const res = await request(app)
      .get("/api/subscriptions/payments")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});
