import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

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

  // PrismaNeon (WebSocket pooler mode) — supports prisma.$transaction.
  // Requires Neon pooler endpoint (ep-xxx-pooler.ap-southeast-1.aws.neon.tech).
  // Pool from @neondatabase/serverless manages connections internally.
  // @ts-ignore: PoolConfig type mismatch between @neondatabase/serverless Pool
  // and SqlDriverAdapterFactory expectation — runtime accepts Pool instance fine.
  const pool = new Pool({ connectionString, max: 10 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

// In development, share a single PrismaClient instance across hot reloads.
// In production (Vercel), each serverless invocation gets its own instance.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
