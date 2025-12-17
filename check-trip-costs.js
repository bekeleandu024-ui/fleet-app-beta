const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkTripCosts() {
  try {
    const client = await pool.connect();
    try {
      const resType = await client.query(`
        SELECT column_name, data_type, numeric_precision, numeric_scale 
        FROM information_schema.columns 
        WHERE table_name = 'trip_costs'
      `);
      console.log('trip_costs columns:', resType.rows);

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTripCosts();
