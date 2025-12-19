const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function runMigration() {
  console.log('Running Capacity Management Migration...');
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'add-capacity-fields.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
