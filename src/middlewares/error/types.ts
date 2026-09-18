export interface AppErrorOptions {
  /** HTTP status code. Default: 500 */
  statusCode?: number;
  /** Error code yang dapat diidentifikasi client (e.g. 'USER_NOT_FOUND', 'VALIDATION_ERROR') */
  code?: string;
  /** Detail atau metadata tambahan untuk debugging */
  details?: unknown;
}
