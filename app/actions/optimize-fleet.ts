'use server';

interface OptimizationInput {
  vehicles: Array<{
    id: string;
    capacity: number;
  }>;
  orders: Array<{
    id: string;
    lat: number;
    lng: number;
    weight: number;
  }>;
}

interface RouteStep {
  stop_id: string;
  distance_from_prev_meters: number;
  cumulative_distance_meters: number;
}

interface VehicleRoute {
  vehicle_id: string;
  steps: RouteStep[];
  total_distance_meters: number;
  total_load: number;
}

interface OptimizationResponse {
  routes: VehicleRoute[];
  total_distance_meters: number;
  total_distance_km: number;
  status: string;
}

export async function optimizeFleetRoutes(data: OptimizationInput): Promise<{ success: boolean; data?: OptimizationResponse; error?: string }> {
  try {
    // 1. Transform data for Python Service
    const payload = {
      vehicles: data.vehicles.map(v => ({
        id: v.id,
        capacity_limit: v.capacity
      })),
      stops: data.orders.map(o => ({
        id: o.id,
        latitude: o.lat,
        longitude: o.lng,
        demand: o.weight
      })),
      depot: {
        latitude: 43.6532,
        longitude: -79.3832
      }
    };

    // 2. Call Python Microservice
    const response = await fetch('http://127.0.0.1:8000/api/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store' // Ensure we don't cache the result
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Optimization service failed: ${response.status} ${errorText}`);
    }

    const result: OptimizationResponse = await response.json();

    return { success: true, data: result };

  } catch (error) {
    console.error('Route optimization error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during optimization' 
    };
  }
}
