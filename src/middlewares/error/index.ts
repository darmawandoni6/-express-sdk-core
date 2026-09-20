import type { ErrorRequestHandler, RequestHandler } from "express";

import createHttpError, { type HttpError, isHttpError } from "http-errors";

import { isPrismaError, mapPrismaError } from "../../prisma/errors";
import { logger } from "../logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(createHttpError.NotFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) return next(err);

  // 1. Prisma ORM errors auto-mapping
  if (isPrismaError(err)) {
    const mapped = mapPrismaError(err);
    if (mapped) {
      const { status, code, message, details } = mapped;
      res.status(status);

      if (status >= 500) {
        logger.error(message, { err, path: req.path });
      }

      return res.failure(details !== undefined ? { message, code, details } : { message, code }, status);
    }
  }

  // 2. Standard HTTP / Generic errors
  const errorObj = typeof err === "object" && err !== null ? (err as Record<string, unknown>) : {};
  const status =
    typeof errorObj.status === "number"
      ? errorObj.status
      : typeof errorObj.statusCode === "number"
        ? (errorObj.statusCode as number)
        : 500;
  const code = typeof errorObj.code === "string" ? errorObj.code : "INTERNAL_ERROR";
  const message = typeof errorObj.message === "string" ? errorObj.message : "Internal server error";

  res.status(status);

  if (status >= 500) {
    logger.error(message, { err, path: req.path });
  }

  res.failure({ message, code }, status);
};

export { createHttpError, isHttpError };
export type { HttpError };
