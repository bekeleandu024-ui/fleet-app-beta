import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { TripListItem } from "@/lib/types";
import { calculateTripCost, type DriverType } from "@/lib/costing";

// ...existing code...

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          t.*,
          d.driver_name,
          u.unit_number,
          o.customer_id as customer_name
        FROM trips t
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        LEFT JOIN orders o ON t.order_id = o.id
      `;
      
      if (statusFilter === "closed") {
        query += ` WHERE t.status IN ('closed', 'completed')`;
      } else if (statusFilter === "active") {
        query += ` WHERE (t.status NOT IN ('closed', 'completed') OR t.status IS NULL)`;
      }
      // If no filter provided, return ALL trips (including closed)
      
      query += ` ORDER BY t.created_at DESC`;

      console.log(`Fetching trips with statusFilter: ${statusFilter}`);

      const result = await client.query(query);
      
      console.log(`Found ${result.rows.length} trips`);

      const trips = result.rows.map(transformTripRow);
      return NextResponse.json(buildTripsResponse(trips));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching trips from DB:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

function transformTripRow(row: any): TripListItem {
  const statusMap: Record<string, string> = {
    planned: "Assigned",
    assigned: "Assigned",
    in_transit: "In Transit",
    en_route_to_pickup: "In Transit",
    at_pickup: "At Pickup",
    departed_pickup: "In Transit",
    at_delivery: "At Delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    closed: "Closed",
  };

  const driverName = row.driver_name || "Unknown Driver";
  const unitName = row.unit_number || "N/A";
  
  // Helper to safely convert date to ISO string
  const toISO = (date: any) => date ? new Date(date).toISOString() : new Date().toISOString();
  
  const eta = toISO(row.completed_at || row.planned_start);
  const duration = row.planned_miles ? Math.round((row.planned_miles / 50) * 10) / 10 : undefined;

  return {
    id: row.id,
    tripNumber: row.trip_number || row.id.slice(0, 8).toUpperCase(),
    driver: driverName,
    unit: unitName,
    pickup: row.pickup_location || "Unknown",
    delivery: row.dropoff_location || "Unknown",
    eta,
    status: statusMap[row.status?.toLowerCase()] || row.status || "Unknown",
    exceptions: 0,
    lastPing: toISO(row.updated_at || row.created_at),
    orderId: row.order_id,
    driverId: row.driver_id,
    customer: row.customer_name || "Unknown Customer", 
    pickupWindow: row.pickup_window_start ? new Date(row.pickup_window_start).toLocaleString() : undefined,
    distance: Number(row.planned_miles) || 0,
    duration: duration,
    commodity: "General",
    driverType: "RNR",
    totalCost: 0, // Simplified
    totalCpm: 0, // Simplified
    serviceLevel: "STANDARD",
    completedAt: (row.completed_at || row.delivery_departure || row.closed_at) 
      ? new Date(row.completed_at || row.delivery_departure || row.closed_at).toISOString() 
      : undefined,
  };
}

function buildTripsResponse(trips: TripListItem[]) {
  const active = trips.filter(t => t.status === "In Transit" || t.status === "Assigned").length;
  const late = 0;
  const exception = 0;

  return {
    stats: {
      active,
      late,
      exception,
    },
    filters: {
      statuses: Array.from(new Set(trips.map(t => t.status))).sort(),
      exceptions: ["Weather", "Mechanical", "Customer Hold"],
      dateRanges: ["Today", "48 Hours", "7 Days"],
    },
    data: trips,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      driverId: inputDriverId, 
      unitId, 
      miles, 
      stops: inputStops,
      tripType,
      rpm,
      totalRevenue,
      totalCost,
      totalCpm
    } = body;

    const client = await pool.connect();
    try {
      let stops = inputStops;
      let driverId = inputDriverId;
      let driverType: DriverType = 'RNR'; // Default
      let calculatedMiles = miles || 0;
      
      // Order data for enrichment
      let order: any = null;
      let unit: any = null;

      // Quick Create Logic: Populate missing data
      if (orderId) {
         const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
         if (orderRes.rows.length > 0) {
             order = orderRes.rows[0];
             if (!stops) {
               stops = [
                   { sequence: 1, stopType: 'Pickup', name: order.pickup_location, scheduledAt: order.pickup_time },
                   { sequence: 2, stopType: 'Delivery', name: order.dropoff_location, scheduledAt: order.dropoff_time }
               ];
             }
             
             // Try to get miles from order if not provided
             if (!calculatedMiles && order.lane_miles) {
                 calculatedMiles = Number(order.lane_miles);
             }
         }
      }
      
      // Get unit data for capacity/utilization calculation
      if (unitId) {
        const unitRes = await client.query('SELECT * FROM unit_profiles WHERE unit_id = $1', [unitId]);
        if (unitRes.rows.length > 0) {
          unit = unitRes.rows[0];
        }
      }

      // Context data for denormalized fields (for historical accuracy)
      let driverName: string | null = null;
      let unitNumber: string | null = null;
      let customerName: string | null = null;
      let lane: string | null = null;

      if (!driverId && unitId) {
          // Try to find driver assigned to this unit
          // First get unit_number
          const unitRes = await client.query('SELECT unit_number FROM unit_profiles WHERE unit_id = $1', [unitId]);
          if (unitRes.rows.length > 0) {
              unitNumber = unitRes.rows[0].unit_number;
              const driverRes = await client.query('SELECT driver_id, driver_type, driver_name FROM driver_profiles WHERE unit_number = $1', [unitNumber]);
              if (driverRes.rows.length > 0) {
                  driverId = driverRes.rows[0].driver_id;
                  driverType = (driverRes.rows[0].driver_type as DriverType) || 'RNR';
                  driverName = driverRes.rows[0].driver_name;
              }
          }
      } else if (driverId) {
          const driverRes = await client.query('SELECT driver_type, driver_name, unit_number FROM driver_profiles WHERE driver_id = $1', [driverId]);
          if (driverRes.rows.length > 0) {
              driverType = (driverRes.rows[0].driver_type as DriverType) || 'RNR';
              driverName = driverRes.rows[0].driver_name;
              unitNumber = driverRes.rows[0].unit_number;
          }
      }

      // Get customer name from order (customer_id IS the customer name in this system)
      if (order) {
          customerName = order.customer_id || order.customer_name;
          lane = order.lane;
      }

      // Calculate costs if missing but we have enough info
      let finalCost = Number(totalCost) || 0;
      let finalRevenue = Number(totalRevenue) || 0;
      let finalCpm = Number(totalCpm) || 0;

      if (finalCost === 0 && calculatedMiles > 0 && driverId) {
          const pickupStop = stops?.find((s: any) => s.stopType === 'Pickup');
          const deliveryStop = stops?.find((s: any) => s.stopType === 'Delivery');
          
          const costResult = calculateTripCost(
              driverType,
              calculatedMiles,
              pickupStop?.name || '',
              deliveryStop?.name || '',
              { pickups: 1, deliveries: 1 }
          );
          
          finalCost = costResult.fullyAllocatedCost;
          finalCpm = costResult.totalCPM;
          if (finalRevenue === 0) {
              finalRevenue = costResult.recommendedRevenue;
          }
      }
      
      // If still no revenue, try to get from order's quoted_rate
      if (finalRevenue === 0 && order?.quoted_rate) {
        finalRevenue = Number(order.quoted_rate);
      }

      await client.query('BEGIN');

      // Extract locations from stops
      const pickupStop = stops?.find((s: any) => s.stopType === 'Pickup');
      const deliveryStop = stops?.find((s: any) => s.stopType === 'Delivery');
      
      const pickupLocation = pickupStop?.name || order?.pickup_location || "Unknown";
      const dropoffLocation = deliveryStop?.name || order?.dropoff_location || "Unknown";
      const plannedStart = pickupStop?.scheduledAt || order?.pickup_time || new Date().toISOString();
      
      // Time windows - copy from order or derive from stop times
      const pickupWindowStart = order?.pu_window_start || (pickupStop?.scheduledAt ? new Date(new Date(pickupStop.scheduledAt).getTime() - 2*60*60*1000) : null);
      const pickupWindowEnd = order?.pu_window_end || (pickupStop?.scheduledAt ? new Date(new Date(pickupStop.scheduledAt).getTime() + 2*60*60*1000) : null);
      const deliveryWindowStart = order?.del_window_start || (deliveryStop?.scheduledAt ? new Date(new Date(deliveryStop.scheduledAt).getTime() - 2*60*60*1000) : null);
      const deliveryWindowEnd = order?.del_window_end || (deliveryStop?.scheduledAt ? new Date(new Date(deliveryStop.scheduledAt).getTime() + 4*60*60*1000) : null);
      
      // Cargo data from order
      const currentWeight = order?.total_weight || 0;
      const currentCube = order?.cubic_feet || 0;
      const currentLinearFeet = order?.linear_feet_required || 0;
      
      // Calculate utilization
      let utilizationPercent = 0;
      let limitingFactor = null;
      if (unit && (currentWeight > 0 || currentCube > 0 || currentLinearFeet > 0)) {
        const maxWeight = unit.max_weight || 45000;
        const maxCube = unit.max_cube || 3900;
        const maxLinear = unit.linear_feet || 53;
        
        const weightUtil = (currentWeight / maxWeight) * 100;
        const cubeUtil = (currentCube / maxCube) * 100;
        const linearUtil = (currentLinearFeet / maxLinear) * 100;
        
        utilizationPercent = Math.max(weightUtil, cubeUtil, linearUtil);
        
        if (weightUtil >= cubeUtil && weightUtil >= linearUtil) {
          limitingFactor = 'Weight';
        } else if (cubeUtil >= weightUtil && cubeUtil >= linearUtil) {
          limitingFactor = 'Cube';
        } else {
          limitingFactor = 'Linear Feet';
        }
      }
      
      // Calculate margin
      const profit = finalRevenue - finalCost;
      const marginPct = finalRevenue > 0 ? (profit / finalRevenue) * 100 : 0;
      
      // Generate lane from locations if not set
      if (!lane && pickupLocation && dropoffLocation) {
          const pickupCity = pickupLocation.split(',')[0]?.trim();
          const dropoffCity = dropoffLocation.split(',')[0]?.trim();
          if (pickupCity && dropoffCity) {
              lane = `${pickupCity} → ${dropoffCity}`;
          }
      }

      // Calculate estimated fuel (assuming 6.5 MPG for trucks)
      const AVG_MPG = 6.5;
      const estimatedFuelGallons = calculatedMiles > 0 ? Math.round((calculatedMiles / AVG_MPG) * 100) / 100 : null;
      
      // Generate trip number
      const tripNumber = `TRP-${Date.now().toString().slice(-8)}`;

      // Create Trip with ALL required fields populated
      const tripRes = await client.query(`
        INSERT INTO trips (
          id,
          trip_number,
          order_id,
          driver_id,
          unit_id,
          status,
          pickup_location,
          dropoff_location,
          pickup_window_start,
          pickup_window_end,
          delivery_window_start,
          delivery_window_end,
          planned_start,
          planned_miles,
          distance_miles,
          actual_miles,
          estimated_fuel_gallons,
          current_weight,
          current_cube,
          current_linear_feet,
          utilization_percent,
          limiting_factor,
          revenue,
          expected_revenue,
          total_cost,
          profit,
          margin_pct,
          driver_name,
          unit_number,
          customer_name,
          lane,
          on_time_pickup,
          on_time_delivery,
          risk_level,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          'assigned',
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $12,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17,
          $18,
          $19,
          $19,
          $20,
          $21,
          $22,
          $23,
          $24,
          $25,
          $26,
          NULL,
          NULL,
          'green',
          NOW(),
          NOW()
        ) RETURNING id
      `, [
        tripNumber,
        orderId,
        driverId,
        unitId,
        pickupLocation,
        dropoffLocation,
        pickupWindowStart,
        pickupWindowEnd,
        deliveryWindowStart,
        deliveryWindowEnd,
        plannedStart,
        calculatedMiles,
        estimatedFuelGallons,
        currentWeight,
        currentCube,
        currentLinearFeet,
        Math.round(utilizationPercent),
        limitingFactor,
        finalRevenue,
        finalCost,
        profit,
        marginPct.toFixed(2),
        driverName,
        unitNumber,
        customerName,
        lane
      ]);

      const tripId = tripRes.rows[0].id;

      // Insert Trip Costs for detailed audit trail
      await client.query(`
        INSERT INTO trip_costs (
          cost_id,
          trip_id,
          order_id,
          driver_id,
          unit_id,
          driver_type,
          miles,
          actual_miles,
          total_cpm,
          total_cost,
          revenue,
          rpm,
          profit,
          margin_pct,
          is_profitable,
          calculation_formula,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5,
          $6,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          NOW(),
          NOW()
        )
      `, [
        tripId,
        orderId,
        driverId,
        unitId,
        driverType,
        calculatedMiles,
        finalCpm,
        finalCost,
        finalRevenue,
        rpm || (calculatedMiles > 0 ? finalRevenue / calculatedMiles : 0),
        profit,
        marginPct,
        profit > 0,
        JSON.stringify({ method: 'booking_auto_calc', driverType, miles: calculatedMiles })
      ]);

      // Insert Stops
      if (stops && stops.length > 0) {
        for (const stop of stops) {
           await client.query(`
            INSERT INTO trip_stops (
              id,
              trip_id,
              sequence,
              type,
              location,
              window_start,
              created_at,
              updated_at
            ) VALUES (
              gen_random_uuid(),
              $1,
              $2,
              $3,
              $4,
              $5,
              NOW(),
              NOW()
            )
           `, [
             tripId,
             stop.sequence,
             stop.stopType,
             stop.name,
             stop.scheduledAt
           ]);
        }
      }

      // Update Order Status
      await client.query(`
        UPDATE orders 
        SET status = 'Planning', updated_at = NOW() 
        WHERE id = $1
      `, [orderId]);

      await client.query('COMMIT');
      
      console.log(`[Trip Create] Created trip ${tripNumber} with:`, {
        revenue: finalRevenue,
        cost: finalCost,
        margin: marginPct.toFixed(2),
        utilization: Math.round(utilizationPercent),
        timeWindows: { pickupWindowStart, deliveryWindowStart }
      });

      return NextResponse.json({ success: true, id: tripId, tripNumber });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}


