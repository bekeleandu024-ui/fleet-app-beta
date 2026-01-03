const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function assignYards() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert the 3 yard locations
    const yards = await client.query(`
      INSERT INTO customers (name, full_address, city, has_trailer_pool, pool_count_empty) VALUES
        ('Home Base Yard - Guelph', '100 Speedvale Ave W, Guelph, ON N1H 1C4', 'Guelph', true, 20),
        ('Kitchener Yard', '500 Fairway Road S, Kitchener, ON N2C 1X3', 'Kitchener', true, 15),
        ('Guelph Yard 2', '425 Woodlawn Road W, Guelph, ON N1H 7M1', 'Guelph', true, 10)
      ON CONFLICT (full_address) DO UPDATE SET name = EXCLUDED.name
      RETURNING customer_id, name
    `);
    
    console.log('🏢 Yards created/updated:');
    yards.rows.forEach(y => console.log('   •', y.name));
    
    // Get yard IDs
    const yardIds = await client.query(`
      SELECT customer_id, name FROM customers 
      WHERE name LIKE '%Yard%' AND city IN ('Guelph', 'Kitchener') 
      ORDER BY name
    `);
    const homeBase = yardIds.rows.find(r => r.name.includes('Home Base'));
    const kitchener = yardIds.rows.find(r => r.name.includes('Kitchener'));
    const guelph2 = yardIds.rows.find(r => r.name.includes('Yard 2'));
    
    // Update units with locations distributed by modulo
    const result = await client.query(`
      WITH numbered_units AS (
        SELECT unit_id, unit_number, ROW_NUMBER() OVER (ORDER BY unit_number) as rn
        FROM unit_profiles
      )
      UPDATE unit_profiles up
      SET current_location_id = CASE 
        WHEN nu.rn % 3 = 1 THEN $1::uuid
        WHEN nu.rn % 3 = 2 THEN $2::uuid
        ELSE $3::uuid
      END
      FROM numbered_units nu
      WHERE up.unit_id = nu.unit_id
      RETURNING up.unit_number
    `, [homeBase.customer_id, kitchener.customer_id, guelph2.customer_id]);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Updated', result.rowCount, 'units with yard locations');
    
    // Show distribution
    const dist = await client.query(`
      SELECT c.name, COUNT(*) as units
      FROM unit_profiles up
      JOIN customers c ON up.current_location_id = c.customer_id
      GROUP BY c.name
      ORDER BY c.name
    `);
    console.log('\n📊 Distribution:');
    dist.rows.forEach(r => console.log('   •', r.name + ':', r.units, 'units'));
    
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

assignYards();
