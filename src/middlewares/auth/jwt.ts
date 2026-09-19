import type { NextFunction, Request, Response } from "express";

import createHttpError from "http-errors";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

import { asyncHandler } from "@/app/async-handler";

import type { JwtConfig, JwtMiddlewareOptions, JwtPayload } from "./types";

/**
 * Menandatangani payload dan menghasilkan JWT string.
 */
export function signToken(payload: Omit<JwtPayload, "iat" | "exp">, config: JwtConfig): string {
  const options: SignOptions = {
    algorithm: config.algorithm ?? "HS256",
  };

  if (config.expiresIn !== undefined) {
    options.expiresIn = config.expiresIn as SignOptions["expiresIn"];
  } else {
    options.expiresIn = "7d";
  }

  return jwt.sign(payload, config.secret as Secret, options);
}

/**
 * Memverifikasi JWT string dan mengembalikan payload.
 * Melempar error jika token invalid, expired, atau signature tidak cocok.
 */
export function verifyToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret as Secret) as JwtPayload;
}

/**
 * Mendekode JWT token tanpa memverifikasi signature (berguna untuk inspeksi payload).
 */
export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}

/**
 * Factory untuk membuat Express middleware autentikasi JWT.
 * Membaca token dari header Authorization: Bearer <token> atau cookie `authorization`.
 * Menyimpan verified payload ke `req.user`.
 *
 * Jika `options` tidak diberikan, otomatis menggunakan `process.env.JWT_SECRET`.
 *
 * @example
 * // Zero-config: otomatis pakai process.env.JWT_SECRET
 * router.get("/me", createJwtMiddleware(), handler);
 *
 * // Custom config: pakai secret sendiri
 * const adminAuth = createJwtMiddleware({ secret: process.env.ADMIN_SECRET });
 * router.get("/admin", adminAuth, handler);
 */
export const createJwtMiddleware = (options?: Partial<JwtMiddlewareOptions>) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const secret = options?.secret ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        "JWT secret is not configured. Pass `secret` via options or set the JWT_SECRET environment variable.",
      );
    }

    let authHeader = req.headers["authorization"];
    // Fallback ke cookie jika header tidak ada (membutuhkan cookie-parser)
    const cookieAuth = (req.cookies as Record<string, string> | undefined)?.["authorization"];
    if (cookieAuth) authHeader = cookieAuth;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createHttpError.Unauthorized(
        options?.missingTokenMessage ?? "Missing or invalid authorization token",
      );
    }

    const token = authHeader.split(" ")[1]!;

    try {
      const payload = jwt.verify(token, secret as Secret) as JwtPayload;
      req.user = payload;
      next();
    } catch (err: unknown) {
      if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
        throw createHttpError.Unauthorized(options?.invalidTokenMessage ?? err.message);
      }
      throw err;
    }
  });
