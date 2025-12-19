import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { serviceFetch, ServiceError } from "@/lib/service-client";
import { mapTripListItem } from "@/lib/transformers";
import pool from "@/lib/db";
import { calculateTripCost, type DriverType } from "@/lib/costing";

// Helper function to calculate distance if missing
async function calculateTripDistance(tripId: string, pickupLat?: number, pickupLng?: number, dropoffLat?: number, dropoffLng?: number) {
  try {
    // If we have coordinates, calculate distance
    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/distance/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: pickupLat, lng: pickupLng },
          destination: { lat: dropoffLat, lng: dropoffLng }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the trip record with the calculated distance
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/distance/trip/${tripId}`, {
          method: 'POST'
        }).catch(err => console.warn('Failed to update trip distance:', err));
        
        return {
          distance_miles: parseFloat(data.distanceMiles),
          duration_hours: parseFloat(data.durationHours)
        };
      }
    }
  } catch (error) {
    console.warn('Distance calculation failed:', error);
  }
  return null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tripCheck = await client.query('SELECT id, driver_id, unit_id, planned_miles FROM trips WHERE id = $1', [id]);
      if (tripCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }
      
      const trip = tripCheck.rows[0];

      await client.query('UPDATE trips SET order_id = $1 WHERE id = $2', [orderId, id]);
      await client.query("UPDATE orders SET status = 'Planning' WHERE id = $1", [orderId]);

      // Calculate and insert costs if we have driver and order info
      if (trip.driver_id) {
          const orderRes = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
          if (orderRes.rows.length > 0) {
              const order = orderRes.rows[0];
              let miles = Number(trip.planned_miles) || Number(order.lane_miles) || 0;
              
              if (miles > 0) {
                  // Get driver type
                  const driverRes = await client.query('SELECT driver_type FROM driver_profiles WHERE driver_id = $1', [trip.driver_id]);
                  const driverType = (driverRes.rows[0]?.driver_type as DriverType) || 'RNR';
                  
                  const costResult = calculateTripCost(
                      driverType,
                      miles,
                      order.pickup_location || '',
                      order.dropoff_location || '',
                      { pickups: 1, deliveries: 1 }
                  );
                  
                  // Check if cost already exists
                  const costCheck = await client.query('SELECT cost_id FROM trip_costs WHERE trip_id = $1', [id]);
                  
                  if (costCheck.rows.length === 0) {
                      const revenue = 0; // We might not have revenue yet
                      const profit = revenue - costResult.fullyAllocatedCost;
                      
                      await client.query(`
                        INSERT INTO trip_costs (
                          cost_id,
                          trip_id,
                          order_id,
                          driver_id,
                          unit_id,
                          driver_type,
                          miles,
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
                        id,
                        orderId,
                        trip.driver_id,
                        trip.unit_id,
                        driverType,
                        miles,
                        costResult.totalCPM,
                        costResult.fullyAllocatedCost,
                        revenue,
                        0, // rpm
                        profit,
                        0, // margin
                        false,
                        JSON.stringify({ method: 'auto_calc_on_assign' })
                      ]);
                  }
              }
          }
      }

      await client.query('COMMIT');

      return NextResponse.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating trip:", error);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const trip = await serviceFetch<Record<string, any>>("tracking", `/api/trips/${id}`);

    // Calculate distance if missing
    if (!trip.distance_miles && trip.pickup_lat && trip.pickup_lng && trip.dropoff_lat && trip.dropoff_lng) {
      const calculated = await calculateTripDistance(
        id,
        trip.pickup_lat,
        trip.pickup_lng,
        trip.dropoff_lat,
        trip.dropoff_lng
      );
      if (calculated) {
        trip.distance_miles = calculated.distance_miles;
        trip.duration_hours = calculated.duration_hours;
      }
    }

    const driversQuery = `
      SELECT d.driver_id as id, d.driver_name as name, d.driver_type, d.unit_number, u.truck_weekly_cost as "truckWk", d.region
      FROM driver_profiles d
      LEFT JOIN unit_profiles u ON d.unit_number = u.unit_number
    `;
    const unitsQuery = `SELECT unit_id as id, unit_number, truck_weekly_cost, region, max_weight, max_cube, linear_feet, unit_type FROM unit_profiles`;
    const tripNumberQuery = `SELECT trip_number FROM trips WHERE id = $1`;
    const tripCostsQuery = `SELECT * FROM trip_costs WHERE trip_id = $1 ORDER BY created_at DESC LIMIT 1`;

    const [orderResult, driversResult, unitsResult, eventsResult, exceptionsResult, tripNumberResult, tripCostsResult] = await Promise.allSettled([
      trip.order_id
        ? serviceFetch<Record<string, any>>("orders", `/api/orders/${trip.order_id}`)
        : Promise.resolve(undefined),
      pool.query(driversQuery),
      pool.query(unitsQuery),
      serviceFetch<Array<Record<string, any>>>("tracking", `/api/trips/${id}/events`),
      serviceFetch<Array<Record<string, any>>>("tracking", `/api/trips/${id}/exceptions`),
      pool.query(tripNumberQuery, [id]),
      pool.query(tripCostsQuery, [id]),
    ]);

    const order = orderResult.status === "fulfilled" ? orderResult.value : undefined;
    const drivers = driversResult.status === "fulfilled" ? driversResult.value.rows : [];
    const units = unitsResult.status === "fulfilled" ? unitsResult.value.rows : [];
    const events = eventsResult.status === "fulfilled" ? eventsResult.value ?? [] : [];
    const exceptions = exceptionsResult.status === "fulfilled" ? exceptionsResult.value ?? [] : [];
    const tripNumber = tripNumberResult.status === "fulfilled" && tripNumberResult.value.rows.length > 0
      ? tripNumberResult.value.rows[0].trip_number
      : undefined;
    const tripCosts = tripCostsResult.status === "fulfilled" && tripCostsResult.value.rows.length > 0
      ? tripCostsResult.value.rows[0]
      : undefined;

    if (tripNumber) {
      trip.trip_number = tripNumber;
    }

    // Merge trip costs if available
    if (tripCosts) {
        trip.total_cost = tripCosts.total_cost;
        trip.total_cpm = tripCosts.total_cpm;
        trip.revenue = tripCosts.revenue;
        trip.margin_pct = tripCosts.margin_pct;
        trip.driver_type = tripCosts.driver_type;
    }

    const detail = buildTripDetail(trip, { order, driverRecords: drivers, unitRecords: units, events, exceptions });

    return NextResponse.json(detail);
  } catch (error) {
    console.error(`Error fetching trip detail for ${id}`, error);
    if (error instanceof ServiceError && error.status === 404) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load trip" }, { status: 500 });
  }
}

function buildTripDetail(
  trip: Record<string, any>,
  context: {
    order?: Record<string, any>;
    driverRecords: Array<Record<string, any>>;
    unitRecords: Array<Record<string, any>>;
    events: Array<Record<string, any>>;
    exceptions: Array<Record<string, any>>;
  }
) {
  const driver = context.driverRecords.find((record) => String(record.id ?? record.driver_id) === String(trip.driver_id));
  const driverName = driver?.driver_name ?? driver?.name ?? trip.driver_id ?? "Unassigned";
  const unit = context.unitRecords.find((record) => String(record.id ?? record.unit_id) === String(trip.unit_id));
  const unitNumber = unit?.unit_number ?? trip.unit_number ?? trip.unit_id ?? "Pending";
  const pickupWindowStart = trip.pickup_window_start ?? trip.pickup_window?.start;
  const pickupWindowEnd = trip.pickup_window_end ?? trip.pickup_window?.end;
  const deliveryWindowStart = trip.delivery_window_start ?? trip.delivery_window?.start;
  const deliveryWindowEnd = trip.delivery_window_end ?? trip.delivery_window?.end;

  const listItem = mapTripListItem(
    {
      ...trip,
      tripNumber: trip.trip_number || String(trip.id ?? "").slice(0, 8).toUpperCase(),
      last_ping: trip.updated_at ?? trip.actual_start,
    },
    driverName,
    unitNumber
  );

  const timeline = context.events.map((event) => ({
    id: String(event.id ?? event.event_id ?? randomUUID()),
    timestamp: toIso(event.timestamp ?? event.created_at ?? event.occurred_at),
    summary: event.summary ?? event.event_type ?? event.type ?? "Event",
    location: event.location ?? event.city ?? event.state ?? "",
    status: event.status ?? "Recorded",
  }));

  const exceptionItems = context.exceptions.map((exception) => ({
    id: String(exception.id ?? exception.exception_id ?? randomUUID()),
    type: exception.type ?? exception.category ?? "Exception",
    severity: (exception.severity ?? "info") as "info" | "warn" | "alert",
    opened: toIso(exception.opened ?? exception.created_at ?? new Date().toISOString()),
    owner: exception.owner ?? "Network Ops",
    notes: exception.notes ?? exception.description ?? "",
  }));

  // Calculate capacity metrics
  const currentWeight = trip.current_weight ? parseFloat(trip.current_weight) : (context.order?.total_weight ? parseFloat(context.order.total_weight) : 0);
  const currentCube = trip.current_cube ? parseFloat(trip.current_cube) : (context.order?.cubic_feet ? parseFloat(context.order.cubic_feet) : 0);
  const currentLinearFeet = trip.current_linear_feet ? parseFloat(trip.current_linear_feet) : (context.order?.linear_feet_required ? parseFloat(context.order.linear_feet_required) : 0);

  const maxWeight = unit?.max_weight ? parseFloat(unit.max_weight) : 45000;
  const maxCube = unit?.max_cube ? parseFloat(unit.max_cube) : 3900;
  const maxLinearFeet = unit?.linear_feet ? parseFloat(unit.linear_feet) : 53;

  let utilizationPercent = trip.utilization_percent ? parseFloat(trip.utilization_percent) : 0;
  let limitingFactor = trip.limiting_factor;

  if (!trip.utilization_percent && (currentWeight > 0 || currentCube > 0 || currentLinearFeet > 0)) {
      const weightUtil = currentWeight / maxWeight;
      const cubeUtil = currentCube / maxCube;
      const linearUtil = currentLinearFeet / maxLinearFeet;
      
      utilizationPercent = Math.max(weightUtil, cubeUtil, linearUtil) * 100;
      
      if (weightUtil >= cubeUtil && weightUtil >= linearUtil) limitingFactor = "Weight";
      else if (cubeUtil >= weightUtil && cubeUtil >= linearUtil) limitingFactor = "Cube";
      else limitingFactor = "Linear Feet";
  }

  return {
    id: trip.id,
    tripNumber: listItem.tripNumber,
    orderReference: context.order?.order_number ?? (context.order?.id ? `ORD-${String(context.order.id).slice(0, 8).toUpperCase()}` : "N/A"),
    status: listItem.status,
    driver: listItem.driver,
    driverType: trip.driver_type ?? driver?.driver_type,
    driverRegion: driver?.region,
    truckWk: driver?.truck_wk ?? driver?.truckWk,
    unit: unitNumber,
    unitNumber: unitNumber,
    unitType: trip.unit_type ?? trip.equipment_type ?? unit?.equipment_type,
    eta: listItem.eta,
    pickup: listItem.pickup,
    delivery: listItem.delivery,
    pickupWindowStart: pickupWindowStart ? toIso(pickupWindowStart) : undefined,
    pickupWindowEnd: pickupWindowEnd ? toIso(pickupWindowEnd) : undefined,
    deliveryWindowStart: deliveryWindowStart ? toIso(deliveryWindowStart) : undefined,
    deliveryWindowEnd: deliveryWindowEnd ? toIso(deliveryWindowEnd) : undefined,
    plannedStart: trip.planned_start || trip.planned_at ? toIso(trip.planned_start ?? trip.planned_at) : undefined,
    actualStart: trip.actual_start ? toIso(trip.actual_start) : undefined,
    pickupDeparture: trip.pickup_departure ? toIso(trip.pickup_departure) : undefined,
    completedAt: trip.completed_at || trip.completedAt ? toIso(trip.completed_at ?? trip.completedAt) : undefined,
    onTimePickup: Boolean(trip.on_time_pickup ?? trip.onTimePickup),
    onTimeDelivery: Boolean(trip.on_time_delivery ?? trip.onTimeDelivery),
    metrics: {
      distanceMiles: trip.distance_miles ?? trip.actual_miles ?? trip.planned_miles ?? trip.miles ?? trip.distance,
      estDurationHours: trip.duration_hours ?? trip.est_duration_hours,
      linehaul: trip.linehaul_cost ?? trip.linehaul,
      fuel: trip.fuel_cost ?? trip.fuel,
      totalCost: trip.total_cost ?? trip.totalCost,
      totalCpm: trip.total_cpm ?? (trip.total_cost && trip.distance_miles ? trip.total_cost / trip.distance_miles : undefined),
      recommendedRevenue: trip.recommended_revenue ?? trip.revenue,
      marginPct: trip.margin_pct ?? trip.margin,
    },
    currentWeight: currentWeight,
    currentCube: currentCube,
    currentLinearFeet: currentLinearFeet,
    utilizationPercent: utilizationPercent,
    limitingFactor: limitingFactor,
    maxWeight: maxWeight,
    maxCube: maxCube,
    maxLinearFeet: maxLinearFeet,
    timeline,
    exceptions: exceptionItems,
    telemetry: {
      lastPing: listItem.lastPing,
      breadcrumb: Array.isArray(trip.telemetry)
        ? trip.telemetry.map((point: any, index: number) => ({
            id: String(point.id ?? index),
            timestamp: toIso(point.timestamp ?? point.recorded_at ?? listItem.lastPing),
            speed: Number(point.speed ?? 0),
            location: point.location ?? "",
          }))
        : [],
    },
    notes: buildNotes(context.order),
    attachments: [],
  };
}

function buildNotes(order?: Record<string, any>) {
  if (!order?.notes && !order?.special_instructions) {
    return [];
  }
  const noteBody = order.notes ?? order.special_instructions;
  return [
    {
      id: randomUUID(),
      author: order.customer ?? order.customer_name ?? "Customer",
      timestamp: toIso(order.updated_at ?? new Date().toISOString()),
      body: String(noteBody),
    },
  ];
}

function toIso(value?: string | Date | null) {
  if (!value) return new Date().toISOString();
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
