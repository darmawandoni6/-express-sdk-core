import { RequestHandler } from "express";

import { ZodError, type ZodSchema, z } from "zod";

export type { ZodError, ZodSchema, ZodType, infer as zInfer } from "zod";
export { z };

export interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.defineProperty(req, "params", {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.failure(
          {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: err.flatten().fieldErrors,
          },
          422
        );
      }
      next(err);
    }
  };
};
