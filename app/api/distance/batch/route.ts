/**
 * Batch Distance Operations API
 * 
 * Endpoints for batch distance calculations and bulk operations
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
 * POST /api/distance/batch
 * Calculate distances for multiple origin-destination pairs
 * 
 * Body:
 * {
 *   pairs: [
 *     { origin: "City, State", destination: "City, State" },
 *     ...
 *   ],
 *   batchSize?: number
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pairs, batchSize } = body;

    if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
      return NextResponse.json(
        { error: 'Pairs array is required' },
        { status: 400 }
      );
    }

    const service = await getDistanceService();
    const results = await service.batchCalculateDistances(pairs, { batchSize });

    return NextResponse.json({
      total: results.length,
      successful: results.filter((r: any) => r.result !== null).length,
      failed: results.filter((r: any) => r.error !== null).length,
      results,
    });
  } catch (error: any) {
    console.error('Error in batch distance calculation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate batch distances' },
      { status: 500 }
    );
  }
}

