const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkOrderDistance() {
  const client = await pool.connect();
  try {
    // Check if orders have distance info
    const order = await client.query(`
      SELECT o.id, o.order_number, o.pickup_location, o.dropoff_location
      FROM orders o
      LIMIT 1
    `);
    
    const orderId = order.rows[0].id;
    
    // Check if there's a trip for this order
    const trip = await client.query(`
      SELECT id, distance_miles, planned_miles
      FROM trips
      WHERE order_id = $1
      LIMIT 1
    `, [orderId]);
    
    console.log('📦 Order:', order.rows[0].order_number);
    console.log('🚛 Trip distance:', trip.rows[0]?.distance_miles || 'No trip found');
    console.log('📏 Planned miles:', trip.rows[0]?.planned_miles || 'N/A');
    
    // Calculate distance using the distance calculation
    // For now, let's use a default
    console.log('\n💡 Suggestion: Use 380 miles as default if no trip exists yet');
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkOrderDistance();
