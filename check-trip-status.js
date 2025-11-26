
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fleet',
  user: 'postgres',
  password: 'postgres',
});

async function check() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT 
        t.id as trip_id, 
        t.status as trip_status, 
        t.order_id, 
        o.status as order_status,
        o.customer_id
      FROM trips t
      LEFT JOIN orders o ON t.order_id = o.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

check();
