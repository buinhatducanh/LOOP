import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });

  const fixes = [
    { oldSlug: "nguyn-phc-thun", newSlug: "nguyen-phuc-thuan", dept: "pm", deptId: "cmo2wwx88007ywwjx72e1homd" },
    { oldSlug: "nguyn-trng-qu",  newSlug: "nguyen-trong-quy", dept: "engineering", deptId: "cmnr3jox900851ojx35jlheia" },
    { oldSlug: "trn-hong-anh",   newSlug: "tran-hoang-anh",  dept: "qc", deptId: "cmo2wwx72007xwwjxpf7eprkm" },
    { oldSlug: "trn-v-hng",      newSlug: "tran-vu-hung",    dept: "pm", deptId: "cmo2wwx88007ywwjx72e1homd" },
  ];

  for (const f of fixes) {
    const roleLevel = f.dept === "pm" ? 3 : 5;
    await pool.query(
      "UPDATE team_members SET slug=$1, department=$2, department_id=$3, role_level=$4 WHERE slug=$5",
      [f.newSlug, f.dept, f.deptId, roleLevel, f.oldSlug]
    );
    console.log("Fixed:", f.oldSlug, "->", f.newSlug, "(", f.dept, ")");
  }

  // Also fix the Quỳnh HR deptId (she's the only one in hr dept now)
  const hrDept = await pool.query("SELECT id FROM departments WHERE key='hr'");
  if (hrDept.rows[0]) {
    await pool.query("UPDATE team_members SET department_id=$1 WHERE department='hr'", [hrDept.rows[0].id]);
    console.log("Fixed Quỳnh HR departmentId");
  }

  await pool.end();
  console.log("Done");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
