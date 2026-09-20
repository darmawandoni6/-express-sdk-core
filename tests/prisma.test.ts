import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { Router, asyncHandler, createApp } from "../src";
import { createPrismaClient, isPrismaError, mapPrismaError, prismaMiddleware } from "../src/prisma";

describe("Prisma Error Handling & Duck-Typing", () => {
  it("should correctly identify Prisma error shapes via isPrismaError", () => {
    expect(isPrismaError({ name: "PrismaClientKnownRequestError", code: "P2002" })).toBe(true);
    expect(isPrismaError({ code: "P2025" })).toBe(true);
    expect(isPrismaError({ name: "PrismaClientValidationError" })).toBe(true);
    expect(isPrismaError(new Error("Generic error"))).toBe(false);
    expect(isPrismaError(null)).toBe(false);
    expect(isPrismaError("string error")).toBe(false);
  });

  it("should map P2002 unique constraint errors to 409 Conflict", () => {
    const error = {
      name: "PrismaClientKnownRequestError",
      code: "P2002",
      meta: { target: ["email"] },
    };

    const mapped = mapPrismaError(error);
    expect(mapped).toEqual({
      status: 409,
      code: "CONFLICT",
      message: "Unique constraint failed on field(s): email",
      details: { target: ["email"] },
    });
  });

  it("should map P2025 record not found errors to 404 Not Found", () => {
    const error = {
      name: "PrismaClientKnownRequestError",
      code: "P2025",
      meta: { cause: "Record to update not found." },
    };

    const mapped = mapPrismaError(error);
    expect(mapped).toEqual({
      status: 404,
      code: "NOT_FOUND",
      message: "Record to update not found.",
      details: { cause: "Record to update not found." },
    });
  });

  it("should map P2003 foreign key violation to 400 Bad Request", () => {
    const error = {
      name: "PrismaClientKnownRequestError",
      code: "P2003",
      meta: { field_name: "authorId" },
    };

    const mapped = mapPrismaError(error);
    expect(mapped).toEqual({
      status: 400,
      code: "FOREIGN_KEY_VIOLATION",
      message: "Foreign key constraint failed on field: authorId",
      details: { field_name: "authorId" },
    });
  });

  it("should map PrismaClientValidationError to 400 Bad Request", () => {
    const error = {
      name: "PrismaClientValidationError",
      message: "Invalid field in query",
    };

    const mapped = mapPrismaError(error);
    expect(mapped?.status).toBe(400);
    expect(mapped?.code).toBe("VALIDATION_ERROR");
  });

  it("should map PrismaClientInitializationError to 503 Service Unavailable", () => {
    const error = {
      name: "PrismaClientInitializationError",
      message: "Can't reach database",
    };

    const mapped = mapPrismaError(error);
    expect(mapped?.status).toBe(503);
    expect(mapped?.code).toBe("DATABASE_UNAVAILABLE");
  });
});

describe("Prisma Middleware & Request Context", () => {
  it("should attach prisma instance to req.prisma", async () => {
    const mockPrisma = { mock: true, $connect: vi.fn(), $disconnect: vi.fn() };
    const app = createApp({ logger: false });
    app.use(prismaMiddleware(mockPrisma as any));

    const router = Router();
    router.get(
      "/test-prisma-req",
      asyncHandler(async (req, res) => {
        return res.success({ hasPrisma: Boolean(req.prisma), mock: req.prisma.mock });
      })
    );
    app.register(router);

    const response = await request(app).get("/test-prisma-req");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ hasPrisma: true, mock: true });
  });
});

describe("Prisma Client Factory", () => {
  it("should initialize client and handle lifecycle options", async () => {
    const mockConnect = vi.fn().mockResolvedValue(undefined);
    const mockDisconnect = vi.fn().mockResolvedValue(undefined);
    const mockOn = vi.fn();

    const mockClient = {
      $connect: mockConnect,
      $disconnect: mockDisconnect,
      $on: mockOn,
    };

    const client = createPrismaClient(mockClient, {
      eagerConnect: true,
      logConnection: false,
      enableShutdownHook: false,
      logQueries: true,
    });

    expect(client).toBe(mockClient);
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledWith("query", expect.any(Function));
  });
});

describe("Global Error Handler Integration with Prisma Errors", () => {
  it("should format Prisma P2002 error in standard res.failure format", async () => {
    const app = createApp({ logger: false });
    const router = Router();

    router.post(
      "/trigger-p2002",
      asyncHandler(async () => {
        const error = new Error("Unique constraint failed");
        (error as any).name = "PrismaClientKnownRequestError";
        (error as any).code = "P2002";
        (error as any).meta = { target: ["email"] };
        throw error;
      })
    );

    app.register(router);
    const { errorHandler } = await import("../src");
    app.use(errorHandler);

    const response = await request(app).post("/trigger-p2002");

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      status: 409,
      data: null,
      error: {
        code: "CONFLICT",
        message: "Unique constraint failed on field(s): email",
        details: { target: ["email"] },
      },
    });
  });

  it("should format Prisma P2025 error as 404 in standard res.failure format", async () => {
    const app = createApp({ logger: false });
    const router = Router();

    router.get(
      "/trigger-p2025",
      asyncHandler(async () => {
        const error = new Error("Record not found");
        (error as any).name = "PrismaClientKnownRequestError";
        (error as any).code = "P2025";
        (error as any).meta = { cause: "No user found with ID" };
        throw error;
      })
    );

    app.register(router);
    const { errorHandler } = await import("../src");
    app.use(errorHandler);

    const response = await request(app).get("/trigger-p2025");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 404,
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "No user found with ID",
        details: { cause: "No user found with ID" },
      },
    });
  });
});
