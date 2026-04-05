import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Lazy initialization — do NOT call PrismaClient at module load time.
// Next.js loads env vars AFTER module initialization, so any top-level code
// that runs during import will see undefined process.env values in some setups.
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Make sure .env.local exists in the project root " +
      "and restart the dev server: npm run dev"
    );
  }
  // @prisma/adapter-neon v7.4.2 — PrismaNeonHttp uses direct HTTP connection string
  // No pg Pool needed — ~50ms cold start vs pg Pool's ~500ms
  // Works with Neon direct compute endpoint (no pooler required)
  const adapter = new PrismaNeonHttp(connectionString, { fullResults: false });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

// In development, share a single PrismaClient instance across hot reloads.
// In production (Vercel), each serverless invocation gets its own instance.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
