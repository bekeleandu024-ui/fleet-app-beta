const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function migrate() {
  const client = await pool.connect();
  try {
    // Drop constraint first
    await client.query('ALTER TABLE order_stops DROP CONSTRAINT IF EXISTS order_stops_appointment_type_check');
    console.log('1. Dropped old constraint');
    
    // Update fcfs to window
    const result = await client.query("UPDATE order_stops SET appointment_type = 'window' WHERE appointment_type = 'fcfs'");
    console.log('2. Updated ' + result.rowCount + ' rows from fcfs to window');
    
    // Add new constraint
    await client.query("ALTER TABLE order_stops ADD CONSTRAINT order_stops_appointment_type_check CHECK (appointment_type IN ('firm', 'window', 'open'))");
    console.log('3. Added new constraint');
    
    // Update default
    await client.query("ALTER TABLE order_stops ALTER COLUMN appointment_type SET DEFAULT 'open'");
    console.log('4. Set default to open');
    
    console.log('Migration completed successfully!');
  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}
migrate();
