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
import { mockUser } from "../utils/mocks/fixtures.js";
import { userToken, authHeader } from "./setup.js";

const mDb = db as unknown as MockDb;

// bcrypt is used by the real user.service — mock it
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$04$hashedpassword"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe("POST /api/users/signup", () => {
  it("returns 201 with user data on valid signup", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));
    mDb.insert
      .mockReturnValueOnce(
        mockInsertChain([{ id: "u1", email: "new@test.com", role: "user" }]),
      )
      .mockReturnValueOnce(mockInsertChain([]));

    const res = await request(app)
      .post("/api/users/signup")
      .send({ email: "new@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data.user).toEqual(
      expect.objectContaining({ email: "new@test.com" }),
    );
  });

  it("returns 400 on invalid email", async () => {
    const res = await request(app)
      .post("/api/users/signup")
      .send({ email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });

  it("returns 400 on short password", async () => {
    const res = await request(app)
      .post("/api/users/signup")
      .send({ email: "a@b.com", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });

  it("returns 400 on missing fields", async () => {
    const res = await request(app).post("/api/users/signup").send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });

  it("returns 409 on duplicate email", async () => {
    mDb.select.mockReturnValueOnce(
      mockSelectChain([{ id: "existing-user" }]),
    );

    const res = await request(app)
      .post("/api/users/signup")
      .send({ email: "dup@test.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.status).toBe("error");
  });
});

describe("POST /api/users/login", () => {
  it("returns 200 with token on valid login", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([mockUser]));
    mDb.update.mockReturnValueOnce(mockUpdateChain([]));

    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("test@example.com");
  });

  it("returns 401 on invalid credentials", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "no@test.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });

  it("returns 400 on missing fields", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "a@b.com" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });
});

describe("POST /api/users/verify-email", () => {
  it("returns 200 on valid token", async () => {
    mDb.select.mockReturnValueOnce(
      mockSelectChain([
        {
          id: "tok1",
          userId: "u1",
          token: "abc",
          expiresAt: new Date(Date.now() + 86400000),
          usedAt: null,
        },
      ]),
    );
    mDb.update
      .mockReturnValueOnce(mockUpdateChain([]))
      .mockReturnValueOnce(mockUpdateChain([]));

    const res = await request(app)
      .post("/api/users/verify-email")
      .send({ token: "abc" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 400 on invalid/expired token", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .post("/api/users/verify-email")
      .send({ token: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });
});

describe("POST /api/users/forgot-password", () => {
  it("returns 200 even if email does not exist", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .post("/api/users/forgot-password")
      .send({ email: "nonexistent@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });
});

describe("POST /api/users/reset-password", () => {
  it("returns 200 on valid reset", async () => {
    mDb.select.mockReturnValueOnce(
      mockSelectChain([
        {
          id: "rst1",
          userId: "u1",
          token: "rst-token",
          expiresAt: new Date(Date.now() + 3600000),
          usedAt: null,
        },
      ]),
    );
    mDb.update
      .mockReturnValueOnce(mockUpdateChain([]))
      .mockReturnValueOnce(mockUpdateChain([]));

    const res = await request(app)
      .post("/api/users/reset-password")
      .send({ token: "rst-token", password: "newpassword123" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 400 on expired token", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));

    const res = await request(app)
      .post("/api/users/reset-password")
      .send({ token: "expired", password: "newpassword123" });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });
});

describe("GET /api/users/me", () => {
  it("returns 200 with user profile when authenticated", async () => {
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
    expect(res.body.status).toBe("success");
    expect(res.body.data.email).toBe("test@example.com");
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.status).toBe(401);
    expect(res.body.status).toBe("error");
  });
});

describe("PATCH /api/users/me", () => {
  it("returns 200 on email update", async () => {
    mDb.select.mockReturnValueOnce(mockSelectChain([]));
    mDb.update.mockReturnValueOnce(mockUpdateChain([]));
    const profile = {
      id: "user-uuid-1234",
      email: "updated@test.com",
      role: "user",
      emailVerified: "pending",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mDb.select.mockReturnValueOnce(mockSelectChain([profile]));

    const res = await request(app)
      .patch("/api/users/me")
      .set(authHeader(userToken))
      .send({ email: "updated@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("returns 400 on empty body", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set(authHeader(userToken))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("error");
  });
});
