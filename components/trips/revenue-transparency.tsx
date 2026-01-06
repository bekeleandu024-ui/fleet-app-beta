"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  BarChart3,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RevenueTransparencyProps {
  tripId: string;
  revenue: number;
  quotedRate?: number;
  totalMiles: number;
  totalCost: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  className?: string;
}

interface LaneAverage {
  avgRpm: number;
  avgPpm: number;
  avgMargin: number;
  tripCount: number;
}

export function RevenueTransparency({
  tripId,
  revenue,
  quotedRate,
  totalMiles,
  totalCost,
  pickupLocation,
  dropoffLocation,
  className,
}: RevenueTransparencyProps) {
  const [laneAvg, setLaneAvg] = useState<LaneAverage | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate metrics
  const rpm = totalMiles > 0 ? revenue / totalMiles : 0;
  const profit = revenue - totalCost;
  const ppm = totalMiles > 0 ? profit / totalMiles : 0;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Determine revenue source
  const revenueSource = revenue > 0 
    ? (quotedRate && revenue === quotedRate ? "Quoted Rate" : "Finalized Billing")
    : "Not Set";

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      fetchLaneAverage();
    }
  }, [pickupLocation, dropoffLocation]);

  async function fetchLaneAverage() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/trips/${tripId}/comparison?type=lane&pickup=${encodeURIComponent(pickupLocation || '')}&dropoff=${encodeURIComponent(dropoffLocation || '')}`
      );
      if (response.ok) {
        const data = await response.json();
        setLaneAvg(data.lane);
      }
    } catch (error) {
      console.error("Failed to fetch lane average:", error);
    } finally {
      setLoading(false);
    }
  }

  const getPpmComparison = () => {
    if (!laneAvg || laneAvg.tripCount < 2) return null;
    const diff = ppm - laneAvg.avgPpm;
    const percentDiff = laneAvg.avgPpm > 0 ? (diff / laneAvg.avgPpm) * 100 : 0;
    return { diff, percentDiff, isAbove: diff > 0 };
  };

  const comparison = getPpmComparison();

  return (
    <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-400" />
            Revenue Transparency
          </CardTitle>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              revenueSource === "Finalized Billing"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : revenueSource === "Quoted Rate"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-neutral-700 text-neutral-400"
            )}
          >
            {revenueSource}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Revenue Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
            <p className="text-xs text-neutral-500 mb-1">Total Revenue</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(revenue)}
            </p>
            {quotedRate && quotedRate !== revenue && (
              <p className="text-xs text-neutral-500 mt-1">
                Quoted: {formatCurrency(quotedRate)}
              </p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
            <p className="text-xs text-neutral-500 mb-1">Net Profit</p>
            <p
              className={cn(
                "text-lg font-bold",
                profit >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {formatCurrency(profit)}
            </p>
            <p
              className={cn(
                "text-xs mt-1",
                marginPct >= 15
                  ? "text-emerald-500"
                  : marginPct >= 0
                  ? "text-amber-500"
                  : "text-red-500"
              )}
            >
              {marginPct.toFixed(1)}% margin
            </p>
          </div>
        </div>

        {/* Per-Mile Metrics */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/30">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-neutral-300">Revenue Per Mile (RPM)</span>
            </div>
            <span className="text-sm font-medium text-neutral-200">
              {formatCurrency(rpm)}/mi
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/30">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-neutral-300">Profit Per Mile (PPM)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium",
                  ppm >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {formatCurrency(ppm)}/mi
              </span>
              {comparison && (
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-xs",
                    comparison.isAbove ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {comparison.isAbove ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(comparison.percentDiff).toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lane Comparison */}
        {laneAvg && laneAvg.tripCount >= 2 && (
          <div className="pt-3 border-t border-neutral-800">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                Lane Comparison ({laneAvg.tripCount} trips)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-neutral-800/30 text-center">
                <p className="text-neutral-500 mb-1">Lane Avg PPM</p>
                <p className="text-neutral-200 font-medium">
                  {formatCurrency(laneAvg.avgPpm)}/mi
                </p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-800/30 text-center">
                <p className="text-neutral-500 mb-1">Lane Avg Margin</p>
                <p className="text-neutral-200 font-medium">
                  {laneAvg.avgMargin.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-neutral-800/30 text-center">
                <p className="text-neutral-500 mb-1">This Trip vs Avg</p>
                <p
                  className={cn(
                    "font-medium",
                    comparison?.isAbove ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {comparison?.isAbove ? "+" : ""}
                  {formatCurrency(comparison?.diff || 0)}/mi
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Lane Data */}
        {(!laneAvg || laneAvg.tripCount < 2) && !loading && (
          <div className="pt-3 border-t border-neutral-800">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Info className="h-3.5 w-3.5" />
              <span>
                {loading
                  ? "Loading lane comparison..."
                  : "Not enough lane history for comparison"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
