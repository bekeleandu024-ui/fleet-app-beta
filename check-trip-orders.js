const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'});

async function checkOrders() {
  // First get the schema
  const schema = await pool.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'
  `);
  console.log('Orders columns:', schema.rows.map(x=>x.column_name).join(', '));
  
  // Then get order data
  const result = await pool.query(`
    SELECT order_number, customer_name, pickup_location, dropoff_location
    FROM orders 
    WHERE order_number IN ('ORD-10019', 'ORD-10017', 'ORD-10015') 
    ORDER BY order_number
  `);
  console.table(result.rows);
  await pool.end();
}

checkOrders();
