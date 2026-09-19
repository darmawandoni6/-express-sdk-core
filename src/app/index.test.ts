import request from "supertest";
import { describe, expect, it } from "vitest";

import { ExpressApp, Router, createApp } from "./index";

describe("createApp & ExpressApp", () => {
  it("should create independent application instances", () => {
    const app1 = createApp();
    const app2 = createApp();

    expect(app1).not.toBe(app2);
  });

  it("should provide working /health endpoint", async () => {
    const app = createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(200);
    expect(res.body.data.message).toBe("OK");
    expect(res.body.data.time).toBeDefined();
  });

  it("should format success responses via res.success", async () => {
    const app = createApp();
    const router = Router();
    router.get("/test", (_req, res) => {
      return res.success({ user: "alice" }, 201);
    });

    app.register(router);

    const res = await request(app).get("/test");
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      status: 201,
      data: { user: "alice" },
      error: null,
    });
  });

  it("should format failure responses via res.failure with correct status code", async () => {
    const app = createApp();
    const router = Router();
    router.get("/error-test", (_req, res) => {
      return res.failure({ code: "BAD_INPUT", message: "Invalid payload" }, 422);
    });

    app.register(router);

    const res = await request(app).get("/error-test");
    expect(res.status).toBe(422);
    expect(res.body).toEqual({
      status: 422,
      data: null,
      error: { code: "BAD_INPUT", message: "Invalid payload" },
    });
  });

  it("should register routes with and without prefix", async () => {
    const app = createApp();
    const r1 = Router();
    r1.get("/ping", (_req, res) => res.success("pong v1"));

    const r2 = Router();
    r2.get("/ping", (_req, res) => res.success("pong v2"));

    app.register(r1, "/v1");
    app.register([r2], "/v2");

    const res1 = await request(app).get("/v1/ping");
    expect(res1.status).toBe(200);
    expect(res1.body.data).toBe("pong v1");

    const res2 = await request(app).get("/v2/ping");
    expect(res2.status).toBe(200);
    expect(res2.body.data).toBe("pong v2");
  });

  it("should enable default security headers, cors, and body parsers when called with no config", async () => {
    const app = createApp();
    const router = Router();

    router.post("/body-test", (req, res) => {
      res.success(req.body);
    });

    app.register(router);

    // 1. Check Helmet and CORS headers
    const healthRes = await request(app).get("/health");
    expect(healthRes.headers["x-content-type-options"]).toBe("nosniff");
    expect(healthRes.headers["access-control-allow-origin"]).toBe("*");

    // 2. Check JSON body parser
    const jsonRes = await request(app).post("/body-test").send({ name: "Alice" });
    expect(jsonRes.status).toBe(200);
    expect(jsonRes.body.data).toEqual({ name: "Alice" });

    // 3. Check URL-encoded body parser
    const formRes = await request(app).post("/body-test").type("form").send({ role: "admin" });
    expect(formRes.status).toBe(200);
    expect(formRes.body.data).toEqual({ role: "admin" });
  });
});
