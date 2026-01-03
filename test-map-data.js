const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function test() {
  const client = await pool.connect();
  try {
    // Test units query
    const units = await client.query(`
      SELECT u.unit_number, c.name as location, d.driver_name
      FROM unit_profiles u
      LEFT JOIN customers c ON u.current_location_id = c.customer_id
      LEFT JOIN driver_profiles d ON u.unit_number = d.unit_number
      WHERE u.is_active = true
      LIMIT 5
    `);
    console.log('🚛 Units at locations:');
    units.rows.forEach(r => console.log(`   ${r.unit_number} @ ${r.location} - ${r.driver_name}`));
    
    // Test trailers query
    const trailers = await client.query(`
      SELECT t.unit_number, t.type, t.status, c.name as location
      FROM trailers t
      LEFT JOIN customers c ON t.current_location_id = c.customer_id
      LIMIT 5
    `);
    console.log('\n🚚 Trailers at locations:');
    trailers.rows.forEach(r => console.log(`   ${r.unit_number} (${r.type}, ${r.status}) @ ${r.location}`));
    
    // Test customers
    const customers = await client.query('SELECT name, city FROM customers ORDER BY name LIMIT 5');
    console.log('\n📍 Customer facilities:');
    customers.rows.forEach(r => console.log(`   ${r.name}`));

    // Count summary
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM unit_profiles WHERE is_active = true) as units,
        (SELECT COUNT(*) FROM trailers) as trailers,
        (SELECT COUNT(*) FROM customers) as facilities
    `);
    console.log('\n📊 Summary:');
    console.log(`   Units: ${summary.rows[0].units}`);
    console.log(`   Trailers: ${summary.rows[0].trailers}`);
    console.log(`   Facilities: ${summary.rows[0].facilities}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}
test();
