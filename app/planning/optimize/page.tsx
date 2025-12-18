'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Truck, Navigation, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';

export default function OptimizePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data for demonstration
      const payload = {
        vehicles: [
            { id: "v1", capacity_limit: 10 },
            { id: "v2", capacity_limit: 10 }
        ],
        stops: [
            { id: "s1", latitude: 40.7128, longitude: -74.0060, demand: 1 }, // NYC
            { id: "s2", latitude: 39.9526, longitude: -75.1652, demand: 1 }, // Philly
            { id: "s3", latitude: 42.3601, longitude: -71.0589, demand: 1 }  // Boston
        ],
        depot: { latitude: 40.730610, longitude: -73.935242 } // NYC Depot
      };

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
                Run Optimization
              </>
            )}
          </Button>
        </div>

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
                  Click "Run Optimization" to solve the routing problem for the current fleet state (NYC, Philly, Boston demo data).
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
                    <span className="text-zinc-300">{result.routes?.length || 0}</span>
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
              {result.routes?.map((route: any, i: number) => (
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

                        {route.steps.map((step: any, idx: number) => (
                          <div key={idx} className="relative flex items-start gap-4 group">
                            <div className="w-6 h-6 rounded-full bg-blue-950 border-2 border-blue-600 flex items-center justify-center z-10 mt-0.5 shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                              <span className="text-[10px] font-bold text-blue-400">{idx + 1}</span>
                            </div>
                            <div className="flex-1 bg-zinc-950/50 p-3 rounded-md border border-zinc-800/50 group-hover:border-zinc-700 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-zinc-500" />
                                    Stop {step.stop_id}
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
                        ))}
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
