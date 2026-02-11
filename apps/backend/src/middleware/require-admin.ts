import type { Request, Response, NextFunction } from "express";
import { Forbidden, Unauthorized } from "../lib/errors.js";

/**
 * Middleware to check if authenticated user has admin role.
 * Must be used AFTER authenticate middleware.
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw Unauthorized("Authentication required");
  }

  if (req.user.role !== "admin") {
    throw Forbidden("Admin access required");
  }

  next();
}
