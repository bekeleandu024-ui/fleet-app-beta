const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting capacity columns migration...\n');

    // Add columns to orders
    await client.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS weight_lbs numeric DEFAULT 1000,
      ADD COLUMN IF NOT EXISTS volume_cuft numeric DEFAULT 100
    `);
    console.log('✓ Added weight_lbs and volume_cuft to orders table');

    // Add columns to unit_profiles
    await client.query(`
      ALTER TABLE unit_profiles
      ADD COLUMN IF NOT EXISTS max_weight_lbs numeric DEFAULT 45000,
      ADD COLUMN IF NOT EXISTS max_volume_cuft numeric DEFAULT 3000
    `);
    console.log('✓ Added max_weight_lbs and max_volume_cuft to unit_profiles table');

    // Update existing orders with sample weights
    const updateOrders = await client.query(`
      UPDATE orders SET 
        weight_lbs = CASE 
          WHEN order_type = 'LTL' THEN 5000 + (random() * 5000)::int
          WHEN order_type = 'FTL' THEN 35000 + (random() * 10000)::int
          ELSE 10000 + (random() * 15000)::int
        END,
        volume_cuft = CASE 
          WHEN order_type = 'LTL' THEN 500 + (random() * 500)::int
          WHEN order_type = 'FTL' THEN 2000 + (random() * 800)::int
          ELSE 800 + (random() * 700)::int
        END
      WHERE weight_lbs IS NULL OR volume_cuft IS NULL
      RETURNING id, order_type, weight_lbs, volume_cuft
    `);
    console.log(`✓ Updated ${updateOrders.rows.length} orders with weight/volume data`);
    if (updateOrders.rows.length > 0) {
      console.log('\nSample order data:');
      updateOrders.rows.slice(0, 3).forEach(order => {
        console.log(`  Order ${order.id} (${order.order_type}): ${Math.round(order.weight_lbs)} lbs, ${Math.round(order.volume_cuft)} cuft`);
      });
    }

    // Update unit capacities
    const updateUnits = await client.query(`
      UPDATE unit_profiles SET
        max_weight_lbs = 45000,
        max_volume_cuft = 3000
      WHERE max_weight_lbs IS NULL OR max_volume_cuft IS NULL
      RETURNING unit_number, max_weight_lbs, max_volume_cuft
    `);
    console.log(`\n✓ Updated ${updateUnits.rows.length} units with capacity data`);
    if (updateUnits.rows.length > 0) {
      console.log('\nSample unit data:');
      updateUnits.rows.slice(0, 3).forEach(unit => {
        console.log(`  Unit ${unit.unit_number}: ${unit.max_weight_lbs} lbs max, ${unit.max_volume_cuft} cuft max`);
      });
    }

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_weight ON orders(weight_lbs);
      CREATE INDEX IF NOT EXISTS idx_orders_volume ON orders(volume_cuft)
    `);
    console.log('\n✓ Created indexes for performance');

    // Show summary
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_orders,
        AVG(weight_lbs) as avg_weight,
        AVG(volume_cuft) as avg_volume,
        MAX(weight_lbs) as max_weight,
        MAX(volume_cuft) as max_volume
      FROM orders
      WHERE weight_lbs IS NOT NULL
    `);
    
    console.log('\n📊 Summary:');
    const stats = summary.rows[0];
    console.log(`  Total orders: ${stats.total_orders}`);
    console.log(`  Average weight: ${Math.round(stats.avg_weight)} lbs`);
    console.log(`  Average volume: ${Math.round(stats.avg_volume)} cuft`);
    console.log(`  Max weight: ${Math.round(stats.max_weight)} lbs`);
    console.log(`  Max volume: ${Math.round(stats.max_volume)} cuft`);

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
