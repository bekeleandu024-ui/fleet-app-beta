"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const client_1 = require("./client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runMigrations() {
    const migrationFile = path.join(__dirname, "migrations", "001_create_dispatches_table.sql");
    try {
        const sql = fs.readFileSync(migrationFile, "utf8");
        await client_1.pool.query(sql);
        console.log("✓ Database migrations completed successfully");
    }
    catch (error) {
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
