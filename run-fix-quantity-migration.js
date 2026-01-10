// Migration script to fix order_accessorials quantity column type
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: fix-accessorials-quantity-type');
    
    // Change quantity column from INT to DECIMAL
    await client.query(`
      ALTER TABLE order_accessorials 
      ALTER COLUMN quantity TYPE DECIMAL(10, 2) USING quantity::DECIMAL(10, 2)
    `);
    console.log('✓ Changed quantity column type to DECIMAL(10, 2)');
    
    // Update default value
    await client.query(`
      ALTER TABLE order_accessorials 
      ALTER COLUMN quantity SET DEFAULT 1.0
    `);
    console.log('✓ Updated default value to 1.0');
    
    console.log('\n✅ Migration completed successfully!');
    console.log('The quantity column now supports decimal values like 1.5 hours for detention.');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
