
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fleet',
  user: 'postgres',
  password: 'postgres',
});

async function sync() {
  const client = await pool.connect();
  try {
    console.log('Syncing order statuses...');
    
    // Find trips that are completed but order is not Delivered
    const res = await client.query(`
      SELECT t.id, t.status as trip_status, t.order_id, o.status as order_status
      FROM trips t
      JOIN orders o ON t.order_id = o.id::text
      WHERE t.status = 'completed' AND o.status != 'Delivered'
    `);
    
    console.log(`Found ${res.rows.length} mismatched orders.`);
    
    for (const row of res.rows) {
      console.log(`Updating order ${row.order_id} to Delivered (Trip ${row.id} is completed)`);
      await client.query(`
        UPDATE orders SET status = 'Delivered', updated_at = NOW() WHERE id = $1
      `, [row.order_id]);
    }

    // Find trips that are in_transit but order is not In Transit
    const res2 = await client.query(`
      SELECT t.id, t.status as trip_status, t.order_id, o.status as order_status
      FROM trips t
      JOIN orders o ON t.order_id = o.id::text
      WHERE t.status = 'in_transit' AND o.status != 'In Transit' AND o.status != 'Delivered'
    `);

    console.log(`Found ${res2.rows.length} mismatched in-transit orders.`);
    
    for (const row of res2.rows) {
      console.log(`Updating order ${row.order_id} to In Transit (Trip ${row.id} is in_transit)`);
      await client.query(`
        UPDATE orders SET status = 'In Transit', updated_at = NOW() WHERE id = $1
      `, [row.order_id]);
    }
    
    console.log('Sync complete.');
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

sync();
