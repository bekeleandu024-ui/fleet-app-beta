import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';
import { calculateTripCost, type DriverType, isCrossBorder } from '@/lib/costing';

// POST /api/dispatch/trips - Create a trip from draft and assign to resource
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, orderIds, resourceId, resourceType } = body;

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No orders provided' },
        { status: 400 }
      );
    }

    // Deduplicate order IDs
    const uniqueOrderIds = [...new Set(orderIds as string[])];

    // Generate a shared trip number
    const tripNumber = `TRP-${Date.now().toString(36).toUpperCase()}`;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch order details to populate trip fields (including customer info)
      const ordersResult = await client.query(`
        SELECT 
          id, 
          pickup_location, 
          dropoff_location,
          pickup_time,
          dropoff_time,
          total_weight_lbs,
          quoted_rate,
          customer_id,
          customer_name
        FROM orders 
        WHERE id = ANY($1)
      `, [uniqueOrderIds]);

      const orders = ordersResult.rows;
      if (orders.length === 0) {
        throw new Error('No orders found');
      }

      // Use first order for primary locations, aggregate totals
      const primaryOrder = orders[0];
      const totalWeight = orders.reduce((sum, o) => sum + (parseFloat(o.total_weight_lbs) || 0), 0);
      const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.quoted_rate) || 0), 0);

      // Get unit_id and driver details if assigning to driver
      let unitId = null;
      let driverName = null;
      let unitNumber = null;
      let driverType: DriverType = 'COM';
      
      if (resourceType === 'driver' && resourceId) {
        // Fetch driver info and their assigned unit
        const driverResult = await client.query(`
          SELECT 
            dp.driver_name,
            dp.driver_type,
            dp.unit_number as driver_unit_number,
            up.unit_id,
            up.unit_number
          FROM driver_profiles dp
          LEFT JOIN unit_profiles up ON dp.driver_id = up.driver_id
          WHERE dp.driver_id = $1
        `, [resourceId]);
        
        if (driverResult.rows.length > 0) {
          const driver = driverResult.rows[0];
          driverName = driver.driver_name;
          unitId = driver.unit_id;
          unitNumber = driver.unit_number || driver.driver_unit_number;
          driverType = (driver.driver_type as DriverType) || 'COM';
        }
      }

      // Create ONE trip for all orders (consolidated shipment)
      const newTripId = randomUUID();

      await client.query(`
        INSERT INTO trips (
          id,
          order_id,
          order_ids,
          trip_number,
          status,
          driver_id,
          driver_name,
          unit_id,
          unit_number,
          customer_id,
          customer_name,
          revenue,
          pickup_location,
          dropoff_location,
          pickup_window_start,
          delivery_window_start,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3::uuid[], $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      `, [
        newTripId,
        primaryOrder.id,  // Use first order as primary (for backwards compatibility)
        uniqueOrderIds,   // All order IDs in the consolidated trip
        tripNumber,
        'ASSIGNED',
        resourceType === 'driver' ? resourceId : null,
        driverName,
        unitId,
        unitNumber,
        primaryOrder.customer_id,
        primaryOrder.customer_name || primaryOrder.customer_id,
        totalRevenue,
        primaryOrder.pickup_location || 'TBD',
        primaryOrder.dropoff_location || 'TBD',
        primaryOrder.pickup_time,
        primaryOrder.dropoff_time,
      ]);

      // Update ALL orders with the same trip assignment
      for (const orderId of uniqueOrderIds) {
        await client.query(`
          UPDATE orders 
          SET 
            dispatch_status = $1,
            assigned_driver_id = $2,
            updated_at = NOW()
          WHERE id = $3
        `, [
          resourceType === 'driver' ? 'FLEET_DISPATCH' : 'BROKERAGE_PENDING',
          resourceType === 'driver' ? resourceId : null,
          orderId,
        ]);
      }

      // Auto-calculate trip costs if driver is assigned
      if (resourceType === 'driver' && resourceId && driverType) {
        try {
          // Try to get distance from multiple sources
          let miles = 500; // Default fallback
          
          // Option 1: Check if order has stops with coordinates for distance calc
          const stopsResult = await client.query(`
            SELECT 
              os.city, os.state, os.latitude, os.longitude, os.stop_type
            FROM order_stops os
            WHERE os.order_id = $1
            ORDER BY os.stop_sequence
          `, [primaryOrder.id]);
          
          if (stopsResult.rows.length >= 2) {
            const pickupStop = stopsResult.rows.find((s: { stop_type: string }) => s.stop_type === 'pickup');
            const deliveryStop = [...stopsResult.rows].reverse().find((s: { stop_type: string }) => s.stop_type === 'delivery');
            
            if (pickupStop?.latitude && deliveryStop?.latitude) {
              // Calculate haversine distance with road multiplier
              const R = 3959; // Earth radius in miles
              const dLat = (deliveryStop.latitude - pickupStop.latitude) * Math.PI / 180;
              const dLon = (deliveryStop.longitude - pickupStop.longitude) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(pickupStop.latitude * Math.PI / 180) * Math.cos(deliveryStop.latitude * Math.PI / 180) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              miles = Math.round(R * c * 1.3); // 1.3 road multiplier
            }
          }
          
          // Option 2: Check lane_profiles for cached distance (table may not exist)
          // Use SAVEPOINT to prevent transaction abort if table doesn't exist
          if (miles === 500) {
            try {
              await client.query('SAVEPOINT lane_check');
              const laneResult = await client.query(`
                SELECT distance_miles FROM lane_profiles 
                WHERE LOWER(origin_city) = LOWER($1) 
                AND LOWER(destination_city) = LOWER($2)
                LIMIT 1
              `, [
                primaryOrder.pickup_location?.split(',')[0]?.trim() || '',
                primaryOrder.dropoff_location?.split(',')[0]?.trim() || ''
              ]);
              await client.query('RELEASE SAVEPOINT lane_check');
              if (laneResult.rows[0]?.distance_miles) {
                miles = parseFloat(laneResult.rows[0].distance_miles);
              }
            } catch {
              // lane_profiles table may not exist, rollback to savepoint and continue
              await client.query('ROLLBACK TO SAVEPOINT lane_check');
            }
          }

          const pickupLoc = primaryOrder.pickup_location || '';
          const dropoffLoc = primaryOrder.dropoff_location || '';
          const borderCrossings = isCrossBorder(pickupLoc, dropoffLoc) ? 1 : 0;

          const costResult = calculateTripCost(
            driverType,
            miles,
            pickupLoc,
            dropoffLoc,
            { 
              pickups: uniqueOrderIds.length, 
              deliveries: uniqueOrderIds.length,
              borderCrossings 
            }
          );

          const profit = totalRevenue - costResult.fullyAllocatedCost;
          const marginPct = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
          const rpm = miles > 0 ? totalRevenue / miles : 0;
          const cpm = miles > 0 ? costResult.fullyAllocatedCost / miles : 0;

          // Insert trip cost record - matches actual trip_costs schema
          // Generated columns (don't insert): total_miles, total_cost, profit
          await client.query(`
            INSERT INTO trip_costs (
              trip_id,
              driver_id,
              unit_id,
              driver_type,
              linehaul_miles,
              deadhead_miles,
              revenue,
              fixed_cost,
              labor_cost,
              fuel_cost,
              maintenance_cost,
              events_cost,
              border_crossings,
              pickup_count,
              delivery_count,
              margin_pct,
              cost_per_mile,
              revenue_per_mile,
              calculation_source,
              calculated_at,
              created_at,
              updated_at
            ) VALUES (
              $1::uuid,
              $2::uuid,
              $3::uuid,
              $4,
              $5,
              0,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13,
              $13,
              $14,
              $15,
              $16,
              'auto_dispatch',
              NOW(),
              NOW(),
              NOW()
            )
          `, [
            newTripId,
            resourceId,
            unitId,
            driverType,
            miles,
            totalRevenue,
            costResult.mileageCosts.subtotal || 0,
            costResult.mileageCosts.wage || 0,
            costResult.mileageCosts.fuel || 0,
            (costResult.mileageCosts.truckMaint || 0) + (costResult.mileageCosts.trailerMaint || 0),
            costResult.eventCosts?.subtotal || 0,
            borderCrossings,
            uniqueOrderIds.length,
            marginPct,
            cpm,
            rpm,
          ]);

          // Update trip with cost data (these are regular columns on trips table)
          await client.query(`
            UPDATE trips 
            SET 
              total_cost = $1,
              margin_pct = $2,
              profit = $3
            WHERE id = $4
          `, [costResult.fullyAllocatedCost, marginPct, profit, newTripId]);

        } catch (costError) {
          console.warn('Failed to auto-calculate trip costs:', costError);
          // Don't fail the transaction - costs can be calculated later
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({ 
        success: true, 
        data: { 
          tripId: newTripId,
          tripNumber,
          orderCount: uniqueOrderIds.length 
        } 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

// GET /api/dispatch/trips - Fetch all active trips
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.trip_number,
        t.status,
        t.driver_id,
        d.driver_name,
        t.created_at,
        COUNT(o.id) AS order_count,
        SUM(COALESCE(o.total_weight_lbs, 0)) AS total_weight,
        SUM(COALESCE(o.quoted_rate, 0)) AS total_revenue
      FROM trips t
      LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
      LEFT JOIN orders o ON o.trip_id = t.id
      WHERE t.status IN ('ASSIGNED', 'IN_TRANSIT', 'PLANNING')
      GROUP BY t.id, t.trip_number, t.status, t.driver_id, d.driver_name, t.created_at
      ORDER BY t.created_at DESC
    `);

    const trips = result.rows.map(row => ({
      id: row.id,
      tripNumber: row.trip_number,
      status: row.status,
      driverId: row.driver_id,
      driverName: row.driver_name,
      createdAt: row.created_at,
      orderCount: parseInt(row.order_count) || 0,
      totalWeight: parseFloat(row.total_weight) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
    }));

    return NextResponse.json({ success: true, data: trips });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}
