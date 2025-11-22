/**
 * Missing Distances API
 * 
 * Endpoints for identifying and calculating missing trip distances
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
 * GET /api/distance/missing
 * Get list of trips missing distance data
 * 
 * Query params:
 * - limit: Maximum number of trips to return (default: 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const service = await getDistanceService();
    const trips = await service.getTripsMissingDistance(limit);

    return NextResponse.json({
      count: trips.length,
      trips,
    });
  } catch (error: any) {
    console.error('Error getting trips missing distance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get missing distances' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/distance/missing/calculate
 * Calculate distances for all trips missing distance data
 * 
 * Body:
 * {
 *   limit?: number,      // Max trips to process (default: no limit)
 *   batchSize?: number   // Batch size for processing (default: 50)
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { limit, batchSize } = body;

    const service = await getDistanceService();
    const results = await service.calculateMissingDistances({
      limit: limit || null,
      batchSize: batchSize || 50,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error calculating missing distances:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate missing distances' },
      { status: 500 }
    );
  }
}

