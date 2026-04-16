import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./src/generated/prisma/client";

const rawUrl = process.env.DATABASE_URL ?? "";
const pool = new Pool({ connectionString: rawUrl });
const adapter = new PrismaPg({ connectionString: rawUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
 // Discover actual table names in public schema
 const tables = await pool.query(
 `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
 );
 console.log("=== Tables in public schema ===");
 tables.rows.forEach(r => console.log(" " + r.table_name));

 // Check TeamMember table name
 const teamMemberCheck = await pool.query(`SELECT 'team_members' as t`);
 console.log("\nTeamMember table check:", teamMemberCheck.rows[0].t);

 // Check users table
 const usersCheck = await pool.query(`SELECT 'users' as t`);
 console.log("Users table check:", usersCheck.rows[0].t);
}

main().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); process.exit(0); });
