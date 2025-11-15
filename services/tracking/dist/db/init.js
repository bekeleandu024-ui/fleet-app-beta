"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("./client");
async function runMigrations() {
    // Create migrations tracking table if it doesn't exist
    await client_1.pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
    const migrationsDir = path_1.default.join(__dirname, "migrations");
    const files = fs_1.default
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();
    for (const file of files) {
        // Check if migration has already been applied
        const { rows } = await client_1.pool.query('SELECT filename FROM schema_migrations WHERE filename = $1', [file]);
        if (rows.length > 0) {
            console.log(`⊘ ${file} already applied, skipping`);
            continue;
        }
        const filePath = path_1.default.join(migrationsDir, file);
        const sql = fs_1.default.readFileSync(filePath, "utf8");
        console.log(`Running migration: ${file}`);
        try {
            await client_1.pool.query('BEGIN');
            await client_1.pool.query(sql);
            await client_1.pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
            await client_1.pool.query('COMMIT');
            console.log(`✓ Applied migration ${file}`);
        }
        catch (error) {
            await client_1.pool.query('ROLLBACK');
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
