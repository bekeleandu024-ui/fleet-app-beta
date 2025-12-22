const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function updateCapacityData() {
  const client = await pool.connect();
  try {
    console.log('Updating capacity data with realistic values...\n');

    // Force update ALL orders with realistic weights
    const updateOrders = await client.query(`
      UPDATE orders SET 
        weight_lbs = CASE 
          WHEN order_type = 'LTL' THEN 5000 + (random() * 5000)::int
          WHEN order_type = 'FTL' THEN 35000 + (random() * 10000)::int
          ELSE 10000 + (random() * 15000)::int
        END,
        volume_cuft = CASE 
          WHEN order_type = 'LTL' THEN 500 + (random() * 500)::int
          WHEN order_type = 'FTL' THEN 2000 + (random() * 800)::int
          ELSE 800 + (random() * 700)::int
        END
      RETURNING id, order_type, weight_lbs, volume_cuft
    `);
    console.log(`✓ Updated ${updateOrders.rows.length} orders with realistic weight/volume data`);
    
    if (updateOrders.rows.length > 0) {
      console.log('\nSample orders:');
      updateOrders.rows.slice(0, 5).forEach(order => {
        console.log(`  Order ${order.id} (${order.order_type || 'Standard'}): ${Math.round(order.weight_lbs)} lbs, ${Math.round(order.volume_cuft)} cuft`);
      });
    }

    // Update ALL units with capacity
    const updateUnits = await client.query(`
      UPDATE unit_profiles SET
        max_weight_lbs = 45000,
        max_volume_cuft = 3000
      RETURNING unit_number, max_weight_lbs, max_volume_cuft
    `);
    console.log(`\n✓ Updated ${updateUnits.rows.length} units with capacity data`);
    
    if (updateUnits.rows.length > 0) {
      console.log('\nSample units:');
      updateUnits.rows.slice(0, 3).forEach(unit => {
        console.log(`  Unit ${unit.unit_number}: ${unit.max_weight_lbs} lbs max, ${unit.max_volume_cuft} cuft max`);
      });
    }

    // Show summary
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        AVG(weight_lbs)::int as avg_weight,
        AVG(volume_cuft)::int as avg_volume,
        MIN(weight_lbs)::int as min_weight,
        MAX(weight_lbs)::int as max_weight,
        MIN(volume_cuft)::int as min_volume,
        MAX(volume_cuft)::int as max_volume
      FROM orders
    `);
    
    console.log('\n📊 Orders Summary:');
    const stats = summary.rows[0];
    console.log(`  Total orders: ${stats.total_orders}`);
    console.log(`  Weight range: ${stats.min_weight} - ${stats.max_weight} lbs (avg: ${stats.avg_weight})`);
    console.log(`  Volume range: ${stats.min_volume} - ${stats.max_volume} cuft (avg: ${stats.avg_volume})`);

    // Show orders with trips
    const tripsWithOrders = await client.query(`
      SELECT t.id as trip_id, t.pickup_location, t.dropoff_location,
             o.id as order_id, o.order_type, o.weight_lbs, o.volume_cuft
      FROM trips t
      LEFT JOIN orders o ON o.id::text = t.order_id
      WHERE t.status = 'Active'
      ORDER BY t.id
      LIMIT 10
    `);
    
    if (tripsWithOrders.rows.length > 0) {
      console.log('\n🚚 Active Trips with Capacity Data:');
      tripsWithOrders.rows.forEach(trip => {
        if (trip.order_id) {
          console.log(`  Trip ${trip.trip_id}: Order ${trip.order_id} - ${Math.round(trip.weight_lbs)} lbs, ${Math.round(trip.volume_cuft)} cuft`);
        } else {
          console.log(`  Trip ${trip.trip_id}: No order linked`);
        }
      });
    }

    console.log('\n✅ Update complete!');

  } catch (error) {
    console.error('❌ Update failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateCapacityData().catch(console.error);
