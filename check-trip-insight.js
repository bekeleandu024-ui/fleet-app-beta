const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkTripData() {
  const client = await pool.connect();
  try {
    console.log('='.repeat(80));
    console.log('CHECKING TRIP DATA FOR TRP-21666921');
    console.log('='.repeat(80));
    
    // Check trip by trip_number and ID
    const tripResult = await client.query(`
      SELECT 
        id, 
        trip_number, 
        order_id, 
        driver_id,
        driver_name,
        planned_miles, 
        distance_miles,
        actual_miles,
        revenue, 
        total_cost, 
        profit,
        margin_pct,
        status,
        pickup_location,
        dropoff_location
      FROM trips 
      WHERE trip_number = 'TRP-21666921' 
         OR id = '6096d774-99e3-4689-8fb3-f9bb7c592ad9'
    `);
    
    console.log('\n📋 Trip Data:');
    if (tripResult.rows.length > 0) {
      const trip = tripResult.rows[0];
      console.log('  ID:', trip.id);
      console.log('  Trip Number:', trip.trip_number);
      console.log('  Order ID:', trip.order_id);
      console.log('  Driver ID:', trip.driver_id);
      console.log('  Driver Name:', trip.driver_name);
      console.log('  Planned Miles:', trip.planned_miles);
      console.log('  Distance Miles:', trip.distance_miles);
      console.log('  Actual Miles:', trip.actual_miles);
      console.log('  Revenue:', trip.revenue);
      console.log('  Total Cost:', trip.total_cost);
      console.log('  Profit:', trip.profit);
      console.log('  Margin %:', trip.margin_pct);
      console.log('  Status:', trip.status);
      console.log('  Pickup:', trip.pickup_location);
      console.log('  Dropoff:', trip.dropoff_location);
      
      // Check trip_costs for this trip
      console.log('\n📋 Trip Costs Data:');
      const costResult = await client.query(`
        SELECT * FROM trip_costs 
        WHERE trip_id = $1 OR order_id = $2
      `, [trip.id, trip.order_id]);
      
      if (costResult.rows.length > 0) {
        console.log('  Found trip_costs record:');
        const cost = costResult.rows[0];
        console.log('    Miles:', cost.miles);
        console.log('    Total Cost:', cost.total_cost);
        console.log('    Revenue:', cost.revenue);
        console.log('    Profit:', cost.profit);
        console.log('    Margin %:', cost.margin_pct);
      } else {
        console.log('  ⚠️ NO TRIP_COSTS RECORD FOUND');
      }
      
      // Check order data
      console.log('\n📋 Order Data:');
      const orderResult = await client.query(`
        SELECT id, order_number, customer_id, customer_name, quoted_rate, lane
        FROM orders WHERE id = $1
      `, [trip.order_id]);
      
      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        console.log('  Order ID:', order.id);
        console.log('  Order Number:', order.order_number);
        console.log('  Customer:', order.customer_name || order.customer_id);
        console.log('  Quoted Rate:', order.quoted_rate);
        console.log('  Lane:', order.lane);
      } else {
        console.log('  ⚠️ NO ORDER FOUND');
      }
      
    } else {
      console.log('  ⚠️ TRIP NOT FOUND!');
    }
    
    // Check what the API would be queried with
    console.log('\n' + '='.repeat(80));
    console.log('POTENTIAL ISSUE ANALYSIS:');
    console.log('='.repeat(80));
    
    // The API uses WHERE id = $1 with tripId from the URL
    // If the frontend is passing trip_number instead of UUID, it would fail
    console.log('\nThe AI Insights API queries: WHERE id = $1');
    console.log('If the frontend passes "TRP-21666921" instead of the UUID,');
    console.log('the query would return 0 rows (trip not found).');
    
  } finally {
    client.release();
    pool.end();
  }
}

checkTripData();
