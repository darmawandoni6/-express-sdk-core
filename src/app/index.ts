import express, { type Application, type Request, type Router } from "express";

import cors from "cors";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";

import { errorHandler, notFoundHandler } from "../middlewares/error";
import { logger, stream } from "../middlewares/logger";
import type { AppOptions, BodyParserOptions } from "./types";

export * from "./async-handler";
export * from "./types";

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

export class ExpressApp {
  public readonly app: Application;
  private readonly configPort?: number;
  private finalized = false;

  constructor(options: AppOptions = {}) {
    this.app = express();
    this.configPort = options.port;
    this.initResponse();
    this.initMiddlewares(options);
  }

  private initResponse(): void {
    express.response.success = function <T>(data: T, status: number = 200) {
      return this.status(status).json({ status, data, error: null });
    };

    express.response.failure = function (error: unknown, status: number = 500) {
      const statusCode = status ?? (this.statusCode >= 400 ? this.statusCode : 500);
      return this.status(statusCode).json({ status: statusCode, error, data: null });
    };
  }

  private initMiddlewares(config: AppOptions): void {
    // 1. Helmet Security (Enabled by default unless explicitly set to false)
    if (config.helmet !== false) {
      const helmetOpts = typeof config.helmet === "object" ? config.helmet : undefined;
      this.app.use(helmet(helmetOpts));
    }

    // 2. CORS (Enabled by default unless explicitly set to false)
    if (config.cors !== false) {
      // Note: credentials: true is intentionally omitted for wildcard origin
      // because browsers reject credentialed requests to wildcard origins (CORS spec).
      // Users who need credentials must pass an explicit origin via config.cors.
      const corsOpts: cors.CorsOptions =
        typeof config.cors === "object" ? config.cors : { origin: "*" };
      this.app.use(cors(corsOpts));
    }

    // 3. Body Parsers (Enabled by default unless explicitly set to false)
    if (config.bodyParser !== false) {
      const bpOpts: BodyParserOptions = typeof config.bodyParser === "object" ? config.bodyParser : {};
      if (bpOpts.json !== false) {
        this.app.use(express.json({ limit: bpOpts.jsonLimit }));
      }
      if (bpOpts.urlencoded !== false) {
        this.app.use(express.urlencoded({ extended: bpOpts.urlEncodedExtended ?? true }));
      }
    }

    // 4. HTTP Request Logger (Enabled by default unless explicitly disabled or in test mode)
    if (config.logger !== false && process.env.NODE_ENV !== "test") {
      const skip = (req: Request) => req.path === "/health" || req.originalUrl === "/health";
      this.app.use(morgan("combined", { stream, skip }));
    }

    // 5. Default Health Check Endpoint
    this.app.get("/health", (_req, res) => {
      res.success({ message: "OK", time: new Date().toISOString() });
    });
  }

  public routes(routes: Router | Router[], prefix: string = ""): this {
    const routerList = Array.isArray(routes) ? routes : [routes];
    for (const route of routerList) {
      this.app.use(prefix, route);
    }
    return this;
  }

  public run(port?: number): http.Server {
    // Guard against double-registration of error handlers if run() is called more than once
    if (!this.finalized) {
      this.app.use(notFoundHandler);
      this.app.use(errorHandler);
      this.finalized = true;
    }

    const _port = Number(port ?? this.configPort ?? process.env.PORT ?? 8080);
    const server = http.createServer(this.app);

    server.listen(_port, () => {
      logger.info(`Server is running on port ${_port} at http://localhost:${_port}`);
    });

    return server;
  }
}

// Backward compatibility alias
export const CreateApp = ExpressApp;

export function createApp(config: AppOptions = {}): Application {
  const instance = new ExpressApp(config);
  const app = instance.app;

  app.register = (routes, prefix) => {
    instance.routes(routes, prefix);
  };

  app.run = (port?: number) => {
    return instance.run(port ?? config.port);
  };

  return app;
}
