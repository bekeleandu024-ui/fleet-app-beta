const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkDriverIssue() {
  const client = await pool.connect();
  try {
    // Get a trip with driver_id
    const trip = await client.query(`
      SELECT id, driver_id, driver_name, unit_id, unit_number
      FROM trips
      WHERE driver_id IS NOT NULL
      LIMIT 1
    `);
    
    console.log('🚛 Trip data:');
    console.log(JSON.stringify(trip.rows[0], null, 2));
    
    if (trip.rows[0]?.driver_id) {
      const driverId = trip.rows[0].driver_id;
      
      // Try to find driver in driver_profiles
      const driver = await client.query(`
        SELECT driver_id, driver_name, driver_type
        FROM driver_profiles
        WHERE driver_id = $1
      `, [driverId]);
      
      console.log('\n👤 Driver lookup result:');
      if (driver.rows.length > 0) {
        console.log(JSON.stringify(driver.rows[0], null, 2));
      } else {
        console.log('❌ Driver NOT FOUND in driver_profiles table!');
        
        // Check if there are ANY drivers
        const allDrivers = await client.query(`
          SELECT driver_id, driver_name, driver_type
          FROM driver_profiles
          LIMIT 5
        `);
        
        console.log('\n📋 Sample drivers in driver_profiles:');
        allDrivers.rows.forEach(d => {
          console.log(`  - ${d.driver_name} (${d.driver_id})`);
        });
      }
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkDriverIssue();
