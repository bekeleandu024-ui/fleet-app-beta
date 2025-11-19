"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calculator, ArrowLeft, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Trip {
  id: string;
  tripNumber: string;
  driver: string;
  unit: string;
  status: string;
  pickup: string;
  delivery: string;
}

interface CostBreakdown {
  category: string;
  label: string;
  original: number;
  current: number;
  adjustment: number;
  reason?: string;
}

interface TripCosts {
  originalTotalCost: number;
  currentTotalCost: number;
  originalRevenue: number;
  currentRevenue: number;
  originalMargin: number;
  currentMargin: number;
  breakdown: CostBreakdown[];
}

interface EventAdjustment {
  id: string;
  eventType: string;
  eventLabel: string;
  timestamp: string;
  costImpact: number;
  reason: string;
  applied: boolean;
}

export default function TripRecalcPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [costs, setCosts] = useState<TripCosts | null>(null);
  const [eventAdjustments, setEventAdjustments] = useState<EventAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTripData = async () => {
    try {
      const tripResponse = await fetch(`/api/trips/${tripId}`);
      
      if (tripResponse.ok) {
        const tripData = await tripResponse.json();
        setTrip(tripData);
        
        // Calculate costs (mock data for now)
        calculateCosts(tripData);
        
        // Fetch event-based adjustments
        fetchEventAdjustments();
      }
    } catch (error) {
      console.error("Error fetching trip data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCosts = (tripData: any) => {
    // Mock cost calculation - in production, this would come from backend
    const mockCosts: TripCosts = {
      originalTotalCost: 2450.00,
      currentTotalCost: 2685.00,
      originalRevenue: 3200.00,
      currentRevenue: 3200.00,
      originalMargin: 23.44,
      currentMargin: 16.09,
      breakdown: [
        {
          category: "driver_wage",
          label: "Driver Wage",
          original: 850.00,
          current: 950.00,
          adjustment: 100.00,
          reason: "Dwell time at pickup (2.5 hours)",
        },
        {
          category: "fuel",
          label: "Fuel Cost",
          original: 420.00,
          current: 445.00,
          adjustment: 25.00,
          reason: "Detour due to road closure",
        },
        {
          category: "border_delay",
          label: "Border Crossing",
          original: 150.00,
          current: 240.00,
          adjustment: 90.00,
          reason: "Extended customs inspection (3 hours)",
        },
        {
          category: "truck_maintenance",
          label: "Truck Maintenance",
          original: 380.00,
          current: 400.00,
          adjustment: 20.00,
          reason: "Additional mileage",
        },
        {
          category: "trailer_maintenance",
          label: "Trailer Maintenance",
          original: 250.00,
          current: 250.00,
          adjustment: 0.00,
        },
        {
          category: "insurance",
          label: "Insurance & Rolling",
          original: 400.00,
          current: 400.00,
          adjustment: 0.00,
        },
      ],
    };

    setCosts(mockCosts);
  };

  const fetchEventAdjustments = () => {
    // Mock event adjustments - in production, would analyze trip events
    const mockAdjustments: EventAdjustment[] = [
      {
        id: "adj1",
        eventType: "DWELL_TIME",
        eventLabel: "Dwell Time at Pickup",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        costImpact: 100.00,
        reason: "Driver waited 2.5 hours at pickup location",
        applied: true,
      },
      {
        id: "adj2",
        eventType: "BORDER_DELAY",
        eventLabel: "Border Crossing Delay",
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        costImpact: 90.00,
        reason: "Extended customs inspection (3 hours)",
        applied: true,
      },
      {
        id: "adj3",
        eventType: "DETOUR",
        eventLabel: "Route Detour",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        costImpact: 25.00,
        reason: "Road closure required 15-mile detour",
        applied: true,
      },
      {
        id: "adj4",
        eventType: "WEATHER_DELAY",
        eventLabel: "Weather-Related Delay",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        costImpact: 50.00,
        reason: "Stopped for severe weather (1 hour)",
        applied: false,
      },
    ];

    setEventAdjustments(mockAdjustments);
  };

  const toggleAdjustment = (adjustmentId: string) => {
    setEventAdjustments(prev => 
      prev.map(adj => 
        adj.id === adjustmentId ? { ...adj, applied: !adj.applied } : adj
      )
    );

    // Recalculate costs based on toggled adjustments
    if (costs) {
      const adjustment = eventAdjustments.find(a => a.id === adjustmentId);
      if (adjustment) {
        const newTotal = adjustment.applied 
          ? costs.currentTotalCost - adjustment.costImpact
          : costs.currentTotalCost + adjustment.costImpact;
        
        const newMargin = ((costs.currentRevenue - newTotal) / costs.currentRevenue) * 100;
        
        setCosts({
          ...costs,
          currentTotalCost: newTotal,
          currentMargin: newMargin,
        });
      }
    }
  };

  const handleConfirmRecalc = async () => {
    if (!costs) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/recalc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newTotalCost: costs.currentTotalCost,
          newMargin: costs.currentMargin,
          breakdown: costs.breakdown,
          adjustments: eventAdjustments.filter(a => a.applied),
        }),
      });

      if (!response.ok) throw new Error("Failed to update trip costs");

      setMessage({ type: "success", text: "Trip costs updated successfully!" });
      
      setTimeout(() => {
        router.push(`/trips/${tripId}`);
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to update costs" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchTripData();
  }, [tripId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-2 text-sm text-gray-400">Loading trip data...</p>
        </div>
      </div>
    );
  }

  if (!trip || !costs) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
          <p className="mt-2 text-sm text-gray-400">Trip not found</p>
          <Button onClick={() => router.push("/trips")} className="mt-4">
            Back to Trips
          </Button>
        </div>
      </div>
    );
  }

  const marginChange = costs.currentMargin - costs.originalMargin;
  const costChange = costs.currentTotalCost - costs.originalTotalCost;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-linear-to-r from-gray-900 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/trips")}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Calculator className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Cost Recalculation</h1>
                <p className="text-sm text-gray-400">Trip #{trip.tripNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Before/After Comparison */}
          <div className="col-span-5 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gray-900/50 backdrop-blur border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Original Cost</p>
                <p className="text-2xl text-white font-bold">${costs.originalTotalCost.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Margin: {costs.originalMargin.toFixed(2)}%</p>
              </Card>
              
              <Card className="p-4 bg-gray-900/50 backdrop-blur border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Recalculated Cost</p>
                <p className="text-2xl text-white font-bold">${costs.currentTotalCost.toFixed(2)}</p>
                <p className={`text-xs font-medium mt-1 ${marginChange < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  Margin: {costs.currentMargin.toFixed(2)}%
                  {marginChange !== 0 && (
                    <span className="ml-1">
                      ({marginChange > 0 ? "+" : ""}{marginChange.toFixed(2)}%)
                    </span>
                  )}
                </p>
              </Card>
            </div>

            {/* Cost Breakdown */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                {costs.breakdown.map((item) => (
                  <div key={item.category} className={`p-3 rounded-lg border ${
                    item.adjustment !== 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-gray-800/30 border-gray-700/50"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium">{item.label}</span>
                      {item.adjustment !== 0 && (
                        <span className="text-xs font-semibold text-amber-400">
                          +${item.adjustment.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        ${item.original.toFixed(2)} → ${item.current.toFixed(2)}
                      </span>
                      {item.adjustment !== 0 && (
                        <span className="text-amber-400">{((item.adjustment / item.original) * 100).toFixed(1)}%</span>
                      )}
                    </div>
                    {item.reason && (
                      <p className="text-xs text-gray-500 mt-2">{item.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Impact Summary */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Impact Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Cost Increase</span>
                  <span className={`text-sm font-semibold ${costChange > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {costChange > 0 ? "+" : ""}${costChange.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Revenue</span>
                  <span className="text-sm font-semibold text-white">${costs.currentRevenue.toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-700" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Margin Change</span>
                  <div className="flex items-center gap-2">
                    {marginChange < 0 ? (
                      <TrendingDown className="h-4 w-4 text-rose-400" />
                    ) : marginChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : null}
                    <span className={`text-sm font-semibold ${
                      marginChange < 0 ? "text-rose-400" : marginChange > 0 ? "text-emerald-400" : "text-gray-400"
                    }`}>
                      {marginChange > 0 ? "+" : ""}{marginChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Event-Based Adjustments */}
          <div className="col-span-7 space-y-6">
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">Event-Based Adjustments</h3>
                <span className="text-xs text-gray-500">
                  {eventAdjustments.filter(a => a.applied).length} of {eventAdjustments.length} applied
                </span>
              </div>

              <div className="space-y-3">
                {eventAdjustments.map((adjustment) => (
                  <div
                    key={adjustment.id}
                    className={`p-4 rounded-lg border transition-all ${
                      adjustment.applied
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-gray-800/30 border-gray-700/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{adjustment.eventLabel}</span>
                          <span className={`text-xs font-semibold ${adjustment.applied ? "text-amber-400" : "text-gray-500"}`}>
                            +${adjustment.costImpact.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{adjustment.reason}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(adjustment.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={adjustment.applied}
                          onChange={() => toggleAdjustment(adjustment.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
                        />
                        <span className="text-xs text-gray-400">Apply</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Confirm Button */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <Button
                onClick={handleConfirmRecalc}
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating Costs...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Confirm Cost Recalculation
                  </>
                )}
              </Button>

              {message && (
                <div className={`mt-4 rounded-lg border p-3 text-sm ${
                  message.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}>
                  {message.text}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3 text-center">
                This will update the trip's cost breakdown and recalculate the final margin
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
