/**
 * Sync DB columns to match Prisma schema.
 * Adds missing columns (especially String[] arrays and i18n fields).
 */
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

interface Column {
  column_name: string;
}

async function getColumns(table: string): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<Column[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
    [table]
  );
  return rows.map((r) => r.column_name);
}

async function addColumn(table: string, column: string, sql: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS ${column} ${sql}`);
    console.log(`  ✓ ${table}.${column} added`);
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log(`  ✓ ${table}.${column} already exists`);
    } else {
      console.error(`  ✗ ${table}.${column} FAILED: ${e.message}`);
    }
  }
}

async function main() {
  try {
    console.log("Checking and syncing DB schema...\n");

    // ── services ────────────────────────────────────────────────────────────
    {
      const cols = await getColumns("services");
      const arr = cols.map((c) => `"${c}"`);
      console.log("services columns:", cols.length);

      const adds = [
        ["features", "TEXT[] DEFAULT '{}'"],
        ["technologies", "TEXT[] DEFAULT '{}'"],
        ["features_en", "TEXT[] DEFAULT '{}'"],
        ["features_ja", "TEXT[] DEFAULT '{}'"],
        ["features_ko", "TEXT[] DEFAULT '{}'"],
        ["features_zh", "TEXT[] DEFAULT '{}'"],
        ["technologies_en", "TEXT[] DEFAULT '{}'"],
        ["technologies_ja", "TEXT[] DEFAULT '{}'"],
        ["technologies_ko", "TEXT[] DEFAULT '{}'"],
        ["technologies_zh", "TEXT[] DEFAULT '{}'"],
      ];
      for (const [col, sql] of adds) {
        if (!cols.includes(col)) await addColumn("services", `"${col}"`, sql);
        else console.log(`  ✓ services.${col} ok`);
      }
    }

    // ── projects ──────────────────────────────────────────────────────────
    {
      const cols = await getColumns("projects");
      console.log("\nprojects columns:", cols.length);

      const adds = [
        ["tech_stack", "TEXT[] DEFAULT '{}'"],
        ["tech_stack_en", "TEXT[] DEFAULT '{}'"],
        ["tech_stack_ja", "TEXT[] DEFAULT '{}'"],
        ["tech_stack_ko", "TEXT[] DEFAULT '{}'"],
        ["tech_stack_zh", "TEXT[] DEFAULT '{}'"],
        ["features", "TEXT[] DEFAULT '{}'"],
        ["features_en", "TEXT[] DEFAULT '{}'"],
        ["features_ja", "TEXT[] DEFAULT '{}'"],
        ["features_ko", "TEXT[] DEFAULT '{}'"],
        ["features_zh", "TEXT[] DEFAULT '{}'"],
        ["title_en", "TEXT"],
        ["title_ja", "TEXT"],
        ["title_ko", "TEXT"],
        ["title_zh", "TEXT"],
      ];
      for (const [col, sql] of adds) {
        if (!cols.includes(col)) await addColumn("projects", `"${col}"`, sql);
        else console.log(`  ✓ projects.${col} ok`);
      }
    }

    // ── courses ───────────────────────────────────────────────────────────
    {
      const cols = await getColumns("courses");
      console.log("\ncourses columns:", cols.length);

      const adds = [
        ["title_en", "TEXT"],
        ["title_ja", "TEXT"],
        ["title_ko", "TEXT"],
        ["title_zh", "TEXT"],
        ["description_en", "TEXT"],
        ["description_ja", "TEXT"],
        ["description_ko", "TEXT"],
        ["description_zh", "TEXT"],
      ];
      for (const [col, sql] of adds) {
        if (!cols.includes(col)) await addColumn("courses", `"${col}"`, sql);
        else console.log(`  ✓ courses.${col} ok`);
      }
    }

    // ── testimonials ─────────────────────────────────────────────────────
    {
      const cols = await getColumns("testimonials");
      console.log("\ntestimonials columns:", cols.length);

      const adds = [
        ["text_en", "TEXT"],
        ["text_ja", "TEXT"],
        ["text_ko", "TEXT"],
        ["text_zh", "TEXT"],
        ["role_en", "TEXT"],
        ["role_ja", "TEXT"],
        ["role_ko", "TEXT"],
        ["role_zh", "TEXT"],
        ["company_en", "TEXT"],
        ["company_ja", "TEXT"],
        ["company_ko", "TEXT"],
        ["company_zh", "TEXT"],
      ];
      for (const [col, sql] of adds) {
        if (!cols.includes(col)) await addColumn("testimonials", `"${col}"`, sql);
        else console.log(`  ✓ testimonials.${col} ok`);
      }
    }

    // ── home_sliders ──────────────────────────────────────────────────────
    {
      const cols = await getColumns("home_sliders");
      console.log("\nhome_sliders columns:", cols.length);

      const adds = [
        ["title_en", "TEXT"],
        ["title_ja", "TEXT"],
        ["title_ko", "TEXT"],
        ["title_zh", "TEXT"],
        ["subtitle_en", "TEXT"],
        ["subtitle_ja", "TEXT"],
        ["subtitle_ko", "TEXT"],
        ["subtitle_zh", "TEXT"],
      ];
      for (const [col, sql] of adds) {
        if (!cols.includes(col)) await addColumn("home_sliders", `"${col}"`, sql);
        else console.log(`  ✓ home_sliders.${col} ok`);
      }
    }

    console.log("\n✅ DB sync complete!");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
