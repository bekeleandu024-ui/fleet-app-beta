import fs from "fs";
import path from "path";
import { pool } from "./client";

export async function runMigrations() {
  // Create migrations tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    // Check if migration has already been applied
    const { rows } = await pool.query(
      'SELECT filename FROM schema_migrations WHERE filename = $1',
      [file]
    );

    if (rows.length > 0) {
      console.log(`⊘ ${file} already applied, skipping`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");
    
    console.log(`Running migration: ${file}`);
    
    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      await pool.query('COMMIT');
      console.log(`✓ Applied migration ${file}`);
    } catch (error) {
      await pool.query('ROLLBACK');
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
