const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function verifyOrderLifecycle(orderId) {
  try {
    await client.connect();
    console.log('Connected to database.');

    let order;
    if (orderId) {
      const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      order = orderRes.rows[0];
    } else {
      console.log('No order ID provided, fetching most recent order...');
      const orderRes = await client.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1');
      order = orderRes.rows[0];
    }

    if (!order) {
      console.log('No order found.');
      return;
    }

    console.log('\n=== 1. ORDERS SERVICE (Container: orders) ===');
    console.log(`Order ID: ${order.id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Customer: ${order.customer_id}`);
    console.log(`Created At: ${order.created_at}`);
    console.log('✅ Order record found in orders table.');

    // Check Dispatch
    console.log('\n=== 2. DISPATCH SERVICE (Container: dispatch) ===');
    const dispatchRes = await client.query('SELECT * FROM dispatches WHERE order_id = $1', [order.id]);
    if (dispatchRes.rows.length > 0) {
      const dispatch = dispatchRes.rows[0];
      console.log(`Dispatch ID: ${dispatch.id}`);
      console.log(`Driver ID: ${dispatch.driver_id}`);
      console.log(`Status: ${dispatch.status}`);
      console.log('✅ Dispatch record found in dispatches table.');

      // Check Master Data (Driver)
      console.log('\n=== 3. MASTER DATA SERVICE (Container: master-data) ===');
      if (dispatch.driver_id) {
        // Try to find by uuid or string, depending on schema. Schema says uuid but dispatch has varchar.
        // Let's try to match.
        const driverRes = await client.query('SELECT * FROM driver_profiles WHERE driver_id::text = $1', [dispatch.driver_id]);
        if (driverRes.rows.length > 0) {
          const driver = driverRes.rows[0];
          console.log(`Driver Name: ${driver.driver_name}`);
          console.log(`Unit Number: ${driver.unit_number}`);
          console.log('✅ Driver profile found in driver_profiles table.');
        } else {
          console.log('⚠️ Driver profile not found (might be a test driver ID).');
        }
      } else {
        console.log('⚠️ No driver assigned yet.');
      }

    } else {
      console.log('⚠️ No dispatch record found for this order.');
    }

    // Check Trips (often shared or part of Tracking/Dispatch)
    console.log('\n=== 4. TRIP MANAGEMENT (Container: dispatch/tracking) ===');
    const tripRes = await client.query('SELECT * FROM trips WHERE order_id = $1', [order.id]);
    let tripId;
    if (tripRes.rows.length > 0) {
      const trip = tripRes.rows[0];
      tripId = trip.id;
      console.log(`Trip ID: ${trip.id}`);
      console.log(`Status: ${trip.status}`);
      console.log(`Planned Miles: ${trip.planned_miles}`);
      console.log('✅ Trip record found in trips table.');
    } else {
      console.log('⚠️ No trip record found for this order.');
    }

    // Check Tracking (Locations)
    console.log('\n=== 5. TRACKING SERVICE (Container: tracking) ===');
    if (tripId) {
      const locRes = await client.query('SELECT COUNT(*) as count FROM trip_locations WHERE trip_id = $1', [tripId]);
      const count = locRes.rows[0].count;
      console.log(`Recorded Locations: ${count}`);
      if (count > 0) {
        console.log('✅ Location history found in trip_locations table.');
      } else {
        console.log('⚠️ No location history found (trip might not have started or no pings).');
      }
    } else {
      console.log('⚠️ Cannot check locations without a trip ID.');
    }

    // Check Events
    console.log('\n=== 6. EVENT LOG (Container: all) ===');
    if (tripId) {
        const eventsRes = await client.query('SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY occurred_at ASC', [tripId]);
        console.log(`Total Events: ${eventsRes.rows.length}`);
        eventsRes.rows.forEach(e => {
            console.log(` - [${e.occurred_at.toISOString()}] ${e.event_type} (${e.source})`);
        });
        if (eventsRes.rows.length > 0) {
            console.log('✅ Event history found in trip_events table.');
        }
    } else {
        console.log('⚠️ Cannot check events without a trip ID.');
    }

  } catch (err) {
    console.error('Error verifying order lifecycle:', err);
  } finally {
    await client.end();
    console.log('\nDisconnected.');
  }
}

const orderId = process.argv[2];
verifyOrderLifecycle(orderId);
