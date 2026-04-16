import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });

async function main() {
 // Check quest_participants columns
 const qp = await pool.query(`
 SELECT column_name, data_type
 FROM information_schema.columns
 WHERE table_name = 'quest_participants'
 ORDER BY ordinal_position
 `);
 console.log("quest_participants columns:", qp.rows);

 // Check notifications columns
 const notif = await pool.query(`
 SELECT column_name
 FROM information_schema.columns
 WHERE table_name = 'notifications'
 ORDER BY ordinal_position
 `);
 console.log("\nnotifications columns:", notif.rows);

 // Check admin_notifications columns
 const adminNotif = await pool.query(`
 SELECT column_name
 FROM information_schema.columns
 WHERE table_name = 'admin_notifications'
 ORDER BY ordinal_position
 `);
 console.log("\nadmin_notifications columns:", adminNotif.rows);

 // Check backlogs columns
 const backlog = await pool.query(`
 SELECT column_name
 FROM information_schema.columns
 WHERE table_name = 'backlogs'
 ORDER BY ordinal_position
 `);
 console.log("\nbacklogs columns:", backlog.rows);

 // Check epics columns
 const epics = await pool.query(`
 SELECT column_name
 FROM information_schema.columns
 WHERE table_name = 'epics'
 ORDER BY ordinal_position
 `);
 console.log("\nepics columns:", epics.rows);

 // Check figma_demos columns
 const figma = await pool.query(`
 SELECT column_name
 FROM information_schema.columns
 WHERE table_name = 'figma_demos'
 ORDER BY ordinal_position
 `);
 console.log("\nfigma_demos columns:", figma.rows);

 // Check task_kanban columns
 const kanban = await pool.query(`
 SELECT column_name
 FROM information_schema.columns
 WHERE table_name = 'task_kanban'
 ORDER BY ordinal_position
 `);
 console.log("\ntask_kanban columns:", kanban.rows);
}

main().catch(console.error).finally(() => { pool.end(); process.exit(0); });
