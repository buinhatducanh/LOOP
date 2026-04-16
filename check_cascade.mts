import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });

async function main() {
 // Check delete_rule for all FK references to team_members
 const fks = await pool.query(`
 SELECT
 tc.table_name,
 tc.constraint_name,
 kcu.column_name,
 ccu.column_name AS referenced_column,
 rc.delete_rule
 FROM information_schema.table_constraints AS tc
 JOIN information_schema.key_column_usage AS kcu
 ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
 JOIN information_schema.constraint_column_usage AS ccu
 ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
 JOIN information_schema.referential_constraints AS rc
 ON rc.constraint_name = tc.constraint_name
 AND rc.constraint_schema = tc.table_schema
 WHERE tc.constraint_type = 'FOREIGN KEY'
 AND ccu.table_name = 'team_members'
 ORDER BY tc.table_name
 `);
 console.log("=== FK references to team_members with delete_rule ===");
 fks.rows.forEach(r => {
 console.log(` ${r.table_name}.${r.column_name} -> team_members.${r.referenced_column} [${r.delete_rule}]`);
 });
}

main().catch(console.error).finally(() => { pool.end(); process.exit(0); });
