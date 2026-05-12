import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
 const connectionString = process.env.DATABASE_URL;
 if (!connectionString) {
 throw new Error(
 "DATABASE_URL is not set. Make sure .env.local exists in the project root " +
 "and restart the dev server: npm run dev"
 );
 }

 // PrismaPg requires pg.Pool from pg@8. Cast needed because @prisma/adapter-pg
 // bundles its own @types/pg@8.11 while the project uses @types/pg@8.20+.
 const pool = new Pool({ connectionString });
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const adapter = new PrismaPg(pool as any);
 return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
 globalForPrisma.prisma ?? createPrismaClient();

// In development, share a single PrismaClient instance across hot reloads.
// In production (Vercel), each serverless invocation gets its own instance.
if (process.env.NODE_ENV !== "production") {
 globalForPrisma.prisma = prisma;
}
