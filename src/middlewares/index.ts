// CORS
export { createCorsMiddleware } from './cors/index.js';
export type { CorsConfig, CorsOptions } from './cors/index.js';

// Helmet
export { createHelmetMiddleware } from './helmet/index.js';
export type { HelmetOptions } from './helmet/index.js';

// Logger
export {
  createLogger,
  createHttpLogger,
  resetLogger,
} from './logger/index.js';
export type { LoggerConfig, Logger, HttpLoggerOptions } from './logger/index.js';

// Validation
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
} from './validate/index.js';
export type {
  ValidationTarget,
  ValidationOptions,
  ZodSchema,
  ZodError,
} from './validate/index.js';

// Auth
export {
  signToken,
  verifyToken,
  decodeToken,
  createJwtMiddleware,
  hashPassword,
  comparePassword,
  hashPasswordSync,
  comparePasswordSync,
} from './auth/index.js';
export type {
  JwtPayload,
  JwtConfig,
  JwtMiddlewareOptions,
} from './auth/index.js';

// Upload
export {
  createDiskMulter,
  createMemoryMulter,
  createDiskUpload,
  createDiskUploadArray,
  createMemoryUpload,
  createMemoryUploadArray,
} from './upload/index.js';
export type {
  DiskUploadConfig,
  MemoryUploadConfig,
  CustomFileFilter,
} from './upload/index.js';

// Error handling
export {
  AppError,
  errorHandler,
  notFoundHandler,
} from './error/index.js';
export type { AppErrorOptions } from './error/index.js';
