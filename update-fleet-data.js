const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function updateFleetData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Set all units to Home Base Yard - Guelph
    console.log('🏠 Setting all units to Home Base Yard...');
    const homeBase = await client.query(`
      SELECT customer_id FROM customers WHERE name = 'Home Base Yard - Guelph'
    `);
    
    const updateUnits = await client.query(`
      UPDATE unit_profiles SET current_location_id = $1
    `, [homeBase.rows[0].customer_id]);
    console.log(`   ✅ Updated ${updateUnits.rowCount} units to Home Base Yard`);
    
    // 2. Remove region column from unit_profiles and driver_profiles
    console.log('\n🗑️  Removing region columns...');
    
    // First drop the dependent view
    await client.query(`DROP VIEW IF EXISTS dispatch_available_drivers CASCADE`);
    console.log('   ✅ Dropped dispatch_available_drivers view (will recreate)');
    
    await client.query(`ALTER TABLE unit_profiles DROP COLUMN IF EXISTS region`);
    console.log('   ✅ Removed region from unit_profiles');
    await client.query(`ALTER TABLE driver_profiles DROP COLUMN IF EXISTS region`);
    console.log('   ✅ Removed region from driver_profiles');
    
    // Recreate view without region
    await client.query(`
      CREATE OR REPLACE VIEW dispatch_available_drivers AS
      SELECT 
        dp.driver_id,
        dp.driver_name,
        dp.driver_type,
        dp.driver_category,
        dp.available_to_start_at,
        dp.hos_hours_remaining,
        dp.current_status,
        up.unit_id,
        up.unit_number,
        up.current_configuration,
        up.current_trailer_id,
        up.avg_fuel_consumption,
        up.current_location_id,
        c.name AS current_location_name,
        c.city AS current_city,
        t.trailer_id,
        t.unit_number AS trailer_number,
        t.type AS trailer_type
      FROM driver_profiles dp
      LEFT JOIN unit_profiles up ON dp.unit_number = up.unit_number
      LEFT JOIN customers c ON up.current_location_id = c.customer_id
      LEFT JOIN trailers t ON up.current_trailer_id = t.trailer_id
      WHERE dp.is_active = true
        AND dp.current_status != 'Driving'
        AND (dp.available_to_start_at IS NULL OR dp.available_to_start_at <= NOW())
    `);
    console.log('   ✅ Recreated dispatch_available_drivers view');
    
    // 3. Get all customer locations for trailer distribution
    const customers = await client.query(`
      SELECT customer_id, name FROM customers ORDER BY name
    `);
    console.log(`\n🚚 Creating 29 trailers across ${customers.rows.length} locations...`);
    
    // Create 29 trailers with different types
    const trailerTypes = ['Dry Van', 'Dry Van', 'Dry Van', 'Reefer', 'Flatbed']; // 60% dry van, 20% reefer, 20% flatbed
    const trailerStatuses = ['Available', 'Available', 'Available', 'Loaded']; // 75% available
    
    for (let i = 1; i <= 29; i++) {
      const trailerNumber = `T-${500 + i}`;
      const trailerType = trailerTypes[i % trailerTypes.length];
      const status = trailerStatuses[i % trailerStatuses.length];
      const customerIdx = i % customers.rows.length;
      const locationId = customers.rows[customerIdx].customer_id;
      
      await client.query(`
        INSERT INTO trailers (unit_number, type, current_location_id, status)
        VALUES ($1, $2::trailer_type, $3, $4::trailer_status)
        ON CONFLICT (unit_number) DO UPDATE SET 
          type = EXCLUDED.type,
          current_location_id = EXCLUDED.current_location_id,
          status = EXCLUDED.status
      `, [trailerNumber, trailerType, locationId, status]);
    }
    console.log('   ✅ Created 29 trailers');
    
    await client.query('COMMIT');
    
    // Show trailer distribution
    console.log('\n📊 Trailer Distribution by Location:');
    const dist = await client.query(`
      SELECT c.name, COUNT(*) as trailers, 
             STRING_AGG(t.unit_number, ', ' ORDER BY t.unit_number) as trailer_numbers
      FROM trailers t
      JOIN customers c ON t.current_location_id = c.customer_id
      GROUP BY c.name
      ORDER BY c.name
    `);
    dist.rows.forEach(r => console.log(`   • ${r.name}: ${r.trailers} (${r.trailer_numbers})`));
    
    // Show trailer types breakdown
    console.log('\n📦 Trailer Types:');
    const types = await client.query(`
      SELECT type, COUNT(*) as count FROM trailers GROUP BY type ORDER BY type
    `);
    types.rows.forEach(r => console.log(`   • ${r.type}: ${r.count}`));
    
    console.log('\n✨ Fleet data updated successfully!');
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

updateFleetData();
