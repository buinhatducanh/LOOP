import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Lazy initialization — do NOT call neon()/PrismaClient at module load time.
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
  // Use pg Pool — standard driver, no timing issues with env vars
  const pool = new Pool({ connectionString });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

// In development, share a single PrismaClient instance across hot reloads.
// In production (Vercel), each serverless invocation gets its own instance,
// so global caching is not needed (and is ignored).
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
