import { createApp } from "../../src";
import { defaultApiRouter } from "./api";

/**
 * ==========================================================
 * Case 1: Default App (Zero Configuration)
 * ==========================================================
 * Secara default, createApp() mengaktifkan:
 * - Helmet (Security Headers)
 * - CORS (origin: "*", credentials: true)
 * - Body Parsers (express.json() & express.urlencoded())
 * - Logger (Morgan HTTP request logging)
 * - Health Check endpoint di GET /health
 * - Global Response helpers: res.success() dan res.failure()
 */
const app = createApp();

// Daftarkan route dengan prefix /v1
app.register(defaultApiRouter, "/v1");

// Jalankan server di port 8080
app.run(8080);
