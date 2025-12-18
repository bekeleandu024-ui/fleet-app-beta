const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function migrateToUUID() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting UUID migration...\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current database state...');
    const currentOrders = await client.query('SELECT id, order_number FROM orders LIMIT 5');
    console.log('Sample orders:', currentOrders.rows);
    console.log('');
    
    // Step 2: Backup orders table
    console.log('💾 Step 2: Creating backup table...');
    await client.query('DROP TABLE IF EXISTS orders_backup_pre_uuid');
    await client.query('CREATE TABLE orders_backup_pre_uuid AS SELECT * FROM orders');
    const backupCount = await client.query('SELECT COUNT(*) FROM orders_backup_pre_uuid');
    console.log(`✅ Backed up ${backupCount.rows[0].count} orders to orders_backup_pre_uuid`);
    console.log('');
    
    // Step 3: Add new uuid_id column
    console.log('🔧 Step 3: Adding uuid_id column...');
    await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid()');
    console.log('✅ Added uuid_id column');
    console.log('');
    
    // Step 4: Ensure all orders have UUIDs
    console.log('🔧 Step 4: Generating UUIDs for all orders...');
    await client.query('UPDATE orders SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL');
    console.log('✅ All orders now have UUIDs');
    console.log('');
    
    // Step 5: Update foreign keys in related tables
    console.log('🔗 Step 5: Updating foreign keys in related tables...');
    
    // Check if trip_costs table exists and has order_id
    const tripCostsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'trip_costs'
      );
    `);
    
    if (tripCostsCheck.rows[0].exists) {
      console.log('  → Updating trip_costs.order_id...');
      await client.query(`
        UPDATE trip_costs tc
        SET order_id = o.uuid_id::text
        FROM orders o
        WHERE tc.order_id = o.id
      `);
      console.log('  ✅ Updated trip_costs');
    }
    
    // Check if trips table exists
    const tripsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'trips'
      );
    `);
    
    if (tripsCheck.rows[0].exists) {
      console.log('  → Updating trips.order_id...');
      await client.query(`
        UPDATE trips t
        SET order_id = o.uuid_id::text
        FROM orders o
        WHERE t.order_id = o.id
      `);
      console.log('  ✅ Updated trips');
    }
    
    console.log('');
    
    // Step 6: Preserve old IDs in order_number if not already set
    console.log('🔧 Step 6: Preserving friendly IDs in order_number...');
    await client.query(`
      UPDATE orders 
      SET order_number = CASE 
        WHEN order_number IS NULL OR order_number = '' THEN id 
        ELSE order_number 
      END
    `);
    console.log('✅ Friendly IDs preserved in order_number column');
    console.log('');
    
    // Step 7: Drop old primary key
    console.log('🔧 Step 7: Dropping old primary key constraint...');
    await client.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_pkey');
    console.log('✅ Old primary key dropped');
    console.log('');
    
    // Step 8: Rename columns
    console.log('🔧 Step 8: Swapping columns...');
    await client.query('ALTER TABLE orders RENAME COLUMN id TO old_id');
    await client.query('ALTER TABLE orders RENAME COLUMN uuid_id TO id');
    console.log('✅ Columns swapped');
    console.log('');
    
    // Step 9: Set new primary key
    console.log('🔧 Step 9: Setting UUID as primary key...');
    await client.query('ALTER TABLE orders ADD PRIMARY KEY (id)');
    console.log('✅ UUID is now the primary key');
    console.log('');
    
    // Step 10: Create indexes
    console.log('🔧 Step 10: Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_old_id ON orders(old_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)');
    console.log('✅ Indexes created');
    console.log('');
    
    // Step 11: Drop old_id column (optional - keep for reference)
    console.log('🔧 Step 11: Keeping old_id column for reference...');
    console.log('✅ old_id column retained for backward compatibility');
    console.log('');
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Verify migration
    console.log('✅ Step 12: Verifying migration...');
    const newOrders = await client.query('SELECT id, old_id, order_number, customer_id FROM orders LIMIT 5');
    console.log('Sample migrated orders:');
    newOrders.rows.forEach(row => {
      console.log(`  UUID: ${row.id}`);
      console.log(`  Old ID: ${row.old_id}`);
      console.log(`  Order Number: ${row.order_number}`);
      console.log(`  Customer: ${row.customer_id}`);
      console.log('');
    });
    
    const totalCount = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`📊 Total orders migrated: ${totalCount.rows[0].count}`);
    console.log(`\n⚠️  NOTE: Backup table created as 'orders_backup_pre_uuid'`);
    console.log(`   You can drop it later with: DROP TABLE orders_backup_pre_uuid;`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n🔄 Transaction rolled back. Database unchanged.');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrateToUUID().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
