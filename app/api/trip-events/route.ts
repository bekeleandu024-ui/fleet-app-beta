import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/trip-events?tripId=xxx - Fetch events for a trip
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("tripId");
  const driver = searchParams.get("driver");
  const unit = searchParams.get("unit");
  const eventType = searchParams.get("eventType");

  try {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          te.*,
          t.status as trip_status,
          d.driver_name,
          u.unit_number
        FROM trip_events te
        JOIN trips t ON te.trip_id = t.id
        LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
        LEFT JOIN unit_profiles u ON t.unit_id = u.unit_id
        WHERE 1=1
      `;
      const params = [];
      if (tripId) {
        params.push(tripId);
        query += ` AND te.trip_id = $${params.length}`;
      }
      if (eventType) {
        params.push(eventType);
        query += ` AND te.event_type = $${params.length}`;
      }
      if (driver) {
        params.push(`%${driver}%`);
        query += ` AND d.driver_name ILIKE $${params.length}`;
      }
      if (unit) {
        params.push(`%${unit}%`);
        query += ` AND u.unit_number ILIKE $${params.length}`;
      }

      query += ` ORDER BY te.occurred_at DESC LIMIT 100`;

      const result = await client.query(query, params);
      
      const events = result.rows.map(row => ({
        id: row.id,
        tripId: row.trip_id,
        eventType: row.event_type,
        timestamp: row.occurred_at,
        stopLabel: row.payload?.stopLabel || row.event_type,
        notes: row.payload?.notes,
        lat: row.payload?.lat,
        lon: row.payload?.lon,
        trip: {
          id: row.trip_id,
          driver: row.driver_name || "Unknown",
          unit: row.unit_number || "N/A",
          status: row.trip_status
        }
      }));

      return NextResponse.json({ events });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching trip events:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip events" },
      { status: 500 }
    );
  }
}

