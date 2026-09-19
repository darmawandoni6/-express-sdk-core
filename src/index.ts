// App Factory & Core
export { asyncHandler, createApp, CreateApp, ExpressApp } from "./app";
export type { AppOptions, BodyParserOptions, CorsConfig } from "./app";

// Express & Router
export { default as express, Router } from "express";
export type {
  Application,
  CookieOptions,
  Errback,
  ErrorRequestHandler,
  Handler,
  IRoute,
  IRouter,
  IRouterHandler,
  IRouterMatcher,
  MediaType,
  NextFunction,
  Request,
  RequestHandler,
  RequestParamHandler,
  Response,
  Send,
} from "express";

// Validation & Zod
export { z } from "zod";
export type {
  infer as zInfer,
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodDefault,
  ZodEffects,
  ZodEnum,
  ZodError,
  ZodFunction,
  ZodIntersection,
  ZodLazy,
  ZodLiteral,
  ZodMap,
  ZodNativeEnum,
  ZodNever,
  ZodNull,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodPromise,
  ZodRecord,
  ZodSchema,
  ZodSet,
  ZodString,
  ZodSymbol,
  ZodTuple,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  ZodUndefined,
  ZodUnion,
  ZodUnknown,
  ZodVoid,
} from "zod";

// HTTP Errors
export { default as createHttpError, HttpError, isHttpError } from "http-errors";

// Middlewares
export * from "./middlewares/auth";
export * from "./middlewares/error";
export * from "./middlewares/logger";
export * from "./middlewares/upload";
export * from "./middlewares/validate";

// Configuration & Environment
export { envSchema, loadConfig } from "./config";
export type { Env, LoadConfigOptions } from "./config";

// Global Types
export * from "./types";
