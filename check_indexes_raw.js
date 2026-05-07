const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_5TfHtjP6JcyG@ep-round-cherry-a1852lvb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  
  const res = await client.query(`
    SELECT
        indexname as index_name,
        indexdef as index_definition
    FROM
        pg_indexes
    WHERE
        tablename = 'service_tiers'
  `);
  console.log("INDEXES ON service_tiers:");
  console.table(res.rows);
  
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
