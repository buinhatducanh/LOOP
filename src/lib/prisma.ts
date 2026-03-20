import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? (() => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is not set — Prisma will throw on first query.");
  }

  // Neon serverless uses WebSockets via @neondatabase/serverless.
  // This adapter is optimized for Vercel serverless (Edge + Node runtimes).
  // No connection pool management needed — Neon handles it at the pooler level.
  const sql = neon(connectionString || "");
  const adapter = new PrismaNeon(sql);

  return new PrismaClient({ adapter });
})();

// In development, share a single PrismaClient instance across hot reloads.
// In production (Vercel), each serverless invocation gets its own instance,
// so global caching is not needed (and is ignored).
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
