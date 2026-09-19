import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(32, "JWT_SECRET harus minimal 32 karakter").optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("info"),
  UPLOAD_DEST: z.string().default("uploads/"),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().positive().default(5),
});

export type Env = z.infer<typeof envSchema>;
