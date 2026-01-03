import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { 
  DispatchSimulationService, 
  SimulationRequest,
  SimulationResponse 
} from '@/lib/services/dispatch-simulation';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

/**
 * POST /api/dispatch/simulate
 * 
 * Runs Fleet vs. Brokerage dispatch simulation for a given trip.
 * 
 * Request Body:
 * {
 *   "trip_id": "DFT-123",
 *   "trip_requirements": {
 *     "weight": 35000,
 *     "equipment_type": "Dry Van"
 *   },
 *   "route": [
 *     { "type": "PICKUP", "location_id": "LOC_A", "city": "Kitchener", "zip": "N2C" },
 *     { "type": "DROP", "location_id": "LOC_Z", "city": "Windsor", "zip": "N9A" }
 *   ]
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse<SimulationResponse | { error: string }>> {
  try {
    const body = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error! },
        { status: 400 }
      );
    }

    const simulationRequest: SimulationRequest = {
      trip_id: body.trip_id,
      trip_requirements: {
        weight: body.trip_requirements?.weight || 40000,
        equipment_type: body.trip_requirements?.equipment_type || 'Dry Van',
      },
      route: body.route.map((stop: any) => ({
        type: stop.type,
        location_id: stop.location_id || stop.id,
        address: stop.address,
        city: stop.city,
        zip: stop.zip,
        lat: stop.lat,
        lng: stop.lng,
        appointment_time: stop.appointment_time,
      })),
    };

    // Run simulation
    const service = new DispatchSimulationService(pool);
    const result = await service.simulate(simulationRequest);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Dispatch simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dispatch/simulate
 * 
 * Returns simulation schema and sample request for documentation.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/dispatch/simulate',
    method: 'POST',
    description: 'Fleet vs. Brokerage dispatch simulation engine',
    request_schema: {
      trip_id: 'string (required)',
      trip_requirements: {
        weight: 'number (lbs)',
        equipment_type: "'Dry Van' | 'Reefer' | 'Flatbed'",
      },
      route: [
        {
          type: "'PICKUP' | 'DROP'",
          location_id: 'string',
          city: 'string (optional)',
          zip: 'string (optional)',
          lat: 'number (optional)',
          lng: 'number (optional)',
        },
      ],
    },
    sample_request: {
      trip_id: 'DFT-123',
      trip_requirements: {
        weight: 35000,
        equipment_type: 'Dry Van',
      },
      route: [
        { type: 'PICKUP', location_id: 'LOC_COMTECH', city: 'Milton', zip: 'L9T' },
        { type: 'DROP', location_id: 'LOC_WINDSOR', city: 'Windsor', zip: 'N9A' },
      ],
    },
    scenarios_evaluated: [
      'DIRECT_HAUL - Single driver, full route execution',
      'TRAILER_POOL - Use pre-positioned trailer at pickup location',
      'SPLIT_STAGING - Local driver first leg, Highway driver main haul',
    ],
  });
}

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body.trip_id) {
    return { valid: false, error: 'trip_id is required' };
  }

  if (!body.route || !Array.isArray(body.route) || body.route.length < 2) {
    return { valid: false, error: 'route must be an array with at least 2 stops' };
  }

  const hasPickup = body.route.some((s: any) => s.type === 'PICKUP');
  const hasDrop = body.route.some((s: any) => s.type === 'DROP');

  if (!hasPickup || !hasDrop) {
    return { valid: false, error: 'route must include at least one PICKUP and one DROP' };
  }

  const validEquipment = ['Dry Van', 'Reefer', 'Flatbed'];
  if (body.trip_requirements?.equipment_type && !validEquipment.includes(body.trip_requirements.equipment_type)) {
    return { valid: false, error: `equipment_type must be one of: ${validEquipment.join(', ')}` };
  }

  return { valid: true };
}
