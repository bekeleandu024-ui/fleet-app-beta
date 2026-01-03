const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function main() {
  try {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'driver_profiles' ORDER BY ordinal_position`
    );
    console.log('driver_profiles columns:', res.rows.map(c => c.column_name));
    
    const res2 = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'unit_profiles' ORDER BY ordinal_position`
    );
    console.log('unit_profiles columns:', res2.rows.map(c => c.column_name));
    
    // Test the actual query
    const res3 = await pool.query(`
      SELECT 
        dp.driver_id,
        dp.driver_name,
        COALESCE(dp.unit_number, up.unit_number) AS unit_number,
        dp.driver_type,
        dp.driver_category,
        dp.oo_zone AS region,
        COALESCE(dp.current_status, dp.status, 'Available') AS status,
        dp.hos_hours_remaining,
        dp.base_wage_cpm,
        dp.effective_wage_cpm,
        COALESCE(dp.is_active, true) AS is_active
      FROM driver_profiles dp
      LEFT JOIN unit_profiles up ON dp.driver_id = up.driver_id
      WHERE dp.is_active = true OR dp.is_active IS NULL
      ORDER BY dp.driver_name ASC
      LIMIT 3
    `);
    console.log('Query result:', res3.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

main();
