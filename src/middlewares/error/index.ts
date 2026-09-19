import type { ErrorRequestHandler, RequestHandler } from "express";

import createHttpError, { type HttpError, isHttpError } from "http-errors";

import { logger } from "../logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(createHttpError.NotFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (err: HttpError, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status ?? 500;
  const code = err.code ?? "INTERNAL_ERROR";
  const message = err.message ?? "Internal server error";

  res.status(status);

  if (status >= 500) {
    logger.error(message, { err, path: req.path });
  }

  res.failure({ message, code });
};

export { createHttpError, isHttpError };
export type { HttpError };
