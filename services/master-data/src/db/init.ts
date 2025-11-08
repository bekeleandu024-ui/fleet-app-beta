import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function runMigrations(pool: Pool): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    console.log(`✓ ${file} completed`);
  }
}
