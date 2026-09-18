import express, { type Express } from 'express';
import { createCorsMiddleware } from '../middlewares/cors/index.js';
import { createHelmetMiddleware } from '../middlewares/helmet/index.js';
import {
  createLogger,
  createHttpLogger,
} from '../middlewares/logger/index.js';
import type { AppOptions } from './types.js';

/**
 * Factory function untuk membuat Express Application yang sudah terkonfigurasi
 * dengan security headers (helmet), CORS, body parser, dan HTTP logging (morgan -> winston).
 *
 * @example
 * const app = createApp({
 *   cors: { allowedOrigins: ['http://localhost:3000'] },
 *   logger: { serviceName: 'my-service' },
 * });
 */
export function createApp(options: AppOptions = {}): Express {
  const app = express();

  // 1. Security Headers (Helmet)
  if (options.helmet !== false) {
    app.use(
      createHelmetMiddleware(
        typeof options.helmet === 'object' ? options.helmet : undefined,
      ),
    );
  }

  // 2. CORS
  if (options.cors !== false) {
    app.use(
      createCorsMiddleware(
        typeof options.cors === 'object' ? options.cors : undefined,
      ),
    );
  }

  // 3. Body Parsers
  if (options.bodyParser !== false) {
    const bodyParserConfig =
      typeof options.bodyParser === 'object' ? options.bodyParser : undefined;
    const jsonLimit = bodyParserConfig?.jsonLimit;
    const urlEncodedExtended = bodyParserConfig?.urlEncodedExtended ?? true;

    app.use(express.json(jsonLimit ? { limit: jsonLimit } : undefined));
    app.use(express.urlencoded({ extended: urlEncodedExtended }));
  }

  // 4. HTTP Logger (Morgan streamed into Winston)
  if (options.logger !== false && options.httpLogger !== false) {
    const loggerInstance = createLogger(
      typeof options.logger === 'object' ? options.logger : undefined,
    );
    const httpOptions =
      typeof options.httpLogger === 'object' ? options.httpLogger : undefined;
    app.use(createHttpLogger(loggerInstance, httpOptions));
  }

  return app;
}

export type { AppOptions };
