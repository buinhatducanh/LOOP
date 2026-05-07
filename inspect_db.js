const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_5TfHtjP6JcyG@ep-round-cherry-a1852lvb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  console.log("Connected to DB");
  
  const res = await client.query("SELECT id, tier_level, name, sort_order FROM service_tiers WHERE service_key = 'seo' ORDER BY tier_level ASC");
  console.log("SEO TIERS:");
  console.table(res.rows);
  
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
