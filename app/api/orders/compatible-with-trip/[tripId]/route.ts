import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request, context: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await context.params;
  
  try {
    const client = await pool.connect();
    try {
      // Get trip capacity and route
      const tripRes = await client.query(`
        SELECT 
          t.id, t.current_weight, t.current_cube, t.current_linear_feet,
          u.max_weight, u.max_cube, u.linear_feet as max_linear_feet,
          t.pickup_lat, t.pickup_lng, t.dropoff_lat, t.dropoff_lng
        FROM trips t
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        WHERE t.id = $1
      `, [tripId]);
      
      if (tripRes.rows.length === 0) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }
      
      const trip = tripRes.rows[0];
      // Default max values if unit not found
      const maxWeight = trip.max_weight ? parseFloat(trip.max_weight) : 45000;
      const maxCube = trip.max_cube ? parseFloat(trip.max_cube) : 3900;
      const maxLinear = trip.max_linear_feet ? parseFloat(trip.max_linear_feet) : 53;

      const remainingWeight = maxWeight - parseFloat(trip.current_weight || 0);
      const remainingCube = maxCube - parseFloat(trip.current_cube || 0);
      const remainingLinear = maxLinear - parseFloat(trip.current_linear_feet || 0);
      
      // Find orders that fit
      const query = `
        SELECT * FROM orders 
        WHERE status IN ('New', 'Planning')
        AND (total_weight IS NULL OR total_weight <= $1)
        AND (cubic_feet IS NULL OR cubic_feet <= $2)
        AND (linear_feet_required IS NULL OR linear_feet_required <= $3)
        LIMIT 10
      `;
      
      const ordersRes = await client.query(query, [remainingWeight, remainingCube, remainingLinear]);
      
      return NextResponse.json({ orders: ordersRes.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error finding compatible orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
