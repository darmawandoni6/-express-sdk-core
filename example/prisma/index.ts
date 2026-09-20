import { createApp } from "../../src";
import { prismaApiRouter } from "./api";

/**
 * ==========================================================
 * Case 3: Prisma ORM Integration Example
 * ==========================================================
 * Menjalankan ExpressApp dengan rute terintegrasi database SQLite Prisma.
 */
const app = createApp({
  port: 8080,
  logger: true,
});

// Daftarkan rute API dengan prefix /v1
app.register(prismaApiRouter, "/v1");

// Jalankan server
app.run();
