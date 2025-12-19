'use client';

import { useState, useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { optimizeFleetRoutes } from '@/app/actions/optimize-fleet';

// --- Types (You might want to move these to a shared types file) ---

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

// --- Helper: Color Palette for Routes ---
const ROUTE_COLORS = [
  '#3B82F6', // Blue 500 (Brighter for Dark Mode)
  '#EF4444', // Red 500
  '#22C55E', // Green 500
  '#A855F7', // Purple 500
  '#F97316', // Orange 500
  '#06B6D4', // Cyan 500
  '#EC4899', // Pink 500
  '#EAB308', // Yellow 500
];

function RoutePolyline({ path, color }: { path: google.maps.LatLngLiteral[], color: string }) {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !maps) return;

    const p = new maps.Polyline({
      path,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 5,
      geodesic: true,
      icons: [{
        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
        offset: '100%',
        repeat: '100px'
      }],
      map
    });

    setPolyline(p);

    return () => {
      p.setMap(null);
    };
  }, [map, maps, path, color]);

  return null;
}

export function OptimizationLayer({ 
  orders, 
  vehicles 
}: { 
  orders: any[], 
  vehicles: any[] 
}) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<VehicleRoute[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      // Call the Server Action
      const result = await optimizeFleetRoutes({
        orders: orders,
        vehicles: vehicles
      });

      if (result.success && result.data) {
        setOptimizedRoutes(result.data.routes);
      } else {
        setError(result.error || 'Optimization failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Helper to find coordinates for a stop ID
  // Note: In a real app, the route response might include coords, 
  // or we look them up from the 'orders' prop.
  const getCoordinatesForStop = (stopId: string) => {
    const order = orders.find(o => o.id === stopId);
    if (order) return { lat: order.lat, lng: order.lng };
    return null;
  };

  // Depot coordinates (matching the server action hardcoded ones for now)
  const DEPOT_LOCATION = { lat: 43.6532, lng: -79.3832 };

  return (
    <>
      {/* --- Controls UI --- */}
      <div className="absolute top-4 right-4 z-10 bg-zinc-900 p-4 rounded-lg shadow-lg border border-zinc-800 w-80">
        <h3 className="font-semibold text-zinc-100 mb-2">Route Optimization</h3>
        
        <div className="flex justify-between text-sm text-zinc-400 mb-4">
          <span>Orders: {orders.length}</span>
          <span>Vehicles: {vehicles.length}</span>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-900/20 text-red-400 text-xs rounded border border-red-900/50">
            {error}
          </div>
        )}

        <button
          onClick={handleOptimize}
          disabled={isOptimizing || orders.length === 0}
          className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors
            ${isOptimizing 
              ? 'bg-zinc-700 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
            }`}
        >
          {isOptimizing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating Routes...
            </span>
          ) : (
            'Optimize Routes'
          )}
        </button>

        {optimizedRoutes.length > 0 && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            <p className="text-xs font-medium text-zinc-500 uppercase">Results</p>
            {optimizedRoutes.map((route, idx) => (
              <div key={route.vehicle_id} className="flex items-center gap-2 text-sm p-2 bg-black rounded border border-zinc-800">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: ROUTE_COLORS[idx % ROUTE_COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="font-medium text-zinc-200">Vehicle {route.vehicle_id}</div>
                  <div className="text-xs text-zinc-500">
                    {route.steps.length} stops • {(route.total_distance_meters / 1000).toFixed(1)} km
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Map Polylines --- */}
      {optimizedRoutes.map((route, idx) => {
        const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        
        // Construct the path: Depot -> Stop 1 -> Stop 2 -> ...
        // Note: The Python response gives us ordered stops. 
        // We need to reconstruct the full path coordinates.
        const path = [
          DEPOT_LOCATION, // Start at depot
          ...route.steps.map(step => getCoordinatesForStop(step.stop_id)).filter(Boolean) as google.maps.LatLngLiteral[]
        ];

        return (
          <RoutePolyline
            key={route.vehicle_id}
            path={path}
            color={color}
          />
        );
      })}
    </>
  );
}
