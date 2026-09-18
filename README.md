# @express-sdk/core

A modular, production-ready Express and TypeScript library with batteries included. Designed to eliminate repetitive boilerplate and enforce clean architecture, security, logging, validation, and authentication standards.

---

## Features

- ⚡ **TypeScript & Dual ESM/CJS Output** (built with `tsup` and full type definitions)
- 🔒 **Security**: Configured `helmet` and `cors` middlewares
- 🪵 **Logging**: Centralized `winston` logger with `morgan` HTTP request streaming
- 🛡️ **Validation**: Type-safe validation using `zod` for `body`, `query`, and `params`
- 🔑 **Auth**: JWT sign, verify, and authentication middleware + `bcrypt` password hashing utilities
- 📁 **File Upload**: `multer` helpers for disk storage (with UUID naming) and memory buffer storage
- ⚙️ **Config Loader**: Fast environment variable validation on startup using `dotenv` and `zod`
- 🚀 **App Factory**: `createApp(options)` ready to use with security and logging out of the box
- 🛑 **Error Handling**: `AppError`, `notFoundHandler`, and structured `errorHandler`

---

## Installation

```bash
npm install @express-sdk/core express
```

> **Note**: `express` is a peer dependency. Ensure you have `express` (v4.18+ or v5+) installed in your project.

---

## Quick Start

### 1. Basic Setup with `createApp`

```typescript
import {
  createApp,
  loadConfig,
  validateBody,
  createJwtMiddleware,
  notFoundHandler,
  errorHandler,
} from '@express-sdk/core';
import { z } from 'zod';

// 1. Load and validate environment variables
const env = loadConfig();

// 2. Initialize pre-configured Express app
const app = createApp({
  cors: { allowedOrigins: ['http://localhost:3000'] },
  logger: { serviceName: 'my-service' },
});

// 3. Define Zod validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 4. Setup routes
app.post('/api/auth/login', validateBody(loginSchema), (req, res) => {
  // req.body is fully validated and typed
  res.json({ success: true, message: 'Logged in' });
});

// 5. Protected route with JWT
const auth = createJwtMiddleware({ secret: env.JWT_SECRET });
app.get('/api/me', auth, (req, res) => {
  res.json({ user: req.user });
});

// 6. Global 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT}`);
});
```

---

## Subpath Imports

This package supports granular subpath imports for cleaner imports and tree-shaking:

```typescript
import { createJwtMiddleware, signToken, hashPassword } from '@express-sdk/core/middlewares/auth';
import { validate, validateBody, validateQuery, validateParams } from '@express-sdk/core/middlewares/validate';
import { createDiskUpload, createMemoryUpload } from '@express-sdk/core/middlewares/upload';
import { createLogger, createHttpLogger } from '@express-sdk/core/middlewares/logger';
import { createCorsMiddleware } from '@express-sdk/core/middlewares/cors';
import { createHelmetMiddleware } from '@express-sdk/core/middlewares/helmet';
import { AppError, errorHandler, notFoundHandler } from '@express-sdk/core/middlewares/error';
import { loadConfig } from '@express-sdk/core/config';
import { createApp } from '@express-sdk/core/app';
```

---

## Detailed Modules Guide

### 1. Validation (`zod`)

Validate incoming requests with automatic type coercion and error reporting:

```typescript
import { validateBody, validateQuery, validateParams, validateRequest } from '@express-sdk/core';
import { z } from 'zod';

// Body validation
const userSchema = z.object({
  name: z.string().min(2),
  age: z.coerce.number().min(18),
});
app.post('/users', validateBody(userSchema), handler);

// Query validation
const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});
app.get('/users', validateQuery(querySchema), handler);

// Combined validation
app.put(
  '/users/:id',
  validateRequest({
    params: z.object({ id: z.coerce.number() }),
    body: z.object({ name: z.string() }),
  }),
  handler,
);
```

### 2. Authentication (`jwt` & `bcrypt`)

```typescript
import {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  createJwtMiddleware,
} from '@express-sdk/core';

// Password hashing
const hashedPassword = await hashPassword('my-plain-password');
const isValid = await comparePassword('my-plain-password', hashedPassword);

// Issue JWT
const token = signToken({ sub: 'user_123', role: 'admin' }, {
  secret: process.env.JWT_SECRET!,
  expiresIn: '7d',
});

// Protect route
app.get('/protected', createJwtMiddleware({ secret: process.env.JWT_SECRET! }), (req, res) => {
  // req.user contains the decoded payload
  res.json({ userId: req.user?.sub });
});
```

### 3. File Upload (`multer`)

```typescript
import { createDiskUpload, createMemoryUpload } from '@express-sdk/core';

// Disk upload (saves with UUID filename)
app.post(
  '/upload/avatar',
  createDiskUpload({
    dest: 'uploads/avatars',
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  }),
  (req, res) => {
    res.json({ filePath: req.file?.path });
  },
);

// Memory upload (stored in req.file.buffer)
app.post('/upload/process', createMemoryUpload(), (req, res) => {
  const buffer = req.file?.buffer;
  res.send('Processed file in memory');
});
```

### 4. Logging (`winston` + `morgan`)

```typescript
import { createLogger, createHttpLogger } from '@express-sdk/core';

const logger = createLogger({
  serviceName: 'order-service',
  level: 'info',
});

logger.info('Order placed', { orderId: 1234 });

// Stream HTTP requests
app.use(createHttpLogger(logger));
```

### 5. Error Handling

```typescript
import { AppError, errorHandler, notFoundHandler } from '@express-sdk/core';

app.get('/order/:id', async (req, res, next) => {
  const order = await findOrder(req.params.id);
  if (!order) {
    throw new AppError('Order not found', {
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
      details: { id: req.params.id },
    });
  }
  res.json(order);
});

// Mount at the end
app.use(notFoundHandler);
app.use(errorHandler);
```

---

## Scripts

```bash
# Build both CJS and ESM distributions
npm run build

# Run TypeScript typecheck
npm run typecheck

# Run automated tests
npm test
```

---

## License

MIT
