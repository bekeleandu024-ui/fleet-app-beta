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
    pickupCity?: string;
    deliveryCity?: string;
    latitude: number;
    longitude: number;
    demand: number;
    weight_lbs?: number;
    volume_cuft?: number;
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
  stopLocationMap?: Record<string, { pickup: string; delivery: string; customer: string }>;
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
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-black text-zinc-300 overflow-hidden -m-6">
      {/* Header */}
      <header className="flex-none border-b border-zinc-800 bg-zinc-950 px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500" />
            Route Optimization Engine
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchOptimizationData}
            disabled={loadingData}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-8 text-xs"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Configuration */}
        <aside className="w-[400px] flex-none border-r border-zinc-800 bg-zinc-900/30 flex flex-col">
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            
            {/* Control Panel */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-sm">
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-sm font-medium text-zinc-100">Data Source</CardTitle>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useRealData}
                      onChange={(e) => setUseRealData(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-zinc-400">Use Real Data</span>
                  </label>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loadingData ? (
                  <div className="text-zinc-500 text-xs py-4 text-center">Loading optimization data...</div>
                ) : optimizationData?.hasData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                        <div className="text-xl font-bold text-emerald-400">{optimizationData.tripsWithCoords}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Trips Ready</div>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                        <div className="text-xl font-bold text-purple-400">{optimizationData.stops.length}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Stops</div>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                        <div className="text-xl font-bold text-blue-400">{optimizationData.availableVehicles}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Vehicles</div>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                        <div className="text-xl font-bold text-amber-400">{optimizationData.totalTrips - optimizationData.tripsWithCoords}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Pending</div>
                      </div>
                    </div>

                    {/* Trips needing coords */}
                    {optimizationData.tripsNeedingCoords && optimizationData.tripsNeedingCoords.length > 0 && (
                      <div className="bg-zinc-950/50 rounded border border-zinc-800 overflow-hidden">
                        <div className="p-2 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                          <span className="text-[10px] font-medium text-zinc-400">MISSING COORDINATES</span>
                          <Button
                            onClick={handleGeocode}
                            disabled={geocoding}
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 px-2"
                          >
                            {geocoding ? 'Geocoding...' : 'Fix All'}
                          </Button>
                        </div>
                        <div className="max-h-[150px] overflow-y-auto p-2 space-y-1">
                           {optimizationData.tripsNeedingCoords.map((trip, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] py-1 border-b border-zinc-800/50 last:border-0">
                              <div className="truncate max-w-[180px] text-zinc-400">
                                {trip.pickupLocation} → {trip.dropoffLocation}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-amber-400 text-xs flex items-start gap-2 bg-amber-950/20 p-3 rounded border border-amber-900/30">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {optimizationData?.totalTrips ? (
                        <span>{optimizationData.totalTrips} trips found, but none have coordinates yet. Using demo data.</span>
                      ) : (
                        <span>No active trips found. Using demo data.</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-md flex items-start gap-3 text-red-400 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <Button 
              onClick={handleOptimize} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold h-10 shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <>
                  <Navigation className="mr-2 h-4 w-4 animate-spin" />
                  Solving Route Problem...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {useRealData && optimizationData?.hasData ? 'Run Optimization' : 'Run Demo Simulation'}
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-black relative">
          {!result && !loading && (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                  <Navigation className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-xl font-medium text-zinc-300">Ready to Optimize</h3>
                <p className="text-sm mt-2 max-w-md text-center text-zinc-600">
                  Configure your data source in the sidebar and click "Run Optimization" to generate efficient routes.
                </p>
             </div>
          )}

          {result && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Summary Bar */}
              <div className="flex-none bg-zinc-900/80 border-b border-zinc-800 p-4 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
                  <div className="flex items-center gap-8">
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Status</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-400 font-mono font-bold text-sm">{result.status}</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-zinc-800" />
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Total Distance</div>
                      <div className="text-lg font-bold text-white tracking-tight mt-0.5">
                        {(result.total_distance_km).toFixed(1)} <span className="text-xs text-zinc-600 font-normal">km</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-zinc-800" />
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Vehicles</div>
                      <div className="text-lg font-bold text-white tracking-tight mt-0.5">
                        {result.routes?.filter((r: any) => r.steps.length > 0).length || 0}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-zinc-800" />
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Stops</div>
                      <div className="text-lg font-bold text-white tracking-tight mt-0.5">
                        {result.routes?.reduce((acc: number, r: any) => acc + r.steps.length, 0) || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Routes Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                  {result.routes?.filter((route: any) => route.steps.length > 0).map((route: any, i: number) => (
                    <Card key={route.vehicle_id} className="bg-zinc-900 border-zinc-800 overflow-hidden shadow-lg">
                      <div className="bg-zinc-950/80 p-3 border-b border-zinc-800 flex justify-between items-center px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-900/20 rounded flex items-center justify-center border border-blue-800/30">
                            <Truck className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-zinc-200 text-sm">Vehicle {route.vehicle_id}</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700 font-mono text-xs">
                          {(route.total_distance_meters / 1000).toFixed(1)} km
                        </Badge>
                      </div>
                      
                      <CardContent className="p-0">
                        <div className="relative p-5">
                          {/* Vertical Line */}
                          <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-zinc-800" />
                          
                          <div className="space-y-4">
                            {/* Depot Start */}
                            <div className="relative flex items-start gap-4">
                               <div className="w-5 h-5 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center z-10 mt-0.5">
                                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                               </div>
                               <div className="pt-0.5">
                                  <div className="text-xs font-medium text-zinc-400">Depot Departure</div>
                               </div>
                            </div>

                            {route.steps.map((step: any, idx: number) => {
                              const isPickup = step.stop_id?.startsWith('pickup-');
                              const isDelivery = step.stop_id?.startsWith('delivery-');
                              const locationInfo = optimizationData?.stopLocationMap?.[step.stop_id];
                              
                              return (
                              <div key={idx} className="relative flex items-start gap-4 group">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center z-10 mt-0.5 shadow-lg ${
                                  isPickup 
                                    ? 'bg-emerald-950 border-2 border-emerald-600' 
                                    : isDelivery 
                                      ? 'bg-orange-950 border-2 border-orange-600'
                                      : 'bg-blue-950 border-2 border-blue-600'
                                }`}>
                                  <span className={`text-[9px] font-bold ${
                                    isPickup ? 'text-emerald-400' : isDelivery ? 'text-orange-400' : 'text-blue-400'
                                  }`}>{idx + 1}</span>
                                </div>
                                <div className="flex-1 bg-zinc-950/30 p-2 rounded border border-zinc-800/50 group-hover:border-zinc-700 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                                        <span className={isPickup ? 'text-emerald-500' : isDelivery ? 'text-orange-500' : 'text-zinc-500'}>
                                          {isPickup ? 'Pickup' : isDelivery ? 'Delivery' : 'Stop'}
                                        </span>
                                        {locationInfo && (
                                          <span className="text-zinc-500 truncate max-w-[200px]">• {locationInfo.customer}</span>
                                        )}
                                      </div>
                                      {locationInfo && (
                                        <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                          {isPickup ? (
                                            <span>{locationInfo.pickup}</span>
                                          ) : (
                                            <span>{locationInfo.delivery}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right pl-2 shrink-0">
                                      <div className="text-[10px] font-mono text-zinc-500">
                                        {(step.cumulative_distance_meters / 1000).toFixed(1)} km
                                      </div>
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
