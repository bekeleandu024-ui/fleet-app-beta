const pool = require('./lib/db').default;

async function checkOrder() {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT * FROM orders WHERE order_number = 'ORD-10055' OR order_number = 'RCODE0002'");
    console.log("Orders found:", res.rows);
    client.release();
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkOrder();
