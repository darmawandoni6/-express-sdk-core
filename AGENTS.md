# AGENTS.md

Mandatory guidelines for AI coding agents working on the development of `@express-sdk/core`.

---

## Core Principles

1. **Do not break public APIs** — any changes modifying exported function signatures must be explicitly discussed first.
2. **Typecheck & tests must pass** before considering any task complete — run `yarn typecheck && yarn test`.
3. **Single import, single source** — users should import directly from `@express-sdk/core`, not from underlying third-party dependencies.
4. **Explicit is better than magic** — avoid unexpected or hidden behaviors.

---

## Before Starting Work

Always read these files first to understand the context:

```
src/index.ts                  # Public API surface — what is exported to users
src/app/index.ts              # Core: ExpressApp class + createApp()
src/types/express.d.ts        # Express module augmentations
tsup.config.ts                # Build configuration — entry points & externals
package.json                  # Exports map, dependencies, engines
```

---

## Coding Rules

### Exports & Public API

- All public exports must go through `src/index.ts`.
- Any new middleware must also be added to `src/middlewares/index.ts`.
- Never add `export default` to a module that already has named exports — this causes CJS rollup/consumer warnings.
- Types must be explicitly exported (`export type { ... }`).

### Async & Error Handling

- All async route handlers must be wrapped with `asyncHandler` — never expose a raw async function as middleware.
- Error propagation must happen via `throw` or `next(err)` — never catch errors and manually `res.json()` inside middleware.
- Never use `throw` inside synchronous callbacks that cannot be caught by a Promise chain (e.g., legacy `jwt.verify(token, secret, callback)`) — use synchronous methods with `try/catch`.

### Response Formatting

- `res.success()` and `res.failure()` are the only official response methods — do not introduce alternative response formats.
- The response format must not change: `{ status, data, error }` — this is a public contract.

### Dependencies

- Do not bundle dependencies into `dist/` — all dependencies must be declared in the `external` array in `tsup.config.ts`.
- Any new dependency must be added to `dependencies` in `package.json` **and** `external` in `tsup.config.ts`.
- Do not add external dependencies when built-in Node.js modules can fulfill the requirement.

### TypeScript

- Avoid `as any` and `as unknown as X` — use proper type guards or generics.
- `process.env.*` is always a `string` at runtime — declare it as `string` in `express.d.ts`, not `number`.
- Strict mode is enabled (`strict: true`) with no exceptions.

---

## Adding New Features

### Adding a New Middleware

Checklist to complete:

```
[ ] src/middlewares/<name>/index.ts   — implementation
[ ] src/middlewares/<name>/types.ts   — types & interfaces (if any)
[ ] src/middlewares/index.ts          — add re-export
[ ] src/index.ts                      — add re-export
[ ] tsup.config.ts                    — add entry point
[ ] package.json (exports)            — add subpath export
[ ] Test or example in example/       — verify behavior
```

### New Subpath Export in `package.json`

```json
"./middlewares/<name>": {
  "import": {
    "types": "./dist/middlewares/<name>/index.d.ts",
    "default": "./dist/middlewares/<name>/index.js"
  },
  "require": {
    "types": "./dist/middlewares/<name>/index.d.cts",
    "default": "./dist/middlewares/<name>/index.cjs"
  }
}
```

---

## Build & Verification

After every change, execute the following commands in sequence:

```bash
yarn typecheck    # Must have 0 errors
yarn test         # Must all pass
yarn build        # Must succeed without critical errors
npm pack --dry-run # Verify files included in the package
```

Expected build output:
- `dist/*.js` — ESM
- `dist/*.cjs` — CommonJS
- `dist/*.d.ts` + `dist/*.d.cts` — Type declarations
- **No** `*.map` files — sourcemaps are disabled to keep package size minimal.

---

## Prohibited Actions

| Action | Reason |
|---|---|
| Modifying the `{ status, data, error }` format | Breaking change for all consumers |
| Importing from `express`, `zod`, etc. in public API docs/examples | Users should import everything directly from the SDK |
| Using `export default` alongside named exports | CJS warnings, forces consumers to use `.default` |
| Hardcoding `process.env.*` inside middlewares | Untestable, inflexible |
| Bundling dependencies into `dist/` | Code duplication, version conflicts |
| Committing `.DS_Store` or OS-specific files | Repository noise |
| Using `throw` inside sync callbacks of async functions | Errors bypass the Promise rejection chain |
| Using raw `res.json()` / `res.send()` in route handlers | Bypasses consistent response formatting |

---

## Reference File Structure

```
src/
├── index.ts                     # ← Main entry point, all public exports reside here
├── app/
│   ├── index.ts                 # ExpressApp, createApp(), re-exported express types
│   ├── async-handler.ts         # asyncHandler()
│   └── types.ts                 # AppOptions, BodyParserOptions
├── config/
│   ├── index.ts                 # loadConfig()
│   └── env.ts                   # envSchema (Zod)
├── middlewares/
│   ├── index.ts                 # Re-exports all middlewares
│   ├── auth/                    # JWT + bcrypt
│   ├── error/                   # notFoundHandler, errorHandler
│   ├── logger/                  # Winston logger instance
│   ├── upload/                  # Multer upload helpers
│   └── validate/                # validate() + ValidationSchemas
└── types/
    ├── index.ts                 # Re-exports all global types
    └── express.d.ts             # Augmentations: req.user, res.success/failure, app.register/run
```
