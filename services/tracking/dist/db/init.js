"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("./client");
async function applyMigration(filePath) {
    const sql = fs_1.default.readFileSync(filePath, "utf8");
    await client_1.pool.query(sql);
}
async function runMigrations() {
    const migrationsDir = path_1.default.join(__dirname, "migrations");
    const files = fs_1.default
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();
    for (const file of files) {
        const filePath = path_1.default.join(migrationsDir, file);
        try {
            await applyMigration(filePath);
            console.log(`✓ Applied migration ${file}`);
        }
        catch (error) {
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
