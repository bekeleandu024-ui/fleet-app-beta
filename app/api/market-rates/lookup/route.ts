import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    // Try exact match first
    let query = `
      SELECT * FROM market_lanes
      WHERE origin = $1 AND destination = $2
      ORDER BY sample_date DESC
      LIMIT 1
    `;
    let params = [origin, destination];

    const response = await fetch(
      `${process.env.MASTER_DATA_SERVICE_URL || 'http://localhost:4001'}/query`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, params }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to lookup market rate');
    }

    const result = await response.json();

    if (result.length === 0) {
      // No exact match found
      return NextResponse.json({
        found: false,
        message: 'No market rate data available for this lane',
      });
    }

    return NextResponse.json({
      found: true,
      ...result[0],
    });
  } catch (error) {
    console.error('Error looking up market rate:', error);
    return NextResponse.json(
      { error: 'Failed to lookup market rate' },
      { status: 500 }
    );
  }
}
