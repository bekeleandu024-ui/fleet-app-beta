require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    // Check for orders with UUID-like customer names
    const result = await pool.query(`
      SELECT id, order_number, customer_id, customer_name 
      FROM orders 
      WHERE customer_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      LIMIT 10
    `);
    
    console.log('Orders with UUID customer names:', result.rows);
    
    // Also check specific UUID
    const specific = await pool.query(`
      SELECT id, order_number, customer_id, customer_name 
      FROM orders 
      WHERE customer_name = 'dbcf3101-2bd8-419b-a3f6-5674003a47ce'
         OR customer_id = 'dbcf3101-2bd8-419b-a3f6-5674003a47ce'
    `);
    
    console.log('Specific UUID matches:', specific.rows);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
