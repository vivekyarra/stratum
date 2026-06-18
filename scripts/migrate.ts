import { readFile } from "fs/promises";
import path from "path";
import { loadEnvConfig } from "@next/env";
import { closeAurora, hasAuroraConfig, queryAurora } from "../lib/postgres";

loadEnvConfig(process.cwd());

async function main() {
  if (!hasAuroraConfig()) {
    throw new Error("Aurora is not configured. Set Data API ARNs or direct PostgreSQL credentials.");
  }

  const migrationPath = path.join(process.cwd(), "db", "001_init.sql");
  const migration = await readFile(migrationPath, "utf8");
  const statements = migration
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await queryAurora(statement);
  }

  await closeAurora();
  console.log(`Applied ${statements.length} Aurora migration statements.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
