import fs from "fs";
import path from "path";
import { pool } from "./client";

async function applyMigration(filePath: string) {
  const sql = fs.readFileSync(filePath, "utf8");
  await pool.query(sql);
}

export async function runMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    try {
      await applyMigration(filePath);
      console.log(`✓ Applied migration ${file}`);
    } catch (error) {
      console.error(`✗ Failed migration ${file}`, error);
      throw error;
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migrations complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration error", error);
      process.exit(1);
    });
}
