const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function testDriverQuery() {
  const client = await pool.connect();
  try {
    // Find a trip that has Chris Osborne as driver
    const trips = await client.query(`
      SELECT t.id as trip_id, t.driver_id, t.driver_name, t.unit_id, t.unit_number
      FROM trips t
      WHERE t.driver_name LIKE '%Chris%' OR t.driver_id IS NOT NULL
      LIMIT 5
    `);
    
    console.log('🚛 Trips with drivers:');
    trips.rows.forEach(t => {
      console.log(`  Trip: ${t.trip_id}`);
      console.log(`    driver_id: ${t.driver_id}`);
      console.log(`    driver_name: ${t.driver_name}`);
    });
    
    // Test the exact query from the API
    if (trips.rows[0]?.driver_id) {
      const driverId = trips.rows[0].driver_id;
      console.log(`\n🔍 Testing driver query for driver_id: ${driverId}`);
      
      const driver = await client.query(`
        SELECT 
          d.driver_id, d.driver_name, d.driver_type, d.region, 
          d.is_active, d.unit_number,
          u.truck_weekly_cost, u.current_location as unit_location
        FROM driver_profiles d
        LEFT JOIN unit_profiles u ON d.unit_number = u.unit_number
        WHERE d.driver_id = $1
      `, [driverId]);
      
      console.log('\n✅ Driver query result:');
      console.log(JSON.stringify(driver.rows, null, 2));
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

testDriverQuery();
