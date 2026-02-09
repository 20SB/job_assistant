import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      //   host: env.SMTP_HOST,
      //   port: env.SMTP_PORT || 587,
      //   secure: env.SMTP_PORT === 465,
      service: "gmail",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!transporter) {
    // Dev mode: log email instead of sending
    logger.info(
      { to: options.to, subject: options.subject },
      "Email (not sent - no SMTP configured)",
    );
    logger.debug({ html: options.html }, "Email content");
    return;
  }

  await transporter.sendMail({
    from: `Job Assistant Dev <${env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  logger.info({ to: options.to, subject: options.subject }, "Email sent");
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const verifyUrl = `${env.FRONTEND_URL}/verify?token=${token}`;

  await sendEmail({
    to,
    subject: "Verify your email - Job Assistant",
    html: `
      <h1>Welcome to Job Assistant!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px;">Verify Email</a>
      <p>Or copy this link: ${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to,
    subject: "Reset your password - Job Assistant",
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px;">Reset Password</a>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
