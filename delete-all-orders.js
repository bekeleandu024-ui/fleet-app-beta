const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function deleteAllOrders() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Starting order deletion...\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Count current orders
    const countResult = await client.query('SELECT COUNT(*) FROM orders');
    const orderCount = countResult.rows[0].count;
    console.log(`📊 Found ${orderCount} orders to delete`);
    
    if (orderCount === 0) {
      console.log('✅ No orders to delete');
      await client.query('ROLLBACK');
      return;
    }
    
    // Step 2: Show sample orders
    const sampleOrders = await client.query('SELECT id, order_number, customer_id FROM orders LIMIT 5');
    console.log('\n📋 Sample orders to be deleted:');
    sampleOrders.rows.forEach(order => {
      console.log(`  - ${order.id} (${order.order_number}) - ${order.customer_id}`);
    });
    console.log('');
    
    // Step 3: Delete related data first (foreign key constraints)
    console.log('🔧 Deleting related data...');
    
    // Delete trip_costs (cast UUID to text for comparison)
    const tripCostsResult = await client.query('DELETE FROM trip_costs WHERE order_id IN (SELECT id::text FROM orders)');
    console.log(`  ✅ Deleted ${tripCostsResult.rowCount} trip_costs records`);
    
    // Delete trips (cast UUID to text for comparison)
    const tripsResult = await client.query('DELETE FROM trips WHERE order_id IN (SELECT id::text FROM orders)');
    console.log(`  ✅ Deleted ${tripsResult.rowCount} trips records`);
    
    console.log('');
    
    // Step 4: Delete orders
    console.log('🗑️  Deleting all orders...');
    const deleteResult = await client.query('DELETE FROM orders');
    console.log(`  ✅ Deleted ${deleteResult.rowCount} orders`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Verify deletion
    const verifyResult = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`\n✅ Deletion complete!`);
    console.log(`📊 Remaining orders: ${verifyResult.rows[0].count}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Deletion failed:', error.message);
    console.error('🔄 Transaction rolled back. Database unchanged.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run deletion
deleteAllOrders().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
