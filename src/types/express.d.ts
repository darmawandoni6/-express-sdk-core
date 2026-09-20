import type express from "express";

import type http from "http";

import type { JwtPayload } from "../middlewares/auth/types";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "production" | "development" | "test";
      PORT: string; // process.env selalu string — konversi ke number dilakukan saat dipakai
      JWT_EXPIRES_IN: string;
      LOG_LEVEL: "error" | "warn" | "info" | "http" | "debug";
      UPLOAD_DEST: string;
      UPLOAD_MAX_SIZE_MB: string; // process.env selalu string
      JWT_SECRET: string;
    }
  }
  namespace Express {
    interface Request {
      user?: JwtPayload; // dipersempit dari union type yang terlalu lebar
      prisma?: unknown; // Diisi jika prismaMiddleware() digunakan
    }
    interface Application {
      register: (routes: express.Router | express.Router[], prefix?: string) => void;
      run: (port?: number) => http.Server;
    }
    interface Response {
      success<T>(data: T, status?: number): this;
      failure(error: unknown, status?: number): this;
    }
  }
}

export {};
