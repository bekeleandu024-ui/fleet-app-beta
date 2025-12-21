const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkSchema() {
  try {
    const tripsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trips' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== TRIPS TABLE COLUMNS ===');
    tripsColumns.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(30)} ${row.data_type}`);
    });
    
    // Check a sample trip
    const sampleTrip = await pool.query(`
      SELECT * FROM trips 
      WHERE status NOT IN ('completed', 'closed') 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (sampleTrip.rows.length > 0) {
      console.log('\n=== SAMPLE TRIP DATA ===');
      const trip = sampleTrip.rows[0];
      console.log(`Trip ID: ${trip.id}`);
      console.log(`Status: ${trip.status}`);
      console.log(`Driver ID: ${trip.driver_id}`);
      console.log(`Unit ID: ${trip.unit_id}`);
      console.log(`Order ID: ${trip.order_id}`);
      console.log(`Pickup: ${trip.pickup_location}`);
      console.log(`Dropoff: ${trip.dropoff_location}`);
      console.log(`Revenue: ${trip.revenue}`);
      console.log(`Total Cost: ${trip.total_cost}`);
      console.log(`Margin %: ${trip.margin_pct}`);
      console.log(`Planned Miles: ${trip.planned_miles}`);
      console.log(`Utilization %: ${trip.utilization_percent}`);
      console.log(`Limiting Factor: ${trip.limiting_factor}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
