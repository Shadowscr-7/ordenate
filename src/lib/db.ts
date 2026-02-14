// ============================================================
// Prisma Client — Singleton for Next.js
// ============================================================
// Prevents multiple instances in development due to hot reload.
// Optimized for performance with connection pooling.
// ============================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use direct connection in development for better reliability
const databaseUrl = process.env.NODE_ENV === "development" 
  ? process.env.DIRECT_URL 
  : process.env.DATABASE_URL;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
