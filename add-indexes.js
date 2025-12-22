// Quick script to add AI performance indexes to the database
const pool = require('./lib/db.ts').default;
const fs = require('fs');

async function addIndexes() {
  try {
    const sql = fs.readFileSync('add-ai-performance-indexes.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Database indexes created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating indexes:', err);
    process.exit(1);
  }
}

addIndexes();
