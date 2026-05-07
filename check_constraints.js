const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_5TfHtjP6JcyG@ep-round-cherry-a1852lvb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function main() {
  await client.connect();
  
  const res = await client.query(`
    SELECT
        conname as constraint_name,
        pg_get_constraintdef(c.oid) as constraint_definition
    FROM
        pg_constraint c
    JOIN
        pg_class t ON t.oid = c.conrelid
    WHERE
        t.relname = 'service_tiers'
  `);
  console.log("CONSTRAINTS ON service_tiers:");
  console.table(res.rows);
  
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
