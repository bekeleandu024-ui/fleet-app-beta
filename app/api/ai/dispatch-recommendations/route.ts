import { NextRequest, NextResponse } from "next/server";
import { 
  getBatchDispatchRecommendations, 
  BatchDispatchOrder, 
  BatchDispatchDriver, 
  BatchDispatchUnit 
} from "@/lib/fleet-ai";
import pool from "@/lib/db";

/**
 * POST /api/ai/dispatch-recommendations
 * 
 * Get AI-powered batch recommendations for dispatch optimization.
 * Analyzes available orders, drivers, and units to suggest:
 * - Order consolidation opportunities
 * - Optimal driver/unit assignments
 * - Priority alerts for time-sensitive orders
 * - Brokerage recommendations when capacity is constrained
 * 
 * Request body (optional - will fetch from database if not provided):
 * {
 *   orders?: BatchDispatchOrder[],
 *   drivers?: BatchDispatchDriver[],
 *   units?: BatchDispatchUnit[],
 *   capacityStatus?: "normal" | "constrained" | "critical"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    let orders: BatchDispatchOrder[] = body.orders || [];
    let drivers: BatchDispatchDriver[] = body.drivers || [];
    let units: BatchDispatchUnit[] = body.units || [];
    const capacityStatus = body.capacityStatus || "normal";

    // If no data provided, fetch from database
    if (orders.length === 0 || drivers.length === 0 || units.length === 0) {
      const client = await pool.connect();
      
      try {
        // Fetch unassigned/new orders
        if (orders.length === 0) {
          const ordersResult = await client.query(`
            SELECT 
              o.id,
              o.order_number,
              o.status,
              o.dispatch_status,
              o.customer_name,
              o.order_type,
              o.pickup_location as origin,
              o.dropoff_location as destination,
              o.pickup_time as pickup_date,
              o.dropoff_time as delivery_date,
              o.equipment_type,
              COALESCE(o.total_weight_lbs, 0) as weight,
              COALESCE(o.quoted_rate, 0) as rate
            FROM orders o
            WHERE o.status IN ('New', 'Pending', 'Quoted', 'Confirmed')
              AND (o.dispatch_status IS NULL OR o.dispatch_status IN ('NEW', 'Unassigned', 'Ready', ''))
            ORDER BY o.pickup_time ASC NULLS LAST
            LIMIT 50
          `);

          orders = ordersResult.rows.map(row => ({
            id: row.order_number || row.id,
            status: row.status,
            customer: row.customer_name,
            type: row.order_type || 'Std',
            origin: row.origin,
            destination: row.destination,
            pickup_date: row.pickup_date?.toISOString?.()?.split('T')[0] || row.pickup_date,
            delivery_date: row.delivery_date?.toISOString?.()?.split('T')[0] || row.delivery_date,
            equipment: row.equipment_type || 'Dry Van',
            weight: Number(row.weight) || 0,
            rate: Number(row.rate) || 0,
          }));
        }

        // Fetch available drivers
        if (drivers.length === 0) {
          const driversResult = await client.query(`
            SELECT 
              dp.driver_id as id,
              dp.driver_name as name,
              dp.driver_type as type,
              dp.unit_number,
              dp.oo_zone as location,
              dp.is_active,
              COALESCE(dp.hos_hours_remaining, 10) as hos_hours
            FROM driver_profiles dp
            WHERE dp.is_active = true
            ORDER BY dp.driver_name
            LIMIT 50
          `);

          // Get busy drivers from active trips
          const busyDriversResult = await client.query(`
            SELECT DISTINCT driver_id 
            FROM trips 
            WHERE status NOT IN ('Completed', 'Cancelled', 'completed', 'cancelled')
              AND driver_id IS NOT NULL
          `);
          const busyDriverIds = new Set(busyDriversResult.rows.map(r => r.driver_id));

          drivers = driversResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            status: busyDriverIds.has(row.id) ? 'Booked' : 'Ready',
            location: row.location || row.unit_number || 'Unknown',
            hours_available: busyDriverIds.has(row.id) ? 2 : Number(row.hos_hours) || 10,
            equipment_access: ['Dry Van', 'Reefer'],
            type: (row.type === 'Owner Operator' ? 'OO' : 
                   row.type === 'Rental' ? 'RNR' : 'COM') as "COM" | "OO" | "RNR",
            performance: {
              on_time_rate: 0.95,
              acceptance_rate: 0.90,
            },
          }));
        }

        // Fetch available units from unit_profiles table
        if (units.length === 0) {
          const unitsResult = await client.query(`
            SELECT 
              u.unit_id as id,
              u.unit_number,
              u.unit_type as type,
              u.status,
              CONCAT(u.current_city, ', ', u.current_state) as current_location,
              COALESCE(u.max_weight_lbs, 44000) as capacity_lbs
            FROM unit_profiles u
            WHERE u.is_active = true
              AND u.status IN ('AVAILABLE', 'Available', 'Active', 'active')
            ORDER BY u.unit_number
            LIMIT 30
          `);

          // Get busy units from active trips
          const busyUnitsResult = await client.query(`
            SELECT DISTINCT unit_id 
            FROM trips 
            WHERE status NOT IN ('Completed', 'Cancelled', 'completed', 'cancelled')
              AND unit_id IS NOT NULL
          `);
          const busyUnitIds = new Set(busyUnitsResult.rows.map(r => r.unit_id));

          units = unitsResult.rows.map(row => ({
            id: row.unit_number || row.id,
            type: row.type || "53' Dry Van",
            status: busyUnitIds.has(row.id) ? 'In Use' : 'Available',
            location: row.current_location || 'Unknown',
            capacity_lbs: Number(row.capacity_lbs) || 44000,
          }));
        }
      } finally {
        client.release();
      }
    }

    // Check if we have data to analyze
    if (orders.length === 0) {
      return NextResponse.json({
        recommendations: [],
        summary: {
          total_recommendations: 0,
          potential_savings: "$0",
          orders_analyzed: 0,
          consolidation_opportunities: 0,
        },
        message: "No unassigned orders found to analyze",
      });
    }

    // Get AI recommendations
    const recommendations = await getBatchDispatchRecommendations({
      orders,
      drivers,
      units,
      capacityStatus,
    });

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error("Dispatch recommendations error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to get dispatch recommendations",
        recommendations: [],
        summary: {
          total_recommendations: 0,
          potential_savings: "$0",
          orders_analyzed: 0,
          consolidation_opportunities: 0,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/dispatch-recommendations
 * 
 * Get dispatch recommendations using data from the database.
 * Query parameters:
 * - capacityStatus: "normal" | "constrained" | "critical"
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const capacityStatus = searchParams.get("capacityStatus") as "normal" | "constrained" | "critical" || "normal";

  // Delegate to POST with empty body to fetch from database
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ capacityStatus }),
  });

  return POST(fakeRequest);
}
