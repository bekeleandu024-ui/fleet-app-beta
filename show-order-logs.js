
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function showOrderLogs() {
  const target = process.argv[2]; // Optional Order ID or Number

  try {
    const client = await pool.connect();
    try {
      let orderQuery = `SELECT * FROM orders ORDER BY created_at DESC LIMIT 1`;
      let orderParams = [];

      if (target) {
        // Try to match UUID or Order Number
        if (target.length === 36 && target.includes('-')) {
             orderQuery = `SELECT * FROM orders WHERE id = $1`;
        } else {
             orderQuery = `SELECT * FROM orders WHERE order_number ILIKE $1 OR reference ILIKE $1`;
        }
        orderParams = [target];
      }

      const orderRes = await client.query(orderQuery, orderParams);
      
      if (orderRes.rows.length === 0) {
        console.log('No order found.');
        return;
      }

      const order = orderRes.rows[0];
      console.log('\n==================================================');
      console.log(`ORDER REPORT: ${order.order_number || 'N/A'} (ID: ${order.id})`);
      console.log('==================================================');
      console.log(`Customer: ${order.customer_id || order.customer_name}`);
      console.log(`Status:   ${order.status}`);
      console.log(`Created:  ${new Date(order.created_at).toLocaleString()}`);
      console.log(`Updated:  ${new Date(order.updated_at).toLocaleString()}`);
      console.log(`Route:    ${order.pickup_location} -> ${order.dropoff_location}`);
      
      // Find Trips
      const tripsRes = await client.query(`
        SELECT t.*, d.driver_name, u.unit_number 
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        WHERE t.order_id = $1 
        ORDER BY t.created_at DESC
      `, [order.id]);

      if (tripsRes.rows.length === 0) {
        console.log('\n[!] No trips associated with this order.');
      } else {
        for (const trip of tripsRes.rows) {
          console.log('\n--------------------------------------------------');
          console.log(`TRIP: ${trip.trip_number || trip.id} (${trip.status})`);
          console.log('--------------------------------------------------');
          console.log(`Driver:   ${trip.driver_name || 'Unassigned'}`);
          console.log(`Unit:     ${trip.unit_number || 'Unassigned'}`);
          console.log(`Created:  ${new Date(trip.created_at).toLocaleString()}`);
          
          // Trip Costs
          const costsRes = await client.query(`SELECT * FROM trip_costs WHERE order_id = $1`, [trip.order_id]);
          if (costsRes.rows.length > 0) {
             const cost = costsRes.rows[0];
             console.log(`\n  $$ Financials:`);
             console.log(`  - Revenue:    $${Number(cost.revenue).toFixed(2)}`);
             console.log(`  - Cost:       $${Number(cost.total_cost).toFixed(2)}`);
             console.log(`  - Profit:     $${Number(cost.profit).toFixed(2)} (${Number(cost.margin_pct).toFixed(1)}%)`);
          }

          // Trip Events
          const eventsRes = await client.query(`
            SELECT event_type, status, occurred_at, payload, source 
            FROM trip_events 
            WHERE trip_id = $1 
            ORDER BY occurred_at DESC
          `, [trip.id]);

          console.log(`\n  >> Activity Log (${eventsRes.rows.length} events):`);
          if (eventsRes.rows.length === 0) {
            console.log('  (No events recorded)');
          } else {
            eventsRes.rows.forEach(evt => {
               const time = new Date(evt.occurred_at).toLocaleString();
               let details = '';
               if (evt.payload) {
                   try {
                       const p = typeof evt.payload === 'string' ? JSON.parse(evt.payload) : evt.payload;
                       if (p.location) details += ` @ ${p.location}`;
                       if (p.notes) details += ` [Note: ${p.notes}]`;
                       if (p.stopLabel) details += ` (${p.stopLabel})`;
                   } catch (e) {}
               }
               console.log(`  [${time}] ${evt.event_type.padEnd(20)} | ${evt.source} ${details}`);
            });
          }
        }
      }
      console.log('\n==================================================\n');

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

showOrderLogs();
