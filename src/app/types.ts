import type { CorsOptions } from "cors";
import type { HelmetOptions } from "helmet";

export type CorsConfig = CorsOptions;

export interface BodyParserOptions {
  json?: boolean;
  urlencoded?: boolean;
  jsonLimit?: string;
  urlEncodedExtended?: boolean;
}

export interface AppOptions {
  port?: number;
  /** CORS configuration or boolean to enable/disable. Default: enabled with wildcard origin */
  cors?: CorsConfig | boolean;
  /** Helmet configuration or boolean to enable/disable. Default: enabled */
  helmet?: HelmetOptions | boolean;
  /** JSON and URL-encoded body parser configuration or boolean. Default: enabled */
  bodyParser?: BodyParserOptions | boolean;
  /** Morgan HTTP logging configuration or boolean. Default: enabled */
  logger?: boolean;
}
