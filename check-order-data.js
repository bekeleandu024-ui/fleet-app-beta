const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function checkOrderData() {
  const client = await pool.connect();
  try {
    const order = await client.query(`
      SELECT 
        id, order_number, lane, pickup_location, dropoff_location,
        pickup_time, pu_window_start, dropoff_time, del_window_start,
        order_type, quoted_rate, estimated_cost
      FROM orders 
      LIMIT 1
    `);
    
    console.log('📝 Sample order data:');
    console.log(JSON.stringify(order.rows[0], null, 2));
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkOrderData();
