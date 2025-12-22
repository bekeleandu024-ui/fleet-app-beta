const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkDriverProfilesColumns() {
  const client = await pool.connect();
  try {
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'driver_profiles'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 driver_profiles columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkDriverProfilesColumns();
