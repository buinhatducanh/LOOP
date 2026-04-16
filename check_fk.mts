import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });

async function main() {
 // Check FK columns referencing team_members
 const fks = await pool.query(`
 SELECT DISTINCT
 kcu.table_name,
 kcu.column_name
 FROM information_schema.table_constraints AS tc
 JOIN information_schema.key_column_usage AS kcu
 ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
 JOIN information_schema.constraint_column_usage AS ccu
 ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
 WHERE tc.constraint_type = 'FOREIGN KEY'
 AND ccu.table_name = 'team_members'
 ORDER BY kcu.table_name
 `);
 console.log("=== FK references to team_members ===");
 fks.rows.forEach(r => {
 console.log(` ${r.table_name}.${r.column_name} -> team_members.${r.foreign_column_name}`);
 });
}

main().catch(console.error).finally(() => { pool.end(); process.exit(0); });
