import type { PrismaErrorResponse } from "./types";

interface PrismaErrorLike {
  name?: string;
  code?: string;
  meta?: Record<string, unknown>;
  message?: string;
}

/**
 * Checks whether an error is a Prisma error via structural duck-typing.
 * This ensures compatibility even if @prisma/client is not bundled at runtime.
 */
export function isPrismaError(err: unknown): err is PrismaErrorLike {
  if (typeof err !== "object" || err === null) {
    return false;
  }

  const candidate = err as PrismaErrorLike;
  const hasPrismaName = typeof candidate.name === "string" && candidate.name.startsWith("PrismaClient");
  const hasPrismaCode = typeof candidate.code === "string" && /^P\d{4}$/.test(candidate.code);

  return hasPrismaName || hasPrismaCode;
}

/**
 * Maps a Prisma error into a structured HTTP error response object.
 * Returns null if the error is not recognized as a Prisma error.
 */
export function mapPrismaError(err: unknown): PrismaErrorResponse | null {
  if (!isPrismaError(err)) {
    return null;
  }

  const { code, name, meta } = err;

  // 1. Prisma Client Known Request Errors (P-codes)
  switch (code) {
    case "P2002": {
      const target = meta?.target;
      const targetStr = Array.isArray(target) ? target.join(", ") : typeof target === "string" ? target : undefined;
      const message = targetStr
        ? `Unique constraint failed on field(s): ${targetStr}`
        : "A unique constraint violation occurred";
      return {
        status: 409,
        code: "CONFLICT",
        message,
        details: meta,
      };
    }

    case "P2025": {
      const cause = typeof meta?.cause === "string" ? meta.cause : "Record not found or already deleted";
      return {
        status: 404,
        code: "NOT_FOUND",
        message: cause,
        details: meta,
      };
    }

    case "P2001": {
      return {
        status: 404,
        code: "NOT_FOUND",
        message: "Record not found",
        details: meta,
      };
    }

    case "P2003": {
      const field = typeof meta?.field_name === "string" ? meta.field_name : undefined;
      const message = field ? `Foreign key constraint failed on field: ${field}` : "Foreign key constraint failed";
      return {
        status: 400,
        code: "FOREIGN_KEY_VIOLATION",
        message,
        details: meta,
      };
    }

    case "P2000": {
      const column = typeof meta?.column_name === "string" ? meta.column_name : undefined;
      const message = column
        ? `The provided value is too long for column: ${column}`
        : "The provided value is too long for the column";
      return {
        status: 400,
        code: "VALUE_TOO_LONG",
        message,
        details: meta,
      };
    }

    case "P2014": {
      return {
        status: 400,
        code: "RELATION_VIOLATION",
        message: "The change would violate a required relation",
        details: meta,
      };
    }

    default:
      break;
  }

  // 2. Prisma Client Validation Error
  if (name === "PrismaClientValidationError") {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid database query arguments or missing required fields",
      details: err.message,
    };
  }

  // 3. Prisma Client Initialization Error (Database unreachable / connection pool issue)
  if (name === "PrismaClientInitializationError") {
    return {
      status: 503,
      code: "DATABASE_UNAVAILABLE",
      message: "Unable to establish connection to database server",
      details: err.message,
    };
  }

  // 4. Prisma Client Rust Panic Error
  if (name === "PrismaClientRustPanicError") {
    return {
      status: 500,
      code: "DATABASE_PANIC",
      message: "Database engine encountered an unexpected panic",
      details: err.message,
    };
  }

  // 5. Fallback for any other Prisma known request error
  if (code && typeof code === "string" && code.startsWith("P")) {
    return {
      status: 400,
      code,
      message: err.message || "A database request error occurred",
      details: meta,
    };
  }

  return {
    status: 500,
    code: "DATABASE_ERROR",
    message: err.message || "An unexpected database error occurred",
  };
}
