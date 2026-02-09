import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  users,
  emailVerificationTokens,
  passwordResetTokens,
} from "../../db/schema.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import {
  Conflict,
  Unauthorized,
  NotFound,
  BadRequest,
} from "../../lib/errors.js";
import type { AuthPayload } from "../../middleware/auth.js";

export async function signup(email: string, password: string) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    throw Conflict("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const [newUser] = await db
    .insert(users)
    .values({ email, password: hashedPassword })
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
    });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(emailVerificationTokens).values({
    userId: newUser.id,
    token,
    expiresAt,
  });

  logger.info({ userId: newUser.id }, "User registered");

  // Phase 1: token returned in response (no email service yet)
  return { user: newUser, verificationToken: token };
}

export async function login(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw Unauthorized("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw Unauthorized("Invalid credentials");
  }

  if (!user.isActive) {
    throw Unauthorized("Account deactivated");
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  logger.info({ userId: user.id }, "User logged in");

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  };
}

export async function verifyEmail(token: string) {
  const [tokenRecord] = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!tokenRecord) {
    throw BadRequest("Invalid or expired verification token");
  }

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date(), updatedAt: new Date() })
    .where(eq(emailVerificationTokens.id, tokenRecord.id));

  await db
    .update(users)
    .set({ emailVerified: "verified", updatedAt: new Date() })
    .where(eq(users.id, tokenRecord.userId));

  logger.info({ userId: tokenRecord.userId }, "Email verified");

  return { message: "Email verified successfully" };
}

export async function forgotPassword(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    // Don't reveal whether the email exists
    return { message: "If an account exists, a reset token has been generated" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  logger.info({ userId: user.id }, "Password reset token generated");

  // Phase 1: token returned in response (no email service yet)
  return {
    message: "If an account exists, a reset token has been generated",
    resetToken: token,
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const [tokenRecord] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!tokenRecord) {
    throw BadRequest("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, tokenRecord.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date(), updatedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenRecord.id));

  logger.info({ userId: tokenRecord.userId }, "Password reset completed");

  return { message: "Password reset successfully" };
}

export async function getProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw NotFound("User not found");
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: { email?: string; password?: string }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing && existing.id !== userId) {
      throw Conflict("Email already in use");
    }

    updateData.email = data.email;
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(
      data.password,
      env.BCRYPT_SALT_ROUNDS
    );
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  return getProfile(userId);
}
