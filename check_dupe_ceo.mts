import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });

async function main() {
 // Check for Bùi Nhật Đức Anh entries
 const members = await pool.query(`
 SELECT id, slug, name, level, rank, image, is_active
 FROM team_members
 WHERE name LIKE '%Đức Anh%' OR name LIKE '%Bùi%'
 ORDER BY created_at
 `);
 console.log("CEO entries:", members.rows.map(r =>
 `${r.name} | slug=${r.slug} | lv=${r.level} | rank=${r.rank} | img=${r.image ? 'YES' : 'NO'} | active=${r.is_active}`
 ));

 // Check which slug `bi-nht-c-anh` might be under now
 const corrupt = await pool.query(`SELECT * FROM team_members WHERE slug = 'bi-nht-c-anh'`);
 console.log("\nbi-nht-c-anh:", corrupt.rows);

 // Show ALL active members
 const all = await pool.query(`
 SELECT slug, name, level, rank, image, is_active
 FROM team_members
 WHERE is_active = true
 ORDER BY level DESC NULLS LAST
 `);
 console.log("\n=== ALL active members (" + all.rows.length + ") ===");
 all.rows.forEach(r => console.log(` ${r.name} | slug=${r.slug} | lv=${r.level}`));
}

main().catch(console.error).finally(() => { pool.end(); process.exit(0); });
