import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../../src/app.js";
import { db } from "../../src/db/index.js";
import { mockSelectChain, type MockDb } from "../utils/mocks/db.mock.js";
import { userToken, adminToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;
const JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";

describe("Auth middleware", () => {
  it("rejects missing Authorization header with 401", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      status: "error",
      message: "Missing or malformed authorization header",
    });
  });

  it("rejects malformed Bearer token with 401", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "NotBearer xyz");

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("rejects expired JWT with 401", async () => {
    const expiredToken = jwt.sign(
      { userId: "u1", email: "a@b.com", role: "user" },
      JWT_SECRET,
      { expiresIn: "0s" },
    );
    await new Promise((r) => setTimeout(r, 50));

    const res = await request(app)
      .get("/api/users/me")
      .set(authHeader(expiredToken));

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("valid JWT sets req.user correctly (verified via /api/users/me)", async () => {
    const profile = {
      id: "user-uuid-1234",
      email: "test@example.com",
      role: "user",
      emailVerified: "pending",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mDb.select.mockReturnValueOnce(mockSelectChain([profile]));

    const res = await request(app)
      .get("/api/users/me")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("user-uuid-1234");
  });
});

describe("Zod validation middleware", () => {
  it("body validation errors return 400 with semicolon-joined messages", async () => {
    const res = await request(app).post("/api/users/signup").send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
    expect(res.body.message).toContain(";");
  });

  it("query param coercion works (page as string → number)", async () => {
    // Admin listUsers: 1st select = count, 2nd select = users list
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/admin/users?page=2&limit=10")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
  });
});

describe("requireAdmin middleware", () => {
  it("regular user gets 403 on admin routes", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set(authHeader(userToken));

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
  });

  it("admin user passes through", async () => {
    // getDashboardStats makes 7 db.select() calls
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 100 }]))
      .mockReturnValueOnce(mockSelectChain([{ count: 80 }]))
      .mockReturnValueOnce(mockSelectChain([{ status: "active", count: 50 }]))
      .mockReturnValueOnce(mockSelectChain([{ count: 1000 }]))
      .mockReturnValueOnce(mockSelectChain([{ count: 3 }]))
      .mockReturnValueOnce(mockSelectChain([]))
      .mockReturnValueOnce(mockSelectChain([{ count: 200 }]));

    const res = await request(app)
      .get("/api/admin/stats")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("requireSubscription middleware", () => {
  it("user with no subscription gets 403 on starter-gated route", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/csv/exports")
      .set(authHeader(userToken));

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
  });

  it("user with starter plan passes starter-gated route", async () => {
    // getUserPlan: find active subscription + plan
    mDb.select
      .mockReturnValueOnce(
        mockSelectChain([
          { planId: "plan-uuid-4444", status: "active", currentPeriodEnd: new Date() },
        ]),
      )
      .mockReturnValueOnce(
        mockSelectChain([{ id: "plan-uuid-4444", name: "starter" }]),
      )
      // listExports: Promise.all([items, count])
      .mockReturnValueOnce(mockSelectChain([]))
      .mockReturnValueOnce(mockSelectChain([{ count: 0 }]));

    const res = await request(app)
      .get("/api/csv/exports")
      .set(authHeader(userToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("Error handler", () => {
  it("unknown error in handler returns 500 Internal server error", async () => {
    mDb.select.mockImplementationOnce(() => {
      throw new Error("Unexpected database failure");
    });

    const res = await request(app)
      .get("/api/users/me")
      .set(authHeader(userToken));

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      status: "error",
      message: "Internal server error",
    });
  });
});
