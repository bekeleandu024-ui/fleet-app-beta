'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Truck, Navigation, AlertCircle, CheckCircle2, BarChart3, RefreshCw, Database, MapPinned } from 'lucide-react';

interface OptimizationData {
  stops: Array<{
    id: string;
    tripId: string;
    orderId: string;
    location: string;
    latitude: number;
    longitude: number;
    demand: number;
    customer: string;
    stop_type: 'pickup' | 'delivery';
  }>;
  vehicles: Array<{
    id: string;
    unitNumber: string;
    driverName: string;
    driverType: string;
    capacity_limit: number;
  }>;
  depot: { latitude: number; longitude: number };
  pickupDeliveryPairs?: Array<{ pickup_index: number; delivery_index: number }>;
  hasData: boolean;
  totalTrips: number;
  totalStops: number;
  tripsWithCoords: number;
  availableVehicles: number;
  tripsNeedingCoords?: Array<{
    id: string;
    pickupLocation: string;
    dropoffLocation: string;
    hasPickupCoords: boolean;
    hasDropoffCoords: boolean;
  }>;
}

export default function OptimizePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizationData, setOptimizationData] = useState<OptimizationData | null>(null);
  const [useRealData, setUseRealData] = useState(true);

  // Geocode trips that are missing coordinates
  const handleGeocode = async () => {
    setGeocoding(true);
    setError(null);
    setGeocodeResult(null);
    try {
      const res = await fetch('/api/optimize/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Geocoding failed');
      }
      
      const data = await res.json();
      setGeocodeResult(data);
      
      // Refresh the optimization data to show updated coords
      await fetchOptimizationData();
    } catch (e: any) {
      console.error('Geocoding error:', e);
      setError(e.message || 'Failed to geocode addresses');
    } finally {
      setGeocoding(false);
    }
  };

  // Fetch real data from database
  const fetchOptimizationData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/optimize/data');
      if (!res.ok) throw new Error('Failed to fetch optimization data');
      const data = await res.json();
      setOptimizationData(data);
    } catch (e: any) {
      console.error('Failed to load optimization data:', e);
      setOptimizationData(null);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchOptimizationData();
  }, []);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      let payload;

      if (useRealData && optimizationData?.hasData) {
        // Use real data from database with pickup-delivery pairs
        payload = {
          vehicles: optimizationData.vehicles.slice(0, 5).map(v => ({
            id: v.unitNumber || v.id.slice(0, 8),
            capacity_limit: v.capacity_limit,
          })),
          stops: optimizationData.stops.map((s: any) => ({
            id: s.id,
            latitude: s.latitude,
            longitude: s.longitude,
            demand: s.demand,
            stop_type: s.stop_type,
          })),
          depot: optimizationData.depot,
          // Include pickup-delivery pairs for proper sequencing
          pickup_delivery_pairs: (optimizationData as any).pickupDeliveryPairs || [],
        };
      } else {
        // Fallback demo data
        payload = {
          vehicles: [
            { id: "v1", capacity_limit: 2 },
            { id: "v2", capacity_limit: 2 }
          ],
          stops: [
            { id: "s1", latitude: 40.7128, longitude: -74.0060, demand: 1 }, // NYC
            { id: "s2", latitude: 39.9526, longitude: -75.1652, demand: 1 }, // Philly
            { id: "s3", latitude: 42.3601, longitude: -71.0589, demand: 1 }  // Boston
          ],
          depot: { latitude: 40.730610, longitude: -73.935242 } // NYC Depot
        };
      }

      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`Optimization failed: ${res.statusText}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Route Optimization Engine</h1>
            <p className="text-zinc-500 mt-2 max-w-2xl">
              Advanced fleet routing using OR-Tools. Calculates optimal stop sequences to minimize total fleet distance and cost.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchOptimizationData}
              disabled={loadingData}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button 
              onClick={handleOptimize} 
              disabled={loading}
              size="lg"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Navigation className="mr-2 h-4 w-4 animate-spin" />
                  Running Solver...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {useRealData && optimizationData?.hasData ? 'Optimize Routes' : 'Run Demo'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Data Source Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-zinc-100">Data Source</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useRealData}
                    onChange={(e) => setUseRealData(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-400">Use Real Database Data</span>
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-zinc-500 text-sm">Loading optimization data...</div>
            ) : optimizationData?.hasData ? (
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <div className="text-2xl font-bold text-emerald-400">{optimizationData.tripsWithCoords}</div>
                  <div className="text-xs text-zinc-500 mt-1">Trips Ready</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <div className="text-2xl font-bold text-purple-400">{optimizationData.stops.length}</div>
                  <div className="text-xs text-zinc-500 mt-1">Total Stops (P+D)</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <div className="text-2xl font-bold text-blue-400">{optimizationData.availableVehicles}</div>
                  <div className="text-xs text-zinc-500 mt-1">Available Vehicles</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <div className="text-2xl font-bold text-cyan-400">2</div>
                  <div className="text-xs text-zinc-500 mt-1">Capacity/Vehicle</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <div className="text-2xl font-bold text-amber-400">{optimizationData.totalTrips - optimizationData.tripsWithCoords}</div>
                  <div className="text-xs text-zinc-500 mt-1">Need Geocoding</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-amber-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {optimizationData?.totalTrips ? (
                    <span>{optimizationData.totalTrips} trips found, but none have coordinates yet. Using demo data.</span>
                  ) : (
                    <span>No active trips found. Using demo data (NYC, Philly, Boston).</span>
                  )}
                </div>
                
                {/* Show trips needing coordinates */}
                {optimizationData?.tripsNeedingCoords && optimizationData.tripsNeedingCoords.length > 0 && (
                  <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-zinc-400 font-medium">Trips Missing Coordinates:</div>
                      <Button
                        onClick={handleGeocode}
                        disabled={geocoding}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        {geocoding ? (
                          <>
                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                            Geocoding...
                          </>
                        ) : (
                          <>
                            <MapPinned className="mr-2 h-3 w-3" />
                            Geocode All Trips
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Geocode Result */}
                    {geocodeResult && (
                      <div className="mb-3 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            Geocoded {geocodeResult.successfullyGeocoded} of {geocodeResult.processed} trips successfully!
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {optimizationData.tripsNeedingCoords.slice(0, 5).map((trip, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800 last:border-0">
                          <div className="flex-1 truncate">
                            <span className="text-zinc-300">{trip.pickupLocation || 'Unknown'}</span>
                            <span className="text-zinc-600 mx-2">→</span>
                            <span className="text-zinc-300">{trip.dropoffLocation || 'Unknown'}</span>
                          </div>
                          <div className="flex gap-1 ml-2">
                            {!trip.hasPickupCoords && <Badge variant="outline" className="text-[10px] border-red-900/50 text-red-400">No Pickup</Badge>}
                            {!trip.hasDropoffCoords && <Badge variant="outline" className="text-[10px] border-red-900/50 text-red-400">No Dropoff</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-3">
                      💡 Click "Geocode All Trips" to convert addresses to GPS coordinates using Google Maps.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {optimizationData?.hasData && optimizationData.stops.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 mb-2">Sample Stops:</div>
                <div className="flex flex-wrap gap-2">
                  {optimizationData.stops.slice(0, 5).map((stop, i) => (
                    <Badge key={i} variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                      {stop.location?.slice(0, 25) || stop.id}
                    </Badge>
                  ))}
                  {optimizationData.stops.length > 5 && (
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                      +{optimizationData.stops.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {!result && !loading && !error && (
           <Card className="bg-zinc-900 border-zinc-800">
             <CardContent className="pt-6 text-center py-20">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-300">Ready to Optimize</h3>
                <p className="text-zinc-500 mt-2 max-w-md mx-auto">
                  {useRealData && optimizationData?.hasData 
                    ? `Click "Run Optimization" to solve routing for ${optimizationData.stops.length} stops across ${Math.min(5, optimizationData.availableVehicles)} vehicles.`
                    : 'Click "Run Optimization" to solve the routing problem (using demo data: NYC, Philly, Boston).'}
                </p>
             </CardContent>
           </Card>
        )}
        
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Summary Card */}
            <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="text-zinc-100">Optimization Summary</CardTitle>
                <CardDescription className="text-zinc-500">Key performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="text-sm text-zinc-500">Solver Status</div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-400 font-mono font-bold">{result.status}</span>
                  </div>
                </div>
                
                <Separator className="bg-zinc-800" />
                
                <div className="space-y-2">
                  <div className="text-sm text-zinc-500">Total Fleet Distance</div>
                  <div className="text-3xl font-bold text-white tracking-tight">
                    {(result.total_distance_km).toFixed(1)} <span className="text-lg text-zinc-600 font-normal">km</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-500">Vehicles Used</span>
                    <span className="text-zinc-300">{result.routes?.filter((r: any) => r.steps.length > 0).length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Total Stops</span>
                    <span className="text-zinc-300">
                      {result.routes?.reduce((acc: number, r: any) => acc + r.steps.length, 0) || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Routes List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">Optimized Routes</h2>
              {result.routes?.filter((route: any) => route.steps.length > 0).map((route: any, i: number) => (
                <Card key={route.vehicle_id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <div className="bg-zinc-950/50 p-4 border-b border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-900/30 rounded-md flex items-center justify-center border border-blue-800/30">
                        <Truck className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200">Vehicle {route.vehicle_id}</div>
                        <div className="text-xs text-zinc-500">Route #{i + 1}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                      {(route.total_distance_meters / 1000).toFixed(1)} km
                    </Badge>
                  </div>
                  
                  <CardContent className="p-0">
                    <div className="relative p-6">
                      {/* Vertical Line */}
                      <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-zinc-800" />
                      
                      <div className="space-y-6">
                        {/* Depot Start */}
                        <div className="relative flex items-start gap-4">
                           <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center z-10 mt-0.5">
                              <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                           </div>
                           <div>
                              <div className="text-sm font-medium text-zinc-400">Depot Departure</div>
                              <div className="text-xs text-zinc-600">Start of route</div>
                           </div>
                        </div>

                        {route.steps.map((step: any, idx: number) => {
                          const isPickup = step.stop_id?.startsWith('pickup-');
                          const isDelivery = step.stop_id?.startsWith('delivery-');
                          const tripId = step.stop_id?.replace('pickup-', '').replace('delivery-', '');
                          
                          return (
                          <div key={idx} className="relative flex items-start gap-4 group">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 mt-0.5 shadow-lg ${
                              isPickup 
                                ? 'bg-emerald-950 border-2 border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                : isDelivery 
                                  ? 'bg-orange-950 border-2 border-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                                  : 'bg-blue-950 border-2 border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                            }`}>
                              <span className={`text-[10px] font-bold ${
                                isPickup ? 'text-emerald-400' : isDelivery ? 'text-orange-400' : 'text-blue-400'
                              }`}>{idx + 1}</span>
                            </div>
                            <div className="flex-1 bg-zinc-950/50 p-3 rounded-md border border-zinc-800/50 group-hover:border-zinc-700 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                                    <MapPin className={`w-3 h-3 ${isPickup ? 'text-emerald-500' : isDelivery ? 'text-orange-500' : 'text-zinc-500'}`} />
                                    <span>{isPickup ? '📦 Pickup' : isDelivery ? '🚚 Delivery' : 'Stop'}</span>
                                    <span className="text-zinc-500 font-mono text-xs">{tripId}</span>
                                  </div>
                                  <div className="text-xs text-zinc-500 mt-1">
                                    Leg: {(step.distance_from_prev_meters / 1000).toFixed(1)} km
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono text-zinc-400">
                                    {(step.cumulative_distance_meters / 1000).toFixed(1)} km
                                  </div>
                                  <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">Cumulative</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
