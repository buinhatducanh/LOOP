const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_5TfHtjP6JcyG@ep-round-cherry-a1852lvb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  const res = await client.query("SELECT id, name, market_price, lp_reward FROM service_tiers WHERE id = 'cmollcma800083guy7qctvqiz'");
  console.log("TIER DATA:");
  console.table(res.rows);
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
