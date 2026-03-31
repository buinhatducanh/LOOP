import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const BASE = "http://localhost:3000/api";

async function testLocale(locale: string) {
  const res = await fetch(`${BASE}/v1/courses?lang=${locale}&limit=2`);
  const json = await res.json() as { data: Array<{ id: string; title: string; titleVi: string; _localeUsed: string }> };
  console.log(`\n=== locale=${locale} (HTTP ${res.status}) ===`);
  json.data.slice(0, 2).forEach(c => {
    console.log(`  ${c.id}`);
    console.log(`    title     : ${c.title}`);
    console.log(`    titleVi   : ${c.titleVi}`);
    console.log(`    _localeUsed: ${c._localeUsed}`);
  });
}

async function main() {
  await testLocale("vi");
  await testLocale("en");
  await testLocale("ja");
  await testLocale("ko");
  await testLocale("zh");
}

main().catch(console.error);
