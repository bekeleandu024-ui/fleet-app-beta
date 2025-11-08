import { pool } from "./client";
import * as fs from "fs";
import * as path from "path";

export async function runMigrations() {
  const migrationFile = path.join(__dirname, "migrations", "001_create_dispatches_table.sql");
  
  try {
    const sql = fs.readFileSync(migrationFile, "utf8");
    await pool.query(sql);
    console.log("✓ Database migrations completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migrations complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration error:", error);
      process.exit(1);
    });
}
