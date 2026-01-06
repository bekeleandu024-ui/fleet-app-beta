import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Helper to get distance from maps API
async function getDistanceFromMaps(origin: string, destination: string): Promise<number | null> {
  if (!origin || !destination) return null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/maps/distance?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.distance > 0 ? data.distance : null;
    }
  } catch (error) {
    console.warn(`Distance API failed for ${origin} -> ${destination}`);
  }
  return null;
}

// Safe date formatting
function toISOSafe(value: any): string | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const whereClause = isUUID ? 't.id = $1' : 't.trip_number = $1';

    const tripQuery = `
      SELECT 
        t.id, t.trip_number, t.order_id, t.driver_id, t.unit_id, t.status,
        t.pickup_location, t.dropoff_location, t.planned_miles, t.actual_miles,
        t.planned_start, t.actual_start, t.completed_at,
        t.pickup_window_start, t.pickup_window_end, 
        t.delivery_window_start, t.delivery_window_end,
        t.on_time_pickup, t.on_time_delivery, t.is_rounder,
        t.current_weight, t.current_cube, t.current_linear_feet,
        t.utilization_percent, t.limiting_factor,
        t.revenue, t.total_cost, t.driver_name as stored_driver_name,
        t.customer_name as stored_customer_name, t.unit_number as stored_unit_number,
        t.updated_at, t.created_at,
        -- Order data
        o.order_number, o.customer_name, o.customer_id, o.quoted_rate,
        o.status as order_status, o.special_instructions, o.order_type as commodity,
        o.total_weight_lbs, o.total_pallets, o.cubic_feet, o.linear_feet_required,
        o.equipment_type,
        -- Driver data
        d.driver_name, d.driver_type, d.driver_category, d.oo_zone,
        d.hos_hours_remaining, d.is_active as driver_active, d.unit_number as driver_unit,
        -- Unit data
        u.unit_number, u.unit_type, u.current_location as unit_location,
        u.total_weekly_cost, u.max_weight, u.max_cube, u.linear_feet as max_linear_feet,
        -- Trip costs
        tc.total_cost as calc_total_cost, tc.cost_per_mile as total_cpm,
        tc.revenue as calc_revenue, tc.margin_pct, tc.profit,
        tc.fixed_cost, tc.labor_cost, tc.fuel_cost, 
        tc.maintenance_cost, tc.events_cost,
        tc.linehaul_miles, tc.deadhead_miles, tc.total_miles,
        tc.border_crossings, tc.pickup_count, tc.delivery_count,
        tc.revenue_per_mile
      FROM trips t
      LEFT JOIN orders o ON t.order_id = o.id
      LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
      LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
      LEFT JOIN trip_costs tc ON t.id = tc.trip_id
      WHERE ${whereClause}
    `;

    const result = await pool.query(tripQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const t = result.rows[0];

    // Calculate distance if missing
    let totalDistance = Number(t.total_miles) || Number(t.planned_miles) || Number(t.actual_miles) || 0;
    const pickup = t.pickup_location;
    const dropoff = t.dropoff_location;
    const isRounder = t.is_rounder === true;
    const HOME_BASE = "Guelph, ON";

    let linehaulMiles = Number(t.linehaul_miles) || 0;
    let deadheadMiles = Number(t.deadhead_miles) || 0;
    let returnMiles = 0;

    if (!totalDistance && pickup && dropoff) {
      try {
        linehaulMiles = await getDistanceFromMaps(pickup, dropoff) || 0;
        if (isRounder) {
          deadheadMiles = await getDistanceFromMaps(HOME_BASE, pickup) || 0;
          returnMiles = await getDistanceFromMaps(dropoff, HOME_BASE) || 0;
          totalDistance = deadheadMiles + linehaulMiles + returnMiles;
        } else {
          totalDistance = linehaulMiles;
        }
      } catch (err) {
        console.warn('Distance calculation failed');
      }
    }

    // Status mapping
    const statusMap: Record<string, string> = {
      draft: "Draft", planned: "Draft", assigned: "Dispatched",
      dispatched: "Dispatched", in_transit: "In Transit",
      en_route_to_pickup: "In Transit", at_pickup: "At Pickup",
      departed_pickup: "In Transit", at_delivery: "At Delivery",
      delivered: "Completed", completed: "Completed",
      cancelled: "Cancelled", closed: "Invoiced", invoiced: "Invoiced",
    };

    // Financial calculations
    const revenue = Number(t.calc_revenue) || Number(t.revenue) || Number(t.quoted_rate) || 0;
    const totalCost = Number(t.calc_total_cost) || Number(t.total_cost) || 0;
    const profit = revenue - totalCost;
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Capacity
    const currentWeight = Number(t.current_weight) || Number(t.total_weight_lbs) || 0;
    const currentCube = Number(t.current_cube) || Number(t.cubic_feet) || 0;
    const currentLinearFeet = Number(t.current_linear_feet) || Number(t.linear_feet_required) || 0;
    const maxWeight = Number(t.max_weight) || 45000;
    const maxCube = Number(t.max_cube) || 3900;
    const maxLinearFeet = Number(t.max_linear_feet) || 53;

    // Build itinerary stops
    interface Stop {
      sequence: number;
      type: string;
      location: string;
      scheduledWindow: { start: string | null; end: string | null };
      eta: string | null;
      actual: string | null;
      status: string;
      work: {
        action: string;
        shipmentRef: string | null;
        commodity: string | null;
        weight: number;
        pallets: number;
        instructions: string | null;
      };
    }

    const stops: Stop[] = [
      {
        sequence: 1,
        type: "Pickup",
        location: pickup || "TBD",
        scheduledWindow: {
          start: toISOSafe(t.pickup_window_start),
          end: toISOSafe(t.pickup_window_end),
        },
        eta: toISOSafe(t.planned_start),
        actual: toISOSafe(t.actual_start),
        status: t.actual_start ? "Completed" : (t.status === 'at_pickup' ? "In Progress" : "Pending"),
        work: {
          action: "Load",
          shipmentRef: t.order_number || `ORD-${String(t.order_id || '').slice(0, 8).toUpperCase()}`,
          commodity: t.commodity || "General Freight",
          weight: currentWeight,
          pallets: Number(t.total_pallets) || 0,
          instructions: t.special_instructions,
        },
      },
      {
        sequence: 2,
        type: "Delivery",
        location: dropoff || "TBD",
        scheduledWindow: {
          start: toISOSafe(t.delivery_window_start),
          end: toISOSafe(t.delivery_window_end),
        },
        eta: totalDistance && linehaulMiles ? 
          toISOSafe(new Date(new Date(t.planned_start || Date.now()).getTime() + (linehaulMiles / 55) * 3600000)) : null,
        actual: toISOSafe(t.completed_at),
        status: t.completed_at ? "Completed" : (t.status === 'at_delivery' ? "In Progress" : "Pending"),
        work: {
          action: "Unload",
          shipmentRef: t.order_number || `ORD-${String(t.order_id || '').slice(0, 8).toUpperCase()}`,
          commodity: t.commodity || "General Freight",
          weight: currentWeight,
          pallets: Number(t.total_pallets) || 0,
          instructions: "Verify seal, obtain POD signature",
        },
      },
    ];

    // If rounder, add return leg
    if (isRounder && returnMiles > 0) {
      stops.push({
        sequence: 3,
        type: "Deadhead",
        location: HOME_BASE,
        scheduledWindow: { start: null, end: null },
        eta: null,
        actual: null,
        status: "Pending",
        work: {
          action: "Return to Base",
          shipmentRef: null,
          commodity: null,
          weight: 0,
          pallets: 0,
          instructions: "Empty return - available for next dispatch",
        },
      });
    }

    const response = {
      // Hero Header
      id: t.id,
      tripNumber: t.trip_number || `TRP-${String(t.id).slice(0, 8).toUpperCase()}`,
      status: statusMap[t.status?.toLowerCase()] || t.status || "Draft",
      statusRaw: t.status,
      
      // Distance & Time
      totalDistance: Math.round(totalDistance * 10) / 10,
      linehaulMiles: Math.round(linehaulMiles * 10) / 10,
      deadheadMiles: Math.round(deadheadMiles * 10) / 10,
      returnMiles: Math.round(returnMiles * 10) / 10,
      isRounder,
      estimatedHours: totalDistance ? Math.round((totalDistance / 55) * 10) / 10 : null,
      eta: stops[1]?.eta,

      // Resources
      resources: {
        driver: {
          id: t.driver_id,
          name: t.driver_name || t.stored_driver_name || null,
          phone: null, // Future: add phone_number to driver_profiles
          type: t.driver_type || "Company",
          category: t.driver_category || "Highway",
          hosRemaining: Number(t.hos_hours_remaining) || null,
          zone: t.oo_zone,
        },
        coDriver: null, // Future: support team drivers
        powerUnit: {
          id: t.unit_id,
          number: t.unit_number || t.stored_unit_number || t.driver_unit || null,
          plate: null, // Future: add license_plate to unit_profiles
          type: t.unit_type || t.equipment_type || "Dry Van",
          location: t.unit_location,
        },
        trailer: {
          id: null, // Future: separate trailer tracking
          number: null,
          type: t.unit_type || t.equipment_type || "Dry Van",
          tempSetting: null, // For reefers
        },
        carrier: null, // Future: brokered freight
      },

      // Customer
      customer: {
        id: t.customer_id,
        name: t.customer_name || t.stored_customer_name || "Unknown",
      },

      // Itinerary
      stops,

      // Financials
      financials: {
        revenue,
        costs: {
          total: totalCost,
          labor: Number(t.labor_cost) || 0,
          fuel: Number(t.fuel_cost) || 0,
          fixed: Number(t.fixed_cost) || 0,
          maintenance: Number(t.maintenance_cost) || 0,
          events: Number(t.events_cost) || 0,
        },
        profit,
        marginPct: Math.round(marginPct * 10) / 10,
        cpm: totalDistance > 0 ? Math.round((totalCost / totalDistance) * 100) / 100 : 0,
        rpm: totalDistance > 0 ? Math.round((revenue / totalDistance) * 100) / 100 : 0,
        isProfitable: profit > 0,
        marginHealth: marginPct >= 15 ? "healthy" : marginPct >= 8 ? "warning" : "critical",
      },

      // Capacity
      capacity: {
        weight: { current: currentWeight, max: maxWeight, pct: Math.round((currentWeight / maxWeight) * 100) },
        cube: { current: currentCube, max: maxCube, pct: Math.round((currentCube / maxCube) * 100) },
        linearFeet: { current: currentLinearFeet, max: maxLinearFeet, pct: Math.round((currentLinearFeet / maxLinearFeet) * 100) },
        utilizationPct: Math.max(
          Math.round((currentWeight / maxWeight) * 100),
          Math.round((currentCube / maxCube) * 100),
          Math.round((currentLinearFeet / maxLinearFeet) * 100)
        ),
        limitingFactor: t.limiting_factor || (currentWeight / maxWeight >= currentCube / maxCube ? "Weight" : "Cube"),
      },

      // Documentation
      documents: {
        bolUploaded: false, // Future: check documents table
        podUploaded: false,
        podRequired: true,
        canClose: false, // POD required to close
      },

      // Timing
      onTimePickup: t.on_time_pickup,
      onTimeDelivery: t.on_time_delivery,
      plannedStart: toISOSafe(t.planned_start),
      actualStart: toISOSafe(t.actual_start),
      completedAt: toISOSafe(t.completed_at),
      createdAt: toISOSafe(t.created_at),
      updatedAt: toISOSafe(t.updated_at),

      // Audit trail placeholder
      changelog: [],
      notes: t.special_instructions ? [{ 
        id: "1", 
        author: "System", 
        timestamp: toISOSafe(t.created_at), 
        text: t.special_instructions 
      }] : [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Trip detail error for ${id}:`, error);
    return NextResponse.json({ error: "Failed to load trip" }, { status: 500 });
  }
}
