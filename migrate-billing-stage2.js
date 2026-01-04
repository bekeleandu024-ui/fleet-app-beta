const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Adding billing fields to orders table...');
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_billable_amount DECIMAL(12,2)
    `);
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_status VARCHAR(30) DEFAULT 'PENDING'
    `);
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_notes TEXT
    `);
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_finalized_at TIMESTAMP
    `);
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_finalized_by VARCHAR(100)
    `);
    
    console.log('Creating order_accessorials table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_accessorials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        accessorial_type VARCHAR(50) NOT NULL,
        description TEXT,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(100)
      )
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_order_accessorials_order ON order_accessorials(order_id)
    `);
    
    await client.query('COMMIT');
    console.log('Migration complete!');
    
    // Verify
    const check = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name IN ('final_billable_amount', 'billing_status')
    `);
    console.log('Verified columns:', check.rows.map(r => r.column_name).join(', '));
    
    const tableCheck = await client.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_accessorials')
    `);
    console.log('order_accessorials table exists:', tableCheck.rows[0].exists);
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
