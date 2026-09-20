import type { RequestHandler } from "express";

import type { PrismaClientLike } from "./types";

/**
 * Express middleware that attaches the PrismaClient instance to `req.prisma`.
 *
 * @param client - The PrismaClient instance to attach to the request
 *
 * @example
 * ```ts
 * import { createApp } from "@express-sdk/core";
 * import { prismaMiddleware } from "@express-sdk/core/prisma";
 * import { prisma } from "./db";
 *
 * const app = createApp();
 * app.use(prismaMiddleware(prisma));
 * ```
 */
export function prismaMiddleware<T extends PrismaClientLike = PrismaClientLike>(client: T): RequestHandler {
  return (req, _res, next) => {
    (req as { prisma?: T }).prisma = client;
    next();
  };
}
