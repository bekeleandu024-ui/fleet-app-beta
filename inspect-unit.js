const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkUnit() {
  try {
    const unitId = '8d91662a-d027-4a2f-9262-9ae7f873d71a';
    
    console.log('--- UNIT ---');
    const res = await pool.query('SELECT * FROM unit_profiles WHERE unit_id = $1', [unitId]);
    console.log(JSON.stringify(res.rows[0], null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkUnit();
