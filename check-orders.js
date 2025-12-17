const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkOrders() {
  try {
    const client = await pool.connect();
    try {
      const resType = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'id'");
      console.log('orders.id type:', resType.rows[0].data_type);

      const res = await client.query('SELECT count(*) FROM orders');
      console.log('Total orders:', res.rows[0].count);

      const res2 = await client.query("SELECT status, count(*) FROM orders GROUP BY status");
      console.log('Orders by status:', res2.rows);
      
      const res3 = await client.query("SELECT * FROM orders LIMIT 5");
      console.log('Sample orders:', res3.rows);

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkOrders();
