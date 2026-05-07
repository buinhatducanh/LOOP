const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_5TfHtjP6JcyG@ep-round-cherry-a1852lvb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  console.log("Updating...");
  const res = await client.query("UPDATE service_tiers SET sort_order = 1 WHERE id = 'cmollcma800083guy7qctvqiz'");
  console.log("Result:", res.rowCount);
  await client.end();
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
