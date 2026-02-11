import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../../../src/lib/errors.js";
import { mockUser } from "../../utils/mocks/fixtures.js";
import {
  mockSelectChain,
  mockInsertChain,
  mockUpdateChain,
  type MockDb,
} from "../../utils/mocks/db.mock.js";

vi.mock("../../../src/db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("bcrypt");
vi.mock("jsonwebtoken");
vi.mock("../../../src/lib/email.js", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

import { db } from "../../../src/db/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const mDb = db as unknown as MockDb;

import {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
} from "../../../src/modules/users/user.service.js";

describe("user.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── signup ──────────────────────────────────────────────────────────────

  describe("signup", () => {
    it("creates a new user and returns user data", async () => {
      mDb.select.mockReturnValue(mockSelectChain([])); // no existing user
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed-pw" as any);
      const newUser = { id: "user-1", email: "test@example.com", role: "user" };
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([newUser])) // users insert
        .mockReturnValueOnce(mockInsertChain([{}])); // verification token insert

      const result = await signup("test@example.com", "password123");

      expect(result.user).toEqual(newUser);
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it("throws 409 when email already registered", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "existing-user" }]));

      await expect(signup("existing@example.com", "pass")).rejects.toThrow(AppError);
      try { await signup("existing@example.com", "pass"); } catch (e) {
        expect((e as AppError).statusCode).toBe(409);
      }
    });

    it("hashes password with env bcrypt rounds", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as any);
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([{ id: "u1", email: "a@b.com", role: "user" }]))
        .mockReturnValueOnce(mockInsertChain([{}]));

      await signup("a@b.com", "mypass");

      expect(bcrypt.hash).toHaveBeenCalledWith("mypass", 4); // env BCRYPT_SALT_ROUNDS=4
    });

    it("sends verification email", async () => {
      const { sendVerificationEmail } = await import("../../../src/lib/email.js");
      mDb.select.mockReturnValue(mockSelectChain([]));
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as any);
      mDb.insert
        .mockReturnValueOnce(mockInsertChain([{ id: "u1", email: "a@b.com", role: "user" }]))
        .mockReturnValueOnce(mockInsertChain([{}]));

      await signup("a@b.com", "pass");

      expect(sendVerificationEmail).toHaveBeenCalledWith("a@b.com", expect.any(String));
    });
  });

  // ── login ───────────────────────────────────────────────────────────────

  describe("login", () => {
    it("returns token and user on valid credentials", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockUser]));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
      vi.mocked(jwt.sign).mockReturnValue("jwt-token" as any);
      mDb.update.mockReturnValue(mockUpdateChain([])); // lastLoginAt

      const result = await login("test@example.com", "password123");

      expect(result.token).toBe("jwt-token");
      expect(result.user.email).toBe("test@example.com");
    });

    it("throws 401 when user not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));

      await expect(login("unknown@example.com", "pass")).rejects.toThrow(AppError);
      try { await login("unknown@example.com", "pass"); } catch (e) {
        expect((e as AppError).statusCode).toBe(401);
        expect((e as AppError).message).toContain("Invalid credentials");
      }
    });

    it("throws 401 when password is wrong", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockUser]));
      vi.mocked(bcrypt.compare).mockResolvedValue(false as any);

      await expect(login("test@example.com", "wrongpass")).rejects.toThrow(AppError);
    });

    it("throws 401 when account is deactivated", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ ...mockUser, isActive: false }]));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      await expect(login("test@example.com", "pass")).rejects.toThrow(AppError);
      try { await login("test@example.com", "pass"); } catch (e) {
        expect((e as AppError).message).toContain("deactivated");
      }
    });

    it("updates lastLoginAt on successful login", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockUser]));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
      vi.mocked(jwt.sign).mockReturnValue("token" as any);
      mDb.update.mockReturnValue(mockUpdateChain([]));

      await login("test@example.com", "pass");

      expect(mDb.update).toHaveBeenCalled();
    });

    it("signs JWT with correct payload", async () => {
      mDb.select.mockReturnValue(mockSelectChain([mockUser]));
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
      vi.mocked(jwt.sign).mockReturnValue("token" as any);
      mDb.update.mockReturnValue(mockUpdateChain([]));

      await login("test@example.com", "pass");

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
        expect.any(String),
        expect.objectContaining({ expiresIn: "7d" }),
      );
    });
  });

  // ── verifyEmail ─────────────────────────────────────────────────────────

  describe("verifyEmail", () => {
    it("verifies email with valid token", async () => {
      const tokenRecord = { id: "tok-1", userId: "user-1", token: "valid" };
      mDb.select.mockReturnValue(mockSelectChain([tokenRecord]));
      mDb.update.mockReturnValue(mockUpdateChain([]));

      const result = await verifyEmail("valid");
      expect(result.message).toContain("verified");
    });

    it("throws 400 for invalid/expired token", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));

      await expect(verifyEmail("invalid-token")).rejects.toThrow(AppError);
      try { await verifyEmail("invalid-token"); } catch (e) {
        expect((e as AppError).statusCode).toBe(400);
      }
    });

    it("marks token as used and updates user verification status", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "tok-1", userId: "u-1" }]));
      mDb.update.mockReturnValue(mockUpdateChain([]));

      await verifyEmail("valid-token");

      // Two updates: token usedAt + user emailVerified
      expect(mDb.update).toHaveBeenCalledTimes(2);
    });
  });

  // ── forgotPassword ──────────────────────────────────────────────────────

  describe("forgotPassword", () => {
    it("generates reset token when user exists", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "user-1" }]));
      mDb.insert.mockReturnValue(mockInsertChain([{}]));

      const result = await forgotPassword("test@example.com");
      expect(result.message).toBeDefined();
      expect(result.resetToken).toBeDefined();
    });

    it("returns generic message when user not found (no leaking)", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));

      const result = await forgotPassword("unknown@example.com");
      expect(result.message).toContain("If an account exists");
    });

    it("does not throw when user not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));
      await expect(forgotPassword("x@y.com")).resolves.toBeDefined();
    });
  });

  // ── resetPassword ───────────────────────────────────────────────────────

  describe("resetPassword", () => {
    it("resets password with valid token", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "tok-1", userId: "u-1" }]));
      vi.mocked(bcrypt.hash).mockResolvedValue("new-hash" as any);
      mDb.update.mockReturnValue(mockUpdateChain([]));

      const result = await resetPassword("valid-token", "newPassword123");
      expect(result.message).toContain("reset successfully");
    });

    it("throws 400 for invalid/expired token", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));

      await expect(resetPassword("bad-token", "pass")).rejects.toThrow(AppError);
      try { await resetPassword("bad-token", "pass"); } catch (e) {
        expect((e as AppError).statusCode).toBe(400);
      }
    });

    it("hashes the new password", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "tok-1", userId: "u-1" }]));
      vi.mocked(bcrypt.hash).mockResolvedValue("new-hash" as any);
      mDb.update.mockReturnValue(mockUpdateChain([]));

      await resetPassword("valid", "newPass");

      expect(bcrypt.hash).toHaveBeenCalledWith("newPass", 4);
    });

    it("marks reset token as used", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "tok-1", userId: "u-1" }]));
      vi.mocked(bcrypt.hash).mockResolvedValue("hash" as any);
      mDb.update.mockReturnValue(mockUpdateChain([]));

      await resetPassword("valid", "pass");

      // Two updates: user password + token usedAt
      expect(mDb.update).toHaveBeenCalledTimes(2);
    });
  });

  // ── getProfile ──────────────────────────────────────────────────────────

  describe("getProfile", () => {
    it("returns user profile", async () => {
      const profile = { id: "u-1", email: "a@b.com", role: "user", emailVerified: "verified" };
      mDb.select.mockReturnValue(mockSelectChain([profile]));

      const result = await getProfile("u-1");
      expect(result).toEqual(profile);
    });

    it("throws 404 when user not found", async () => {
      mDb.select.mockReturnValue(mockSelectChain([]));

      await expect(getProfile("nonexistent")).rejects.toThrow(AppError);
      try { await getProfile("nonexistent"); } catch (e) {
        expect((e as AppError).statusCode).toBe(404);
      }
    });
  });

  // ── updateProfile ───────────────────────────────────────────────────────

  describe("updateProfile", () => {
    it("updates email when provided", async () => {
      // Check email uniqueness
      mDb.select.mockReturnValueOnce(mockSelectChain([])); // no conflict
      mDb.update.mockReturnValue(mockUpdateChain([]));
      // getProfile call at end
      const profile = { id: "u-1", email: "new@example.com", role: "user" };
      mDb.select.mockReturnValueOnce(mockSelectChain([profile]));

      const result = await updateProfile("u-1", { email: "new@example.com" });
      expect(result).toEqual(profile);
    });

    it("throws 409 when email already in use by another user", async () => {
      mDb.select.mockReturnValue(mockSelectChain([{ id: "other-user" }]));

      await expect(
        updateProfile("u-1", { email: "taken@example.com" }),
      ).rejects.toThrow(AppError);
    });

    it("allows updating email to same user's email (no conflict)", async () => {
      mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "u-1" }])); // same user
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.select.mockReturnValueOnce(mockSelectChain([{ id: "u-1", email: "same@example.com" }]));

      const result = await updateProfile("u-1", { email: "same@example.com" });
      expect(result.id).toBe("u-1");
    });

    it("hashes password when provided", async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue("hashed-new" as any);
      mDb.update.mockReturnValue(mockUpdateChain([]));
      mDb.select.mockReturnValue(mockSelectChain([{ id: "u-1", email: "a@b.com" }]));

      await updateProfile("u-1", { password: "newPassword" });

      expect(bcrypt.hash).toHaveBeenCalledWith("newPassword", 4);
    });
  });
});
