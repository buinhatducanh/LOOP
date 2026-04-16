import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL ?? "" });

async function main() {
 // Check admin_notifications recipient
 const notif = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_notifications' AND column_name LIKE '%recip%'`);
 console.log("admin_notifications recipient cols:", notif.rows);

 // Check backlogs assignee
 const backlog = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'backlogs' AND column_name LIKE '%assignee%'`);
 console.log("backlogs assignee cols:", backlog.rows);

 // Check epics member
 const epics = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'epics' AND column_name LIKE '%member%'`);
 console.log("epics member cols:", epics.rows);

 // Check figma_demos member
 const figma = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'figma_demos' AND column_name LIKE '%member%'`);
 console.log("figma_demos member cols:", figma.rows);

 // Check task_kanban assignee
 const kanban = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'task_kanban' AND column_name = 'assignee_id'`);
 console.log("task_kanban assignee_id:", kanban.rows);

 // Also check users.team_member_id
 const users = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE '%member%'`);
 console.log("users member cols:", users.rows);
}

main().catch(console.error).finally(() => { pool.end(); process.exit(0); });
