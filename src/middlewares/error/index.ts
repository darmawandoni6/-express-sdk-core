import type { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { AppErrorOptions } from './types.js';

/**
 * Custom error class dengan HTTP status code dan error code.
 *
 * @example
 * throw new AppError('User not found', { statusCode: 404, code: 'USER_NOT_FOUND' });
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown;
  public readonly isOperational: boolean = true;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'INTERNAL_ERROR';
    this.details = options.details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware. Pasang paling akhir setelah semua route didefinisikan.
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(process.env['NODE_ENV'] !== 'production' && err.details !== undefined
        ? { details: err.details }
        : {}),
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  // Multer errors (e.g. file size exceeded)
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      message: err.message,
      code: 'FILE_UPLOAD_ERROR',
    });
    return;
  }

  // General fallback errors
  const isProduction = process.env['NODE_ENV'] === 'production';
  const statusCode =
    res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: isProduction ? 'Internal Server Error' : err.message,
    code: 'INTERNAL_ERROR',
    ...(!isProduction && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler. Pasang setelah semua router sebelum errorHandler.
 */
export const notFoundHandler: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(
    new AppError(`Route not found: ${req.method} ${req.originalUrl}`, {
      statusCode: 404,
      code: 'NOT_FOUND',
    }),
  );
};

export type { AppErrorOptions };
