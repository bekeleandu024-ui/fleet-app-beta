const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function debug() {
  try {
    // Test the exact query from the API
    console.log('=== Testing Farm-Out API Query ===');
    const result = await pool.query(`
        SELECT 
          t.id,
          t.trip_number,
          t.order_id,
          t.order_ids,
          t.status as trip_status,
          t.driver_id,
          t.pickup_location,
          t.dropoff_location,
          t.pickup_window_start,
          t.delivery_window_start,
          t.pickup_departure,
          t.delivery_arrival,
          t.completed_at,
          t.created_at,
          t.updated_at,
          t.pod_url,
          o.dispatch_status,
          o.posted_to_carriers,
          o.posted_at,
          o.billing_status,
          o.quoted_rate as total_rate,
          o.total_weight_lbs as total_weight,
          o.order_number,
          o.customer_name,
          o.customer_id,
          o.equipment_type,
          o.pickup_location as order_pickup,
          o.dropoff_location as order_dropoff,
          o.pickup_time,
          o.dropoff_time,
          (SELECT COUNT(*) FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'PENDING') as bid_count,
          (SELECT MIN(cb.bid_amount) FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'PENDING') as lowest_bid,
          (SELECT cb.carrier_name FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'ACCEPTED' LIMIT 1) as carrier_name,
          (SELECT cb.bid_amount FROM carrier_bids cb WHERE cb.order_id = t.order_id AND cb.status = 'ACCEPTED' LIMIT 1) as awarded_amount
        FROM trips t
        LEFT JOIN orders o ON o.id = t.order_id
        WHERE t.driver_id IS NULL
          OR o.dispatch_status IN ('BROKERAGE_PENDING', 'POSTED_EXTERNAL', 'COVERED_EXTERNAL', 'IN_TRANSIT_EXTERNAL', 'DELIVERED_EXTERNAL', 'CLOSED_EXTERNAL')
        ORDER BY t.created_at DESC
      `);

    console.log('Found', result.rows.length, 'trips');
    console.log(JSON.stringify(result.rows.slice(0, 2), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

debug();
