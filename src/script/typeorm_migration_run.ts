import { dataSourceOptions } from "@/config/database.config";
import { DataSource } from "typeorm";

async function runMigrations() {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    const migrations = await dataSource.runMigrations();
    console.log(`Applied ${migrations.length} migration(s).`);
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

runMigrations().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
