"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  User,
  MapPin,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ComparisonData {
  lane?: {
    avgMargin: number;
    avgPpm: number;
    avgRpm: number;
    tripCount: number;
  };
  driver?: {
    avgMargin: number;
    avgPpm: number;
    avgRpm: number;
    tripCount: number;
  } | null;
  driverType?: {
    type: string;
    avgMargin: number;
    avgPpm: number;
    avgRpm: number;
    tripCount: number;
  } | null;
  currentTrip: {
    margin: number;
    ppm: number;
    rpm: number;
  };
}

interface HistoricalComparisonProps {
  tripId: string;
  className?: string;
}

function ComparisonBar({
  label,
  icon: Icon,
  currentValue,
  avgValue,
  tripCount,
  format = "currency",
  suffix = "",
}: {
  label: string;
  icon: React.ElementType;
  currentValue: number;
  avgValue: number;
  tripCount: number;
  format?: "currency" | "percent";
  suffix?: string;
}) {
  const diff = currentValue - avgValue;
  const percentDiff = avgValue > 0 ? (diff / avgValue) * 100 : 0;
  const isAbove = diff > 0;
  const maxValue = Math.max(currentValue, avgValue, 1);
  const currentWidth = (currentValue / maxValue) * 100;
  const avgWidth = (avgValue / maxValue) * 100;

  const formatValue = (val: number) => {
    if (format === "currency") return formatCurrency(val) + suffix;
    return val.toFixed(1) + "%" + suffix;
  };

  if (tripCount < 2) {
    return (
      <div className="p-3 rounded-lg bg-neutral-800/30">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-neutral-500" />
          <span className="text-sm text-neutral-300">{label}</span>
        </div>
        <p className="text-xs text-neutral-500">Not enough data for comparison</p>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-neutral-800/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-neutral-500" />
          <span className="text-sm text-neutral-300">{label}</span>
          <span className="text-xs text-neutral-500">({tripCount} trips)</span>
        </div>
        <div className="flex items-center gap-1">
          {isAbove ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          ) : diff < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-neutral-400" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              isAbove ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-neutral-400"
            )}
          >
            {isAbove ? "+" : ""}
            {percentDiff.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* This Trip Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 w-16">This Trip</span>
          <div className="flex-1 h-2 rounded-full bg-neutral-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${currentWidth}%` }}
            />
          </div>
          <span className="text-xs text-neutral-200 font-medium w-20 text-right">
            {formatValue(currentValue)}
          </span>
        </div>

        {/* Average Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 w-16">Average</span>
          <div className="flex-1 h-2 rounded-full bg-neutral-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-neutral-500 transition-all duration-500"
              style={{ width: `${avgWidth}%` }}
            />
          </div>
          <span className="text-xs text-neutral-400 w-20 text-right">
            {formatValue(avgValue)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HistoricalComparison({ tripId, className }: HistoricalComparisonProps) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComparison() {
      try {
        const response = await fetch(`/api/trips/${tripId}/comparison`);
        if (!response.ok) {
          throw new Error("Failed to fetch comparison data");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching comparison:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (tripId) {
      fetchComparison();
    }
  }, [tripId]);

  if (loading) {
    return (
      <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            Historical Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            Historical Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-neutral-500 py-4">
            Unable to load comparison data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          Historical Comparison
        </CardTitle>
        <p className="text-xs text-neutral-500">
          How this trip compares to historical performance
        </p>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Lane Comparison */}
        {data.lane && (
          <ComparisonBar
            label="Lane Average"
            icon={MapPin}
            currentValue={data.currentTrip.ppm}
            avgValue={data.lane.avgPpm}
            tripCount={data.lane.tripCount}
            format="currency"
            suffix="/mi"
          />
        )}

        {/* Driver Comparison */}
        {data.driver && (
          <ComparisonBar
            label="Driver Average"
            icon={User}
            currentValue={data.currentTrip.ppm}
            avgValue={data.driver.avgPpm}
            tripCount={data.driver.tripCount}
            format="currency"
            suffix="/mi"
          />
        )}

        {/* Driver Type Comparison */}
        {data.driverType && (
          <ComparisonBar
            label={`${data.driverType.type} Drivers`}
            icon={Users}
            currentValue={data.currentTrip.margin}
            avgValue={data.driverType.avgMargin}
            tripCount={data.driverType.tripCount}
            format="percent"
          />
        )}

        {/* Margin Summary */}
        <div className="pt-2 border-t border-neutral-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-neutral-500 mb-1">This Trip</p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  data.currentTrip.margin >= 15
                    ? "text-emerald-400"
                    : data.currentTrip.margin >= 0
                    ? "text-amber-400"
                    : "text-red-400"
                )}
              >
                {data.currentTrip.margin.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Lane Avg</p>
              <p className="text-sm font-semibold text-neutral-300">
                {data.lane?.avgMargin?.toFixed(1) || "—"}%
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Driver Avg</p>
              <p className="text-sm font-semibold text-neutral-300">
                {data.driver?.avgMargin?.toFixed(1) || "—"}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
