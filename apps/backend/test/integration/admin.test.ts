import request from "supertest";
import { app } from "../../src/app.js";
import { db } from "../../src/db/index.js";
import { mockSelectChain, type MockDb } from "../utils/mocks/db.mock.js";
import { mockUser, mockAdminUser } from "../utils/mocks/fixtures.js";
import { userToken, adminToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

describe("GET /api/admin/stats", () => {
  it("returns 200 with admin token", async () => {
    // getDashboardStats: 7 select calls
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 100 }]))
      .mockReturnValueOnce(mockSelectChain([{ count: 80 }]))
      .mockReturnValueOnce(mockSelectChain([{ status: "active", count: 50 }]))
      .mockReturnValueOnce(mockSelectChain([{ count: 5000 }]))
      .mockReturnValueOnce(mockSelectChain([{ count: 3 }]))
      .mockReturnValueOnce(mockSelectChain([{ status: "completed" }]))
      .mockReturnValueOnce(mockSelectChain([{ count: 250 }]));

    const res = await request(app)
      .get("/api/admin/stats")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.jobs).toBeDefined();
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/admin/stats");

    expect(res.status).toBe(401);
  });

  it("returns 403 for non-admin user", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set(authHeader(userToken));

    expect(res.status).toBe(403);
    expect(res.body.status).toBe("error");
  });
});

describe("GET /api/admin/users", () => {
  it("returns 200 with paginated user list", async () => {
    // count + list
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 2 }]))
      .mockReturnValueOnce(mockSelectChain([mockUser, mockAdminUser]));

    const res = await request(app)
      .get("/api/admin/users")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.pagination).toBeDefined();
  });

  it("supports search query parameter", async () => {
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 1 }]))
      .mockReturnValueOnce(mockSelectChain([mockUser]));

    const res = await request(app)
      .get("/api/admin/users?search=test")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/admin/users/:id", () => {
  it("returns 200 with user details", async () => {
    mDb.query.users.findFirst.mockResolvedValueOnce({
      ...mockUser,
      jobPreferences: null,
      notificationPreferences: null,
      cvSnapshots: [],
      userSubscriptions: [],
    });

    const res = await request(app)
      .get("/api/admin/users/user-uuid-1234")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/admin/job-fetch-logs", () => {
  it("returns 200 with logs", async () => {
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/admin/job-fetch-logs")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.pagination).toBeDefined();
  });
});

describe("GET /api/admin/matching-logs", () => {
  it("returns 200 with logs", async () => {
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/admin/matching-logs")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/admin/email-delivery-logs", () => {
  it("returns 200 with logs", async () => {
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/admin/email-delivery-logs")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("GET /api/admin/tasks", () => {
  it("returns 200 with task queue", async () => {
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/admin/tasks")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("supports filter parameters", async () => {
    mDb.select
      .mockReturnValueOnce(mockSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .get("/api/admin/tasks?type=job_fetch&status=failed")
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});
