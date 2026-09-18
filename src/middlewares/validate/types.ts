import type { ZodSchema, ZodError } from 'zod';

export type ValidationTarget = 'body' | 'query' | 'params';

export interface ValidationOptions {
  /** Target request yang akan divalidasi. Default: 'body' */
  target?: ValidationTarget;
  /** Custom error message header */
  errorMessage?: string;
  /** Format error response kustom */
  customErrorFormatter?: (error: ZodError) => unknown;
}

export type { ZodSchema, ZodError };
