import cors from 'cors';
import type { CorsOptions } from 'cors';
import type { RequestHandler } from 'express';

export interface CorsConfig extends CorsOptions {
  /** Shorthand untuk specify allowed origins (string atau array) */
  allowedOrigins?: string | string[];
}

/**
 * Membuat CORS middleware yang sudah terkonfigurasi.
 *
 * @example
 * app.use(createCorsMiddleware({ allowedOrigins: ['https://myapp.com'] }));
 */
export function createCorsMiddleware(options: CorsConfig = {}): RequestHandler {
  const { allowedOrigins, ...corsOptions } = options;

  let originOption = corsOptions.origin;
  if (allowedOrigins !== undefined) {
    originOption = allowedOrigins;
  } else if (originOption === undefined) {
    originOption = '*';
  }

  return cors({
    origin: originOption,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    ...corsOptions,
  }) as RequestHandler;
}

export type { CorsOptions };
