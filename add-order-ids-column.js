const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function addColumn() {
  try {
    await pool.query(`
      ALTER TABLE trips 
      ADD COLUMN IF NOT EXISTS order_ids uuid[] DEFAULT ARRAY[]::uuid[]
    `);
    console.log('✅ Added order_ids column to trips table');
    
    // Update existing trips to include order_id in order_ids array
    await pool.query(`
      UPDATE trips 
      SET order_ids = ARRAY[order_id]::uuid[] 
      WHERE order_id IS NOT NULL AND (order_ids IS NULL OR array_length(order_ids, 1) IS NULL)
    `);
    console.log('✅ Migrated existing order_id values to order_ids array');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addColumn();
