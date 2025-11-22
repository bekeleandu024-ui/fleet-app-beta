/**
 * Distance Calculation API Endpoints
 * 
 * REST API for distance calculations and trip distance management
 */

import { NextResponse } from "next/server";

// Initialize database service (lazy loading)
let dbDistanceService: any = null;

async function getDistanceService() {
  if (!dbDistanceService) {
    const { DatabaseDistanceService } = await import('@/services/database-integration');
    dbDistanceService = new DatabaseDistanceService();
  }
  return dbDistanceService;
}

/**
 * GET /api/distance/calculate
 * Calculate distance between two locations
 * 
 * Query params:
 * - origin: Location string (e.g., "Guelph, ON, Canada") or JSON {lat, lng}
 * - destination: Location string or JSON {lat, lng}
 * - provider: (optional) Preferred provider (osrm, google, mapbox, tomtom)
 * 
 * Returns: Distance calculation result
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const provider = searchParams.get('provider');

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Both origin and destination are required' },
        { status: 400 }
      );
    }

    const service = await getDistanceService();
    
    // Try to parse as JSON coordinates
    let originLoc = origin;
    let destLoc = destination;
    
    try {
      const parsedOrigin = JSON.parse(origin);
      if (parsedOrigin.lat && parsedOrigin.lng) {
        originLoc = parsedOrigin;
      }
    } catch (e) {
      // Not JSON, use as string
    }
    
    try {
      const parsedDest = JSON.parse(destination);
      if (parsedDest.lat && parsedDest.lng) {
        destLoc = parsedDest;
      }
    } catch (e) {
      // Not JSON, use as string
    }

    const options = provider ? { preferredProvider: provider } : {};
    const result = await service.distanceService.calculateDistance(
      originLoc,
      destLoc,
      options
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error calculating distance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate distance' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/distance/calculate
 * Calculate distance with body payload (for complex requests)
 * 
 * Body:
 * {
 *   origin: "City, State" | {lat, lng},
 *   destination: "City, State" | {lat, lng},
 *   provider?: "osrm" | "google" | "mapbox" | "tomtom"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin, destination, provider } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Both origin and destination are required' },
        { status: 400 }
      );
    }

    const service = await getDistanceService();
    const options = provider ? { preferredProvider: provider } : {};
    
    const result = await service.distanceService.calculateDistance(
      origin,
      destination,
      options
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error calculating distance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate distance' },
      { status: 500 }
    );
  }
}

