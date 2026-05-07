const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const indexes = await prisma.$queryRaw`
    SELECT
        t.relname as table_name,
        i.relname as index_name,
        a.attname as column_name
    FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
    WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = 'service_tiers'
    ORDER BY
        t.relname,
        i.relname;
  `;
  console.log("INDEXES ON service_tiers:");
  console.log(JSON.stringify(indexes, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
