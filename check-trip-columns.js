const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkTripColumns() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking trips table structure...\n');
    
    // Get column names
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trips'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Trips table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check a sample trip
    const sample = await client.query(`
      SELECT id, driver_id, driver_name, unit_id, unit_number
      FROM trips
      WHERE driver_id IS NOT NULL
      LIMIT 1
    `);
    
    console.log('\n📝 Sample trip data:');
    if (sample.rows.length > 0) {
      console.log(JSON.stringify(sample.rows[0], null, 2));
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkTripColumns();
