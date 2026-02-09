import type { Request, Response, NextFunction } from "express";
import { AppError } from "./errors.js";
import { logger } from "./logger.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(
      { statusCode: err.statusCode, path: req.path, method: req.method },
      err.message
    );

    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
