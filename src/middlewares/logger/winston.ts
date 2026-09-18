import winston from 'winston';
import type { LoggerConfig } from './types.js';

let _logger: winston.Logger | null = null;

/**
 * Membuat (atau mengembalikan) singleton Winston logger.
 * Panggilan berulang mengembalikan instance yang sama kecuali resetLogger() dipanggil.
 */
export function createLogger(config: LoggerConfig = {}): winston.Logger {
  if (_logger) return _logger;

  const isProd =
    config.jsonFormat ?? process.env['NODE_ENV'] === 'production';

  _logger = winston.createLogger({
    level: config.level ?? (isProd ? 'info' : 'debug'),
    defaultMeta: { service: config.serviceName ?? 'express-sdk' },
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      isProd
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, service, ...meta }) => {
                const metaString =
                  Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${service}] ${level}: ${message}${metaString}`;
              },
            ),
          ),
    ),
    transports: [new winston.transports.Console()],
  });

  return _logger;
}

/** Reset singleton logger (berguna untuk testing) */
export function resetLogger(): void {
  _logger = null;
}
