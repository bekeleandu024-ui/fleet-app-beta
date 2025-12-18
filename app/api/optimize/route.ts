import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Assuming optimization service runs on port 8000
    let res;
    try {
      res = await fetch('http://localhost:8000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (e: any) {
      if (e.cause?.code === 'ECONNREFUSED') {
        console.warn("Optimization service not running. Returning mock data.");
        // Return mock data if service is down
        return NextResponse.json({
          routes: [
            {
              vehicle_id: "v1",
              steps: [
                { stop_id: "s1", distance_from_prev_meters: 5000, cumulative_distance_meters: 5000 },
                { stop_id: "s2", distance_from_prev_meters: 3000, cumulative_distance_meters: 8000 }
              ],
              total_distance_meters: 8000,
              total_load: 2
            },
            {
              vehicle_id: "v2",
              steps: [
                { stop_id: "s3", distance_from_prev_meters: 12000, cumulative_distance_meters: 12000 }
              ],
              total_distance_meters: 12000,
              total_load: 1
            }
          ],
          total_distance_meters: 20000,
          total_distance_km: 20.0,
          status: "OPTIMAL (MOCK)"
        });
      }
      throw e;
    }
    
    if (!res.ok) {
        const error = await res.text();
        return NextResponse.json({ error }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json({ error: "Failed to optimize" }, { status: 500 });
  }
}
