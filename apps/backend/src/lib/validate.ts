import type { Request, Response, NextFunction } from "express";
import { type ZodIssue, ZodError, type ZodSchema } from "zod";
import { AppError } from "./errors.js";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const messages = zodError.issues
        .map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new AppError(messages, 400);
    }

    req.body = result.data;
    next();
  };
}
