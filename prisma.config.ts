import { config } from "dotenv";
import { defineConfig } from "prisma/config";

const env = config({ override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env.parsed?.DATABASE_URL || process.env["DATABASE_URL"],
  },
});
