import { logger } from "../middlewares/logger";
import type { PrismaClientLike, PrismaClientOptions } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __expressSdkPrismaInstance: PrismaClientLike | undefined;
}

/**
 * Creates or retrieves a managed PrismaClient instance with built-in:
 * - Singleton management (prevents connection exhaustion during dev hot-reloads)
 * - Winston logging integration for queries and connection status
 * - Graceful shutdown hooks on SIGINT / SIGTERM
 * - Optional eager connection verification ($connect)
 *
 * @param clientOrConstructor - A PrismaClient instance or class constructor
 * @param options - Configuration options for logging and lifecycle hooks
 */
export function createPrismaClient<T extends PrismaClientLike = PrismaClientLike>(
  clientOrConstructor: T | (new (...args: unknown[]) => T),
  options: PrismaClientOptions = {}
): T {
  const isTest = process.env.NODE_ENV === "test";
  const isProduction = process.env.NODE_ENV === "production";

  const { logConnection = !isTest, logQueries = false, enableShutdownHook = true, eagerConnect = true } = options;

  // Singleton caching in non-production environments to avoid multiple client instances
  if (!isProduction && globalThis.__expressSdkPrismaInstance) {
    return globalThis.__expressSdkPrismaInstance as T;
  }

  let client: T;
  if (typeof clientOrConstructor === "function") {
    const ClientConstructor = clientOrConstructor as new (...args: unknown[]) => T;
    client = new ClientConstructor();
  } else {
    client = clientOrConstructor;
  }

  // Hook query logging if requested and $on method is available
  if (logQueries && typeof client.$on === "function") {
    try {
      client.$on("query", (event: { query?: string; params?: string; duration?: number }) => {
        const duration = event.duration !== undefined ? ` [${event.duration}ms]` : "";
        logger.debug(`[Prisma Query]${duration} ${event.query || ""} ${event.params || ""}`.trim());
      });
    } catch {
      // Ignored if client was not initialized with { log: [{ emit: 'event', level: 'query' }] }
    }
  }

  // Eager connection check
  if (eagerConnect) {
    client
      .$connect()
      .then(() => {
        if (logConnection) {
          logger.info("[Prisma] Database connected successfully");
        }
      })
      .catch((err: unknown) => {
        if (logConnection) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error(`[Prisma] Database connection failed: ${message}`);
        }
      });
  }

  // Graceful shutdown listener
  if (enableShutdownHook) {
    const handleShutdown = async () => {
      try {
        await client.$disconnect();
        if (logConnection) {
          logger.info("[Prisma] Database connection closed cleanly");
        }
      } catch (err) {
        if (logConnection) {
          logger.error("[Prisma] Error while closing database connection", err);
        }
      }
    };

    process.once("SIGINT", handleShutdown);
    process.once("SIGTERM", handleShutdown);
  }

  if (!isProduction) {
    globalThis.__expressSdkPrismaInstance = client;
  }

  return client;
}
