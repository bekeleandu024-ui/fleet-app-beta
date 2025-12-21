const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkStructure() {
  try {
    // List tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

    // Check trips table structure
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'trips'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Trips Table Structure:\n');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}`);
      console.log(`    Type: ${col.data_type}`);
      console.log(`    Nullable: ${col.is_nullable}`);
      console.log(`    Default: ${col.column_default}\n`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkStructure();
