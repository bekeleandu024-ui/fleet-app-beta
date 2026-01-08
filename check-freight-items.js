const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function main() {
  try {
    const result = await pool.query(
      'SELECT * FROM order_freight_items WHERE order_id = $1',
      ['322fd06c-0a32-4294-9eed-b9e734025707']
    );
    console.log('Freight items:', JSON.stringify(result.rows, null, 2));
    console.log('Count:', result.rows.length);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
