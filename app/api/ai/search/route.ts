import { NextRequest, NextResponse } from "next/server";
import { processNaturalLanguageSearch } from "@/lib/fleet-ai";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Get AI interpretation of the query
    const interpretation = await processNaturalLanguageSearch({ query });

    // Fetch matching data based on filters
    const results = await searchDatabase(interpretation.filters);

    return NextResponse.json({
      interpretation: {
        interpretation: interpretation.interpretation,
        filters: interpretation.filters,
        summary: interpretation.summary
      },
      results
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process search" },
      { status: 500 }
    );
  }
}

async function searchDatabase(filters: Record<string, any>) {
  const results: any[] = [];

  try {
    // Search orders
    if (!filters.type || filters.type === "order" || filters.type === "orders") {
      let orderQuery = `
        SELECT id, order_number, customer_name, status, 
               pickup_city, pickup_state, delivery_city, delivery_state,
               revenue, pickup_date
        FROM orders 
        WHERE 1=1
      `;
      const orderParams: any[] = [];

      if (filters.customer) {
        orderParams.push(`%${filters.customer}%`);
        orderQuery += ` AND customer_name ILIKE $${orderParams.length}`;
      }

      if (filters.status) {
        orderParams.push(filters.status);
        orderQuery += ` AND status = $${orderParams.length}`;
      }

      if (filters.assignmentStatus === "unassigned") {
        orderQuery += ` AND id NOT IN (SELECT DISTINCT order_id FROM trips WHERE order_id IS NOT NULL)`;
      }

      if (filters.location) {
        orderParams.push(`%${filters.location}%`);
        orderQuery += ` AND (pickup_city ILIKE $${orderParams.length} OR delivery_city ILIKE $${orderParams.length})`;
      }

      if (filters.dateRange?.start) {
        orderParams.push(filters.dateRange.start);
        orderQuery += ` AND pickup_date >= $${orderParams.length}`;
      }

      if (filters.dateRange?.end) {
        orderParams.push(filters.dateRange.end);
        orderQuery += ` AND pickup_date <= $${orderParams.length}`;
      }

      orderQuery += ` ORDER BY pickup_date DESC LIMIT 10`;

      const orderResult = await pool.query(orderQuery, orderParams);
      
      for (const row of orderResult.rows) {
        results.push({
          type: "order",
          id: row.id,
          title: `${row.order_number || row.id} - ${row.customer_name || "Unknown"}`,
          subtitle: `${row.pickup_city || "?"}, ${row.pickup_state || ""} → ${row.delivery_city || "?"}, ${row.delivery_state || ""} | ${row.status}`,
          href: `/orders/${row.id}`
        });
      }
    }

    // Search trips
    if (!filters.type || filters.type === "trip" || filters.type === "trips") {
      let tripQuery = `
        SELECT t.id, t.trip_number, t.status, 
               t.pickup_city, t.pickup_state, t.delivery_city, t.delivery_state,
               d.name as driver_name
        FROM trips t
        LEFT JOIN drivers d ON t.driver_id = d.id
        WHERE 1=1
      `;
      const tripParams: any[] = [];

      if (filters.status) {
        tripParams.push(filters.status);
        tripQuery += ` AND t.status = $${tripParams.length}`;
      }

      if (filters.driver) {
        tripParams.push(`%${filters.driver}%`);
        tripQuery += ` AND d.name ILIKE $${tripParams.length}`;
      }

      if (filters.riskLevel === "high" || filters.status === "at_risk" || filters.status === "delayed") {
        tripQuery += ` AND t.status IN ('At Risk', 'Delayed', 'In Transit')`;
      }

      if (filters.location) {
        tripParams.push(`%${filters.location}%`);
        tripQuery += ` AND (t.pickup_city ILIKE $${tripParams.length} OR t.delivery_city ILIKE $${tripParams.length})`;
      }

      tripQuery += ` ORDER BY t.created_at DESC LIMIT 10`;

      const tripResult = await pool.query(tripQuery, tripParams);

      for (const row of tripResult.rows) {
        results.push({
          type: "trip",
          id: row.id,
          title: `${row.trip_number || row.id}${row.driver_name ? ` - ${row.driver_name}` : ""}`,
          subtitle: `${row.pickup_city || "?"} → ${row.delivery_city || "?"} | ${row.status}`,
          href: `/trips/${row.id}`
        });
      }
    }

    // Search drivers
    if (!filters.type || filters.type === "driver" || filters.type === "drivers") {
      let driverQuery = `
        SELECT id, name, type, status, current_location
        FROM drivers
        WHERE 1=1
      `;
      const driverParams: any[] = [];

      if (filters.driver) {
        driverParams.push(`%${filters.driver}%`);
        driverQuery += ` AND name ILIKE $${driverParams.length}`;
      }

      if (filters.status) {
        driverParams.push(filters.status);
        driverQuery += ` AND status = $${driverParams.length}`;
      }

      driverQuery += ` ORDER BY name LIMIT 10`;

      const driverResult = await pool.query(driverQuery, driverParams);

      for (const row of driverResult.rows) {
        results.push({
          type: "driver",
          id: row.id,
          title: row.name,
          subtitle: `${row.type || "Driver"} | ${row.status || "Active"}${row.current_location ? ` | ${row.current_location}` : ""}`,
          href: `/drivers/${row.id}`
        });
      }
    }

  } catch (error) {
    console.error("Database search error:", error);
  }

  return results;
}
