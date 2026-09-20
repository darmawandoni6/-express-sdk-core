import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "app/index": "src/app/index.ts",
    "middlewares/index": "src/middlewares/index.ts",
    "middlewares/auth/index": "src/middlewares/auth/index.ts",
    "middlewares/upload/index": "src/middlewares/upload/index.ts",
    "middlewares/validate/index": "src/middlewares/validate/index.ts",
    "middlewares/logger/index": "src/middlewares/logger/index.ts",
    "middlewares/error/index": "src/middlewares/error/index.ts",
    "config/index": "src/config/index.ts",
    "prisma/index": "src/prisma/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  target: "es2022",
  outDir: "dist",
  treeshake: true,
  // Externalize all dependencies — libraries should never bundle their deps.
  // npm installs them automatically since they're listed in `dependencies`.
  external: [
    "express",
    "@prisma/client",
    "bcrypt",
    "cors",
    "dotenv",
    "helmet",
    "http-errors",
    "jsonwebtoken",
    "morgan",
    "multer",
    "winston",
    "zod",
  ],
});
