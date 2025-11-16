import { NextResponse } from "next/server";

const TRACKING_SERVICE = process.env.TRACKING_SERVICE || 'http://localhost:4004';

export async function GET() {
  try {
    const response = await fetch(`${TRACKING_SERVICE}/api/trips`);
    if (!response.ok) {
      throw new Error('Failed to fetch trips');
    }
    
    const trips = await response.json();

    return NextResponse.json({
      stats: {
        active: trips.length,
        late: trips.filter((trip: any) => trip.status === "Running Late").length,
        exception: trips.filter((trip: any) => trip.status === "Exception").length,
      },
      filters: {
        statuses: Array.from(new Set(trips.map((trip: any) => trip.status))).sort(),
        exceptions: ["Weather", "Mechanical", "Customer Hold"],
        dateRanges: ["Today", "48 Hours", "7 Days"],
      },
      data: trips,
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ error: 'Failed to load trips' }, { status: 500 });
  }
}
