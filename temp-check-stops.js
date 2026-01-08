const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function check() {
  const result = await pool.query(`
    SELECT os.order_id, os.stop_type, os.city, os.state, os.appointment_start, os.appointment_type 
    FROM order_stops os 
    JOIN orders o ON os.order_id = o.id 
    WHERE o.order_number IN ('ORD-10008', 'ORD-10009') 
    ORDER BY os.order_id, os.stop_sequence
  `);
  console.log(JSON.stringify(result.rows, null, 2));
  pool.end();
}
check();
