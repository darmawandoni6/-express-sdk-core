import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { JwtConfig, JwtPayload, JwtMiddlewareOptions } from './types.js';

/**
 * Menandatangani payload dan menghasilkan JWT string.
 */
export function signToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  config: JwtConfig,
): string {
  const options: SignOptions = {
    algorithm: config.algorithm ?? 'HS256',
  };

  if (config.expiresIn !== undefined) {
    options.expiresIn = config.expiresIn as SignOptions['expiresIn'];
  } else {
    options.expiresIn = '7d';
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
 * Express middleware untuk autentikasi JWT melalui header Authorization: Bearer <token>.
 * Menyimpan verified payload ke `req.user`.
 */
export function createJwtMiddleware(
  options: JwtMiddlewareOptions,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message:
          options.missingTokenMessage ??
          'Missing or invalid Authorization header',
      });
      return;
    }

    const token = authHeader.slice(7).trim();

    try {
      const payload = verifyToken(token, options.secret);
      req.user = payload;
      next();
    } catch {
      res.status(401).json({
        success: false,
        message: options.invalidTokenMessage ?? 'Invalid or expired token',
      });
    }
  };
}
