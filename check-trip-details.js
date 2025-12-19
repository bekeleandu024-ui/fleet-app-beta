const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkTripDetails() {
  const tripId = '3cc97bdb-72c5-4ec5-bdef-c75d0854076c';
  
  try {
    console.log(`\n=== Checking Trip: ${tripId} ===`);
    
    // 1. Get Trip
    const tripResult = await pool.query(
      'SELECT id, trip_number, order_id, status, current_weight, current_cube, current_linear_feet FROM trips WHERE id = $1',
      [tripId]
    );
    
    if (tripResult.rows.length === 0) {
      console.log('Trip not found!');
      return;
    }
    
    const trip = tripResult.rows[0];
    console.log('Trip Found:', trip);
    
    if (!trip.order_id) {
      console.log('No Order ID associated with this trip.');
      return;
    }
    
    // 2. Get Order
    console.log(`\n=== Checking Associated Order: ${trip.order_id} ===`);
    const orderResult = await pool.query(
      `SELECT 
        id, 
        order_number, 
        customer_name,
        total_weight, 
        total_pallets, 
        pallet_dimensions, 
        stackable, 
        cubic_feet, 
        linear_feet_required 
       FROM orders WHERE id = $1`,
      [trip.order_id]
    );
    
    if (orderResult.rows.length === 0) {
      console.log('Order not found!');
    } else {
      console.log('Order Details:', JSON.stringify(orderResult.rows[0], null, 2));
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTripDetails();
