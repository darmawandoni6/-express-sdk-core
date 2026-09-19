import { config } from "dotenv";

import { type Env, envSchema } from "./env";

export interface LoadConfigOptions {
  /** Path ke custom .env file */
  path?: string;
  /** Override process.env values */
  override?: Record<string, string | undefined>;
}

/**
 * Memuat dan memvalidasi environment variables menggunakan dotenv & Zod.
 * Melempar Error jika ada variabel yang hilang atau tidak valid.
 */
export function loadConfig(options: LoadConfigOptions = {}): Env {
  if (options.path) {
    config({ path: options.path });
  } else {
    config();
  }

  const rawEnv = {
    ...process.env,
    ...options.override,
  };

  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const formatted = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`[express-sdk] Konfigurasi environment tidak valid:\n${formatted}`);
  }

  return result.data;
}

export { envSchema };
export type { Env };
