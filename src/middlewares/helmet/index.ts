import helmet from 'helmet';
import type { HelmetOptions } from 'helmet';
import type { RequestHandler } from 'express';

/**
 * Membuat Helmet security middleware dengan default konfigurasi yang aman.
 *
 * @example
 * app.use(createHelmetMiddleware());
 */
export function createHelmetMiddleware(
  options?: HelmetOptions,
): RequestHandler {
  if (options) {
    return helmet(options) as unknown as RequestHandler;
  }
  return helmet({
    strictTransportSecurity: {
      maxAge: 31_536_000, // 1 tahun
      includeSubDomains: true,
      preload: true,
    },
  }) as unknown as RequestHandler;
}

export type { HelmetOptions };
