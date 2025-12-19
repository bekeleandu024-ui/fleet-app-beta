const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function findTripOrder() {
  try {
    const tripNumber = 'TRP-10033';
    console.log(`Searching for ${tripNumber}...`);
    
    const res = await pool.query(
      "SELECT order_id, trip_number, id FROM trips WHERE trip_number = $1", 
      [tripNumber]
    );
    
    if (res.rows.length > 0) {
      console.log('\n✅ Found Trip:');
      console.log(res.rows[0]);
      console.log(`\nOrder ID: ${res.rows[0].order_id}`);
    } else {
      console.log('❌ Trip not found');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

findTripOrder();