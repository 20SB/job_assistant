import type { Request, Response, NextFunction } from "express";
import { type ZodIssue, ZodError, type ZodSchema } from "zod";
import { AppError } from "./errors.js";

type ValidateTarget = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: ValidateTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const data = target === "body" ? req.body : target === "query" ? req.query : req.params;
    const result = schema.safeParse(data);

    if (!result.success) {
      const zodError = result.error as ZodError;
      const messages = zodError.issues
        .map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new AppError(messages, 400);
    }

    if (target === "body") {
      req.body = result.data;
    } else if (target === "query") {
      req.query = result.data as any;
    } else {
      req.params = result.data as any;
    }
    next();
  };
}
