const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'});

async function check() {
  const client = await pool.connect();
  try {
    const r = await client.query(`
      SELECT 
        t.trip_number, 
        t.unit_id, 
        t.unit_number, 
        t.customer_id, 
        t.customer_name, 
        t.revenue, 
        d.driver_name,
        d.driver_type
      FROM trips t 
      LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id 
      WHERE t.trip_number = 'TRP-MJZIV31L'
    `);
    console.log('TRP-MJZIV31L after migration:');
    console.log(JSON.stringify(r.rows[0], null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}
check();
