/**
 * Distance Cache Management API
 * 
 * Endpoints for managing distance calculation cache
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
 * GET /api/distance/cache/stats
 * Get cache statistics
 */
export async function GET(request: Request) {
  try {
    const service = await getDistanceService();
    const stats = await service.getCacheStats();

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/distance/cache
 * Clean up expired cache entries
 */
export async function DELETE(request: Request) {
  try {
    const service = await getDistanceService();
    const result = await service.cleanupCache();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error cleaning up cache:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup cache' },
      { status: 500 }
    );
  }
}
