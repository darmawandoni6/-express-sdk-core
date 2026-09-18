import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import type { ValidationTarget, ValidationOptions } from './types.js';

export * from './types.js';

function assignReqProperty(req: Request, key: string, value: unknown): void {
  try {
    Object.defineProperty(req, key, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch {
    (req as unknown as Record<string, unknown>)[key] = value;
  }
}

/**
 * Generic validation middleware menggunakan Zod schema.
 * Mengembalikan HTTP 400 dengan detail field errors jika validasi gagal.
 * Data yang ter-parse (dengan transformasi & tipe yang sesuai) akan menggantikan data asli pada `req[target]`.
 *
 * @example
 * const userSchema = z.object({ email: z.string().email(), age: z.coerce.number() });
 * router.post('/users', validate(userSchema, 'body'), userHandler);
 */
export function validate(
  schema: ZodSchema,
  targetOrOptions: ValidationTarget | ValidationOptions = 'body',
): RequestHandler {
  const options: ValidationOptions =
    typeof targetOrOptions === 'string'
      ? { target: targetOrOptions }
      : targetOrOptions;

  const target = options.target ?? 'body';

  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const formattedErrors = options.customErrorFormatter
        ? options.customErrorFormatter(result.error)
        : result.error.flatten().fieldErrors;

      res.status(400).json({
        success: false,
        message: options.errorMessage ?? 'Validation failed',
        errors: formattedErrors,
      });
      return;
    }

    // Assign parsed data back to req[target]
    assignReqProperty(req, target, result.data);
    next();
  };
}

/** Shorthand: validasi `req.body` */
export const validateBody = (
  schema: ZodSchema,
  options?: Omit<ValidationOptions, 'target'>,
): RequestHandler => validate(schema, { ...options, target: 'body' });

/** Shorthand: validasi `req.query` */
export const validateQuery = (
  schema: ZodSchema,
  options?: Omit<ValidationOptions, 'target'>,
): RequestHandler => validate(schema, { ...options, target: 'query' });

/** Shorthand: validasi `req.params` */
export const validateParams = (
  schema: ZodSchema,
  options?: Omit<ValidationOptions, 'target'>,
): RequestHandler => validate(schema, { ...options, target: 'params' });

/**
 * Validasi komposit untuk body, query, dan params sekaligus.
 */
export function validateRequest(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, unknown> = {};
    let parsedParams: unknown;
    let parsedQuery: unknown;
    let parsedBody: unknown;

    if (schemas.params) {
      const pResult = schemas.params.safeParse(req.params);
      if (!pResult.success) {
        errors['params'] = pResult.error.flatten().fieldErrors;
      } else {
        parsedParams = pResult.data;
      }
    }

    if (schemas.query) {
      const qResult = schemas.query.safeParse(req.query);
      if (!qResult.success) {
        errors['query'] = qResult.error.flatten().fieldErrors;
      } else {
        parsedQuery = qResult.data;
      }
    }

    if (schemas.body) {
      const bResult = schemas.body.safeParse(req.body);
      if (!bResult.success) {
        errors['body'] = bResult.error.flatten().fieldErrors;
      } else {
        parsedBody = bResult.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Request validation failed',
        errors,
      });
      return;
    }

    if (parsedParams !== undefined) {
      assignReqProperty(req, 'params', parsedParams);
    }
    if (parsedQuery !== undefined) {
      assignReqProperty(req, 'query', parsedQuery);
    }
    if (parsedBody !== undefined) {
      assignReqProperty(req, 'body', parsedBody);
    }

    next();
  };
}
