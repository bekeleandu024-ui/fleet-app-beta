const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet';

const pool = new Pool({
  connectionString,
});

async function analyzeOrders() {
  const client = await pool.connect();
  try {
    // Count delivered orders
    const deliveredOrders = await client.query(`
      SELECT id, status FROM orders WHERE status = 'Delivered'
    `);
    console.log(`Delivered Orders: ${deliveredOrders.rowCount}`);

    // Check how many have trips
    const ordersWithTrips = await client.query(`
      SELECT o.id 
      FROM orders o
      JOIN trips t ON t.order_id = o.id
      WHERE o.status = 'Delivered'
    `);
    console.log(`Delivered Orders with Trips: ${ordersWithTrips.rowCount}`);
    
    // Check trips status
    const closedTrips = await client.query(`
      SELECT id, status FROM trips WHERE status = 'closed'
    `);
    console.log(`Closed Trips: ${closedTrips.rowCount}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeOrders();
