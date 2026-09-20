export interface PrismaClientOptions {
  /**
   * Whether to log connection lifecycle events (connected, disconnected, error).
   * @default true (false in test environment)
   */
  logConnection?: boolean;

  /**
   * Whether to log executed SQL queries to the Winston logger.
   * @default false (or true in development when explicitly enabled)
   */
  logQueries?: boolean;

  /**
   * Whether to register process exit hooks (SIGINT, SIGTERM) for graceful $disconnect.
   * @default true
   */
  enableShutdownHook?: boolean;

  /**
   * Whether to execute an immediate connection check via $connect().
   * @default true
   */
  eagerConnect?: boolean;
}

export interface PrismaClientLike {
  $connect?(): Promise<unknown> | unknown;
  $disconnect?(): Promise<unknown> | unknown;
  $on?(event: string, callback: (...args: unknown[]) => void): void;
}

export interface PrismaErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}
