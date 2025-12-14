/**
 * Trip Distance Calculation API
 * 
 * Calculate and update distance for specific trips
 */

import { NextResponse } from "next/server";

let dbDistanceService: any = null;

async function getDistanceService() {
  if (!dbDistanceService) {
    const { DatabaseDistanceService } = await import('@/services/database-integration');
    dbDistanceService = new DatabaseDistanceService();
  }
  return dbDistanceService;
}

/**
 * POST /api/distance/trip/:tripId
 * Calculate and update distance for a specific trip
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  try {
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }

    const service = await getDistanceService();
    const result = await service.calculateTripDistance(tripId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error calculating distance for trip ${tripId}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate trip distance' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/distance/trip/:tripId/recalculate
 * Force recalculate distance for a trip (bypass cache)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  try {
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }

    const service = await getDistanceService();
    const result = await service.recalculateTripDistance(tripId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error recalculating distance for trip ${tripId}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to recalculate trip distance' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/distance/trip/:tripId
 * Get distance information for a specific trip
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  try {
    if (!tripId) {
      return NextResponse.json(
        { error: 'Trip ID is required' },
        { status: 400 }
      );
    }

    const service = await getDistanceService();
    
    const result = await service.db.query(
      `SELECT 
        id,
        pickup_location,
        dropoff_location,
        distance_miles,
        duration_hours,
        distance_calculated_at,
        distance_calculation_provider,
        distance_calculation_method
      FROM trips
      WHERE id = $1`,
      [tripId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error(`Error getting trip distance for ${tripId}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to get trip distance' },
      { status: 500 }
    );
  }
}
