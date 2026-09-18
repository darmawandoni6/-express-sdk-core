import type { CorsConfig } from '../middlewares/cors/index.js';
import type { HelmetOptions } from '../middlewares/helmet/index.js';
import type { LoggerConfig, HttpLoggerOptions } from '../middlewares/logger/index.js';

export interface AppOptions {
  /** Konfigurasi CORS. `false` untuk menonaktifkan. Default: aktif dengan wildcard origin */
  cors?: CorsConfig | false;
  /** Konfigurasi Helmet. `false` untuk menonaktifkan. Default: aktif */
  helmet?: HelmetOptions | false;
  /** Konfigurasi Winston Logger. `false` untuk menonaktifkan. Default: aktif */
  logger?: LoggerConfig | false;
  /** Konfigurasi Morgan HTTP logger. `false` untuk menonaktifkan. Default: aktif */
  httpLogger?: HttpLoggerOptions | false;
  /** Konfigurasi JSON & URL-encoded body parser. `false` untuk menonaktifkan. Default: true */
  bodyParser?:
    | boolean
    | {
        jsonLimit?: string;
        urlEncodedExtended?: boolean;
      };
}
