export interface JwtPayload {
  /** Subject identifier (biasanya user ID) */
  sub: string;
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** Expires at (Unix timestamp) */
  exp?: number;
  /** Custom payload fields */
  [key: string]: unknown;
}

export interface JwtConfig {
  /** Secret key untuk sign/verify token (minimal 32 karakter direkomendasikan) */
  secret: string;
  /** Masa berlaku token (e.g. '15m', '1h', '7d'). Default: '7d' */
  expiresIn?: string | number;
  /** Algoritma JWT. Default: 'HS256' */
  algorithm?: "HS256" | "HS384" | "HS512" | "RS256";
}

export interface JwtMiddlewareOptions extends JwtConfig {
  /** Custom error message ketika token hilang */
  missingTokenMessage?: string;
  /** Custom error message ketika token tidak valid */
  invalidTokenMessage?: string;
}
