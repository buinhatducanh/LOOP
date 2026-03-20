import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? (() => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL is not set yet!");
  }

  // Neon serverless: connection pooler at the edge
  // pool_max_conns defaults to NUMCPUS (up to 9) — keep it modest for serverless
  const pool = new Pool({
    connectionString: connectionString || "",
    max: 5,                    // Max connections per instance (was unlimited → can exhaust pooler)
    idleTimeoutMillis: 30_000, // Close idle connections after 30s (Neon closes after 10min)
    connectionTimeoutMillis: 10_000, // Fail fast if can't connect within 10s
  });

  // Log connection events in development
  if (process.env.NODE_ENV !== "production") {
    pool.on("connect", () => {
      // console.debug("[prisma] new pool connection");
    });
    pool.on("error", (err) => {
      console.error("[prisma] pool error:", err.message);
    });
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
})();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
