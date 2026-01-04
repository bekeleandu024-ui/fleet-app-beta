const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'});

async function test() {
  const client = await pool.connect();
  try {
    // Test the updated query with driver/unit pairing
    const r = await client.query(`
      SELECT 
        t.trip_number, 
        COALESCE(d.driver_name, d2.driver_name) as driver_name,
        COALESCE(t.unit_number, u.unit_number) as unit_number, 
        t.customer_name, 
        t.revenue 
      FROM trips t 
      LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id 
      LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id 
      LEFT JOIN driver_profiles d2 ON u.driver_id = d2.driver_id 
      WHERE t.trip_number = 'TRP-MJZIV31L'
    `);
    console.log('TRP-MJZIV31L with updated query:');
    console.log(JSON.stringify(r.rows[0], null, 2));
    
    // Verify customers table column rename
    const c = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' AND column_name IN ('name', 'customer_name')`);
    console.log('\nCustomers table column check:');
    console.log('Columns found:', c.rows.map(r => r.column_name));
    
  } finally {
    client.release();
    await pool.end();
  }
}
test();
