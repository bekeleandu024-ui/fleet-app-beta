const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function fixOldIdConstraint() {
  try {
    console.log('🔧 Making old_id column nullable...\n');
    
    await pool.query('ALTER TABLE orders ALTER COLUMN old_id DROP NOT NULL');
    
    console.log('✅ Success! old_id is now nullable for new orders.');
    console.log('   Existing orders retain their old_id values.');
    console.log('   New orders can be created without old_id.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixOldIdConstraint();
