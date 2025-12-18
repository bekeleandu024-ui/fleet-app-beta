const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkOrder() {
  try {
    const orderId = 'ed8a7fe8-23ec-4b3c-b7b1-a8a4e7b3592c';
    
    // Check if order exists
    const result = await pool.query(
      'SELECT id, order_number, customer_id, status FROM orders WHERE id = $1',
      [orderId]
    );
    
    console.log('\n=== Checking Order ===');
    console.log('Order ID:', orderId);
    console.log('Found in DB:', result.rows.length > 0);
    
    if (result.rows.length > 0) {
      console.log('Order:', result.rows[0]);
    } else {
      console.log('\nOrder NOT found in database.');
      console.log('\nChecking all orders:');
      const allOrders = await pool.query('SELECT id, order_number, customer_id, status FROM orders ORDER BY created_at DESC LIMIT 10');
      console.log('Recent orders:', allOrders.rows);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkOrder();
