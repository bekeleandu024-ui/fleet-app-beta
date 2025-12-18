const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkRecentOrders() {
  try {
    console.log('📋 Checking all orders in database...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        order_number,
        customer_id,
        status,
        created_at,
        pickup_location,
        dropoff_location
      FROM orders
      ORDER BY created_at DESC
    `);
    
    console.log(`Total orders: ${result.rows.length}\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No orders found in database!');
    } else {
      result.rows.forEach((order, idx) => {
        console.log(`${idx + 1}. ${order.order_number} (${order.id})`);
        console.log(`   Customer: ${order.customer_id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Created: ${order.created_at}`);
        console.log(`   Pickup: ${order.pickup_location?.substring(0, 50)}...`);
        console.log('');
      });
    }
    
    // Check specific UUID from screenshot
    console.log('\n🔍 Checking order from screenshot: f3808085-d7d0-4da4-9fa3-006bda213222...');
    const specificOrder = await pool.query('SELECT * FROM orders WHERE id = $1', ['f3808085-d7d0-4da4-9fa3-006bda213222']);
    
    if (specificOrder.rows.length > 0) {
      console.log('✅ Found in database!');
    } else {
      console.log('❌ NOT found in database - only exists in backend service!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRecentOrders();
