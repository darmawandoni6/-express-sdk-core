# @express-sdk/core

A modular, production-ready Express + TypeScript SDK. Eliminates repetitive boilerplate — security, logging, validation, auth, and file upload all pre-configured and ready to use.

---

## Features

- ⚡ **TypeScript & Dual ESM/CJS** — full type definitions, tree-shaking friendly
- 🔒 **Security** — `helmet` + `cors` pre-configured
- 🪵 **Logging** — `winston` logger + `morgan` HTTP request streaming
- 🛡️ **Validation** — type-safe Zod validation for `body`, `params`, and `query`
- 🔑 **Auth** — JWT middleware, sign/verify helpers, bcrypt password hashing
- 📁 **File Upload** — multer helpers for disk and memory storage
- ⚙️ **Config Loader** — env variable validation via dotenv + Zod at startup
- 🚀 **App Factory** — `createApp()` with one-liner setup
- 🛑 **Error Handling** — structured `errorHandler` + `notFoundHandler` auto-mounted

---

## Requirements

- Node.js `>= 20`
- Express `>= 4.18` or `>= 5.0`

---

## Installation

```bash
npm install @express-sdk/core express
```

> `express` is a peer dependency. Install it separately.

---

## Quick Start

```typescript
import { Router, asyncHandler, createApp, validate, z } from "@express-sdk/core";

const app = createApp(); // Helmet + CORS + body-parser + /health auto-configured

const userSchema = {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
};

const router = Router();

router.post(
  "/users",
  validate(userSchema),
  asyncHandler(async (req, res) => {
    res.success({ user: req.body }, 201);
  })
);

app.register(router, "/api/v1");
app.run(3000); // auto-mounts 404 & error handlers before listening
```

---

## App Factory

### `createApp(options?)`

```typescript
import { createApp } from "@express-sdk/core";

const app = createApp({
  port: 3000,

  // Custom CORS (pass false to disable)
  cors: {
    origin: ["http://localhost:3000", "https://myapp.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },

  // Custom Helmet (pass false to disable)
  helmet: {
    contentSecurityPolicy: false,
  },

  // Body parser limits (pass false to disable)
  bodyParser: {
    jsonLimit: "10mb",
    urlEncodedExtended: true,
  },

  // Disable Morgan HTTP logger
  logger: false,
});

app.register(router, "/api/v1"); // mount routes with optional prefix
app.run(); // listens on port from config or process.env.PORT
```

### Built-in Endpoints

| Route         | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `GET /health` | Returns `{ status: 200, data: { message: "OK", time: "..." }, error: null }` |

### Response Helpers

Every handler gets `res.success()` and `res.failure()` — consistent JSON shape:

```typescript
// { status: 201, data: { user }, error: null }
res.success({ user }, 201);

// { status: 422, data: null, error: { code, message } }
res.failure({ code: "INVALID_INPUT", message: "Email is required" }, 422);
```

---

## Validation

```typescript
import { validate, z } from "@express-sdk/core";

router.put(
  "/users/:id",
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({ name: z.string().min(2) }),
    query: z.object({ notify: z.coerce.boolean().default(false) }),
  }),
  asyncHandler(async (req, res) => {
    // req.body, req.params, req.query are fully typed & validated
    res.success({ updated: req.params.id });
  })
);
```

Validation errors automatically return:

```json
{
  "status": 422,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { "name": ["String must contain at least 2 character(s)"] }
  }
}
```

---

## Authentication

### JWT Middleware

```typescript
import { createJwtMiddleware } from "@express-sdk/core";

// Zero-config — reads secret from process.env.JWT_SECRET automatically
router.get("/me", createJwtMiddleware(), (req, res) => {
  res.success({ user: req.user });
});

// Custom secret (useful for multiple token types or testing)
const adminAuth = createJwtMiddleware({ secret: process.env.ADMIN_SECRET! });
router.get("/admin", adminAuth, handler);

// Custom error messages
const strictAuth = createJwtMiddleware({
  missingTokenMessage: "Please log in first",
  invalidTokenMessage: "Your session has expired",
});
```

### JWT Utilities

```typescript
import { decodeToken, signToken, verifyToken } from "@express-sdk/core";

// Sign a token
const token = signToken({ sub: "user_123", role: "admin" }, { secret: process.env.JWT_SECRET!, expiresIn: "7d" });

// Verify
const payload = verifyToken(token, process.env.JWT_SECRET!);

// Decode without verification (inspection only)
const decoded = decodeToken(token);
```

### Password Hashing (bcrypt)

```typescript
import { comparePassword, hashPassword } from "@express-sdk/core";

const hash = await hashPassword("my-plain-password"); // default 10 rounds
const isValid = await comparePassword("my-plain-password", hash); // true / false
```

---

## File Upload

```typescript
import {
  createDiskUpload,
  createDiskUploadMultiple,
  createMemoryUpload,
  createMemoryUploadMultiple,
} from "@express-sdk/core";

// Single file → disk (UUID filename)
router.post(
  "/avatar",
  createDiskUpload({
    dest: "uploads/avatars",
    maxFileSize: 2 * 1024 * 1024, // 2 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  }),
  asyncHandler(async (req, res) => {
    res.success({ path: req.file?.path });
  })
);

// Multiple files → disk
router.post("/photos", createDiskUploadMultiple({ dest: "uploads/", maxCount: 5 }), handler);

// Single file → memory buffer (for processing without saving to disk)
router.post(
  "/process",
  createMemoryUpload(),
  asyncHandler(async (req, res) => {
    const buffer = req.file?.buffer;
    res.success({ size: buffer?.length });
  })
);

// Multiple files → memory
router.post("/batch", createMemoryUploadMultiple({ maxCount: 10 }), handler);
```

---

## Error Handling

Use `createHttpError` to throw structured HTTP errors from any handler wrapped in `asyncHandler`:

```typescript
import { asyncHandler, createHttpError } from "@express-sdk/core";

router.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const order = await findOrder(req.params.id);

    if (!order) {
      throw createHttpError.NotFound(`Order ${req.params.id} not found`);
    }

    res.success(order);
  })
);
```

Error responses follow the same shape:

```json
{
  "status": 404,
  "data": null,
  "error": { "message": "Order abc-123 not found", "code": "INTERNAL_ERROR" }
}
```

> `notFoundHandler` and `errorHandler` are **automatically mounted** when you call `app.run()`. You do not need to add them manually.

---

## Config Loader

Validates environment variables at startup — throws a descriptive error if anything is missing or invalid:

```typescript
import { loadConfig } from "@express-sdk/core";

const env = loadConfig(); // throws if .env is invalid

// env is fully typed:
// { NODE_ENV, PORT, JWT_SECRET?, JWT_EXPIRES_IN, LOG_LEVEL, UPLOAD_DEST, UPLOAD_MAX_SIZE_MB }
```

Default `.env` schema (all optional except what you explicitly require):

| Variable             | Type                                     | Default       |
| -------------------- | ---------------------------------------- | ------------- |
| `NODE_ENV`           | `development \| production \| test`      | `development` |
| `PORT`               | `number`                                 | `3000`        |
| `JWT_SECRET`         | `string (min 32 chars)`                  | — (optional)  |
| `JWT_EXPIRES_IN`     | `string`                                 | `7d`          |
| `LOG_LEVEL`          | `error \| warn \| info \| http \| debug` | `info`        |
| `UPLOAD_DEST`        | `string`                                 | `uploads/`    |
| `UPLOAD_MAX_SIZE_MB` | `number`                                 | `5`           |

---

## Logging

The built-in `logger` is a Winston instance available for use in your code:

```typescript
import { logger } from "@express-sdk/core";

logger.info("Server started");
logger.warn("Deprecated usage detected", { route: "/old" });
logger.error("Database connection failed", { err });
```

Logs are written to:

- `logs/error.log` — error-level only
- `logs/combined.log` — all levels
- Console (colorized) — when `NODE_ENV !== production`

---

## Prisma ORM Integration (Optional)

`@express-sdk/core` includes first-class optional support for Prisma ORM with automated singleton connection pooling, Winston query & connection logging, and automatic error mapping.

### Setup

```bash
npm install @express-sdk/core @prisma/client
npm install -D prisma
```

### Usage

```typescript
import { Router, asyncHandler, createApp } from "@express-sdk/core";
import { createPrismaClient } from "@express-sdk/core/prisma";
import { PrismaClient } from "@prisma/client";

// 1. Create client with singleton & logging
export const prisma = createPrismaClient(new PrismaClient(), {
  logConnection: true,
  logQueries: process.env.NODE_ENV === "development",
  enableShutdownHook: true,
});

// 2. Use in routes (Prisma errors like P2002 duplicate or P2025 not found are auto-mapped to 409 & 404!)
const router = Router();

router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id } });
    return res.success(user);
  })
);
```

---

## Subpath Imports

For smaller bundles via tree-shaking:

```typescript
import { asyncHandler, createApp } from "@express-sdk/core/app";
import { loadConfig } from "@express-sdk/core/config";
import { createJwtMiddleware, hashPassword } from "@express-sdk/core/middlewares/auth";
import { errorHandler, notFoundHandler } from "@express-sdk/core/middlewares/error";
import { logger } from "@express-sdk/core/middlewares/logger";
import { createDiskUpload } from "@express-sdk/core/middlewares/upload";
import { validate } from "@express-sdk/core/middlewares/validate";
import { createPrismaClient, prismaMiddleware } from "@express-sdk/core/prisma";
```

---

## Scripts

```bash
npm run build           # Build CJS + ESM distributions
npm run typecheck       # TypeScript type check
npm test                # Run tests
npm run example         # Run the default example
npm run example:prisma  # Run the Prisma SQLite example
```

---

## License

MIT
