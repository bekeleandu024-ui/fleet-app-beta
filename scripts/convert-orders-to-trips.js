const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet';

const pool = new Pool({
  connectionString,
});

// Polyfill uuid if not available in environment (it might not be installed in the root)
// Actually, I can just use a simple random string generator or rely on DB to generate UUID if I use gen_random_uuid()
// But the schema says `id` is uuid.
// I'll try to use `uuid` package if available, otherwise I'll use a postgres query to generate it.

async function convertOrdersToTrips() {
  const client = await pool.connect();
  try {
    console.log('Fetching orders without trips...');
    
    // Find orders that don't have a corresponding trip
    const ordersResult = await client.query(`
      SELECT o.* 
      FROM orders o
      LEFT JOIN trips t ON t.order_id = o.id
      WHERE t.id IS NULL
    `);
    
    console.log(`Found ${ordersResult.rowCount} orders without trips.`);

    // Get a placeholder driver and unit
    const driverRes = await client.query('SELECT driver_id FROM driver_profiles LIMIT 1');
    const unitRes = await client.query('SELECT unit_id FROM unit_profiles LIMIT 1');
    
    const placeholderDriverId = driverRes.rows[0]?.driver_id;
    const placeholderUnitId = unitRes.rows[0]?.unit_id;

    if (!placeholderDriverId || !placeholderUnitId) {
      throw new Error("No drivers or units found to use as placeholders.");
    }

    for (const order of ordersResult.rows) {
      console.log(`Creating closed trip for order ${order.id} (${order.customer_id})...`);
      
      // Create a closed trip for this order
      await client.query(`
        INSERT INTO trips (
          id,
          order_id,
          driver_id,
          unit_id,
          status,
          pickup_location,
          dropoff_location,
          pickup_window_start,
          delivery_window_end,
          created_at,
          updated_at,
          closed_at,
          planned_miles
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          'closed',
          $4,
          $5,
          $6,
          $7,
          $8,
          NOW(),
          NOW(),
          $9
        )
      `, [
        order.id,
        placeholderDriverId,
        placeholderUnitId,
        order.pickup_location,
        order.dropoff_location,
        order.pickup_time,
        order.dropoff_time,
        order.created_at,
        order.estimated_cost ? Math.floor(Math.random() * 500) + 100 : 0 // Dummy miles
      ]);

      // Update order status to Closed
      await client.query(`
        UPDATE orders 
        SET status = 'Closed' 
        WHERE id = $1
      `, [order.id]);
    }

    // Also update any remaining 'Delivered' orders to 'Closed' even if they had trips
    await client.query(`
      UPDATE orders 
      SET status = 'Closed' 
      WHERE status = 'Delivered'
    `);

    console.log('Migration complete.');

  } catch (err) {
    console.error('Error converting orders:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

convertOrdersToTrips();
