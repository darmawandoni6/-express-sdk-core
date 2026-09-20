import type { ErrorRequestHandler, RequestHandler } from "express";

import createHttpError, { type HttpError, isHttpError } from "http-errors";

import { isPrismaError, mapPrismaError } from "../../prisma/errors";
import { logger } from "../logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(createHttpError.NotFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err: any, req, res, next) => {
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
  const status = err.status ?? (typeof err.statusCode === "number" ? err.statusCode : 500);
  const code = err.code ?? "INTERNAL_ERROR";
  const message = err.message ?? "Internal server error";

  res.status(status);

  if (status >= 500) {
    logger.error(message, { err, path: req.path });
  }

  res.failure({ message, code }, status);
};

export { createHttpError, isHttpError };
export type { HttpError };
