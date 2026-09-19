import { createApp } from "../../src";
import { customProductRouter } from "./api";

/**
 * ==========================================================
 * Case 2: Custom App (Full Custom Configuration)
 * ==========================================================
 * Pengaturan kustom:
 * - port: 3000
 * - cors: Whitelist origin & allowed HTTP methods
 * - helmet: Matikan CSP (berguna untuk pure REST API)
 * - bodyParser: Naikkan limit JSON payload ke 10MB
 * - logger: Aktifkan morgan HTTP logger
 */
const app = createApp({
  port: 3000,

  // 1. Custom CORS
  cors: {
    origin: ["http://localhost:3000", "https://frontend.mycompany.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  },

  // 2. Custom Helmet
  helmet: {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  },

  // 3. Custom Body Parser
  bodyParser: {
    jsonLimit: "10mb",
    urlEncodedExtended: true,
  },

  // 4. Custom Logger
  logger: true,
});

// Daftarkan route produk dengan prefix /api/v1
app.register(customProductRouter, "/api/v1");

// Jalankan server
app.run();
