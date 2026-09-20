import { PrismaClient } from "@prisma/client";

import { createPrismaClient } from "../../src/prisma";

// Inisialisasi Prisma client menggunakan helper dari SDK
export const prisma = createPrismaClient(
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  }),
  {
    logConnection: true,
    logQueries: true,
    enableShutdownHook: true,
  }
);
