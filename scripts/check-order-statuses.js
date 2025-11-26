const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet';

const pool = new Pool({
  connectionString,
});

async function checkOrderStatuses() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT status, COUNT(*) 
      FROM orders 
      GROUP BY status
    `);
    
    console.log('Order Status Counts:');
    res.rows.forEach(row => {
      console.log(`${row.status}: ${row.count}`);
    });

  } catch (err) {
    console.error('Error checking orders:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkOrderStatuses();
