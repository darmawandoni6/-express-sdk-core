import morgan from 'morgan';
import type { RequestHandler } from 'express';
import type { Logger } from 'winston';

export interface HttpLoggerOptions {
  /** Format morgan string atau custom format. Default: 'combined' di production, 'dev' di development */
  format?: string;
  /** Skip logging berdasarkan kondisi tertentu */
  skip?: (req: import('express').Request, res: import('express').Response) => boolean;
}

/**
 * Membuat Morgan HTTP request logger middleware yang di-stream ke Winston logger.
 */
export function createHttpLogger(
  logger: Logger,
  options: HttpLoggerOptions = {},
): RequestHandler {
  const defaultFormat =
    process.env['NODE_ENV'] === 'production' ? 'combined' : 'dev';

  return morgan(options.format ?? defaultFormat, {
    skip: options.skip,
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
  });
}
