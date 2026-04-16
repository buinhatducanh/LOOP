import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });

const slugs = [
 "rin-nakamura", "haru-tanaka", "vu-dinh-trong", "kai-tanaka",
 "ryo-hashimoto", "yuna-park", "akira-sato", "tran-huu-phuc",
 "shin-watanabe", "mei-lin", "quynh-hr", "tran-thi-media",
 "nguyen-van-seo", "bi-nht-c-anh"
];

async function main() {
 // Get member IDs
 const members = await pool.query(
 `SELECT id, slug, name FROM team_members WHERE slug = ANY($1)`,
 [slugs]
 );
 console.log("Found members:", members.rows.map(r => `${r.name} (${r.slug}) = ${r.id}`));

 if (members.rows.length === 0) { console.log("No members found!"); return; }
 const ids = members.rows.map(r => r.id);

 // Check RESTRICT tables for data
 const restrictTables = [
 ["blog_posts", "author_id"],
 ["bug_notes", "author_id"],
 ["daily_standups", "member_id"],
 ["lp_awards", "member_id"],
 ["lp_redemptions", "member_id"],
 ["lp_transactions", "member_id"],
 ["off_system_splits", "member_id"],
 ["referral_codes", "member_id"],
 ["sales_commission_events", "sales_rep_id"],
 ];

 console.log("\n=== Checking RESTRICT table data ===");
 for (const [table, col] of restrictTables) {
 const result = await pool.query(
 `SELECT COUNT(*) FROM ${table} WHERE ${col} = ANY($1)`,
 [ids]
 );
 const count = parseInt(result.rows[0].count);
 console.log(` ${table}.${col}: ${count} rows`);
 }

 // Check task_kanban (no FK constraint)
 const tk = await pool.query(
 `SELECT COUNT(*) FROM task_kanban WHERE assignee_id = ANY($1)`,
 [ids]
 );
 console.log(` task_kanban.assignee_id: ${parseInt(tk.rows[0].count)} rows`);

 // Check users
 const users = await pool.query(
 `SELECT COUNT(*) FROM users WHERE team_member_id = ANY($1)`,
 [ids]
 );
 console.log(` users.team_member_id: ${parseInt(users.rows[0].count)} rows`);
}

main().catch(console.error).finally(() => { pool.end(); process.exit(0); });
