import type { Logger } from 'winston';

export interface LoggerConfig {
  /** Log level: 'error' | 'warn' | 'info' | 'http' | 'debug'. Default: 'info' */
  level?: string;
  /** Nama service yang muncul di setiap log entry. Default: 'express-sdk' */
  serviceName?: string;
  /** Format JSON (prod) atau pretty-print (dev). Default: otomatis via NODE_ENV */
  jsonFormat?: boolean;
}

export type { Logger };
