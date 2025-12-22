const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function testOrdersQuery() {
  const client = await pool.connect();
  try {
    // Get an order
    const orders = await client.query(`
      SELECT id, order_number 
      FROM orders 
      LIMIT 1
    `);
    
    if (orders.rows.length === 0) {
      console.log('❌ No orders found in database');
      return;
    }
    
    const orderId = orders.rows[0].id;
    console.log('🔍 Testing order:', orderId);
    
    // Test the exact query from the API
    console.log('\n📋 Testing order query...');
    const orderResult = await pool.query(`
      SELECT 
        id, order_number, status, customer_id, customer_name,
        pickup_location, dropoff_location, pickup_time, pu_window_start, pu_window_end,
        dropoff_time, del_window_start, del_window_end,
        lane, order_type, special_instructions,
        quoted_rate, estimated_cost,
        total_weight, total_pallets, cubic_feet, linear_feet_required
      FROM orders 
      WHERE id = $1
    `, [orderId]);
    
    console.log('✅ Order query succeeded');
    
    // Test drivers query
    console.log('\n👥 Testing drivers query...');
    const driversResult = await pool.query(`
      SELECT 
        d.driver_id as id,
        d.driver_name as name,
        d.driver_type as type,
        d.region,
        d.status,
        u.current_location,
        u.truck_weekly_cost,
        u.unit_number
      FROM driver_profiles d
      LEFT JOIN unit_profiles u ON d.unit_number = u.unit_number
      WHERE d.is_active = true
      ORDER BY 
        CASE 
          WHEN d.region = 'GTA' THEN 1
          WHEN d.region = 'Montreal' THEN 2
          ELSE 3
        END,
        d.driver_type ASC
      LIMIT 5
    `);
    
    console.log(`✅ Drivers query succeeded: ${driversResult.rows.length} drivers`);
    
    // Test units query
    console.log('\n🚛 Testing units query...');
    const unitsResult = await pool.query(`
      SELECT 
        unit_id as id,
        unit_number,
        unit_type,
        region,
        current_location,
        is_active,
        max_weight,
        max_cube,
        linear_feet
      FROM unit_profiles
      WHERE is_active = true
      ORDER BY region
      LIMIT 5
    `);
    
    console.log(`✅ Units query succeeded: ${unitsResult.rows.length} units`);
    
    console.log('\n✅ All queries succeeded!');
    
  } catch (err) {
    console.error('❌ Query failed:', err.message);
    console.error('Column:', err.column);
    console.error('Position:', err.position);
  } finally {
    client.release();
    await pool.end();
  }
}

testOrdersQuery();
