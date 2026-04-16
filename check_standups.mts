import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });

const slugs = [
 "rin-nakamura","haru-tanaka","vu-dinh-trong","kai-tanaka",
 "ryo-hashimoto","yuna-park","akira-sato","tran-huu-phuc",
 "shin-watanabe","mei-lin","quynh-hr","tran-thi-media","nguyen-van-seo"
];

async function main() {
 // Check daily_standups for old members
 const standups = await pool.query(`
 SELECT COUNT(*) FROM daily_standups ds
 JOIN team_members tm ON tm.id = ds.member_id
 WHERE tm.slug = ANY($1)
 `, [slugs]);
 console.log("daily_standups for old members:", parseInt(standups.rows[0].count));

 // Check lp_transactions for old members (show top offenders)
 const lp = await pool.query(`
 SELECT tm.name, tm.slug, COUNT(*) as cnt
 FROM lp_transactions lt
 JOIN team_members tm ON tm.id = lt.member_id
 WHERE tm.slug = ANY($1)
 GROUP BY tm.name, tm.slug
 ORDER BY cnt DESC
 `, [slugs]);
 console.log("\nLP transactions by old member:");
 lp.rows.forEach(r => console.log(` ${r.name} (${r.slug}): ${r.cnt}`));
 console.log("Total:", lp.rows.reduce((s, r) => s + parseInt(r.cnt), 0));

 // Also check which new members have lp_transactions
 const newMembers = await pool.query(`
 SELECT tm.name, tm.slug, COUNT(*) as cnt
 FROM lp_transactions lt
 JOIN team_members tm ON tm.id = lt.member_id
 WHERE tm.slug NOT IN (${slugs.map((_, i) => `$${i+1}`).join(",")})
 GROUP BY tm.name, tm.slug
 ORDER BY cnt DESC
 LIMIT 5
 `, slugs);
 console.log("\nLP transactions for new members (top 5):");
 newMembers.rows.forEach(r => console.log(` ${r.name}: ${r.cnt}`));
}

main().catch(console.error).finally(() => { pool.end(); process.exit(0); });
