"use client";

import { useEffect, useState } from "react";
import {
  User,
  TrendingUp,
  Clock,
  DollarSign,
  Star,
  Loader2,
  Truck,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DriverScorecardData {
  driver: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
  };
  metrics: {
    onTimeDeliveryRate: number | null;
    onTimePickupRate: number | null;
    avgMargin: number;
    avgPpm: number;
    avgRpm: number;
    totalRevenue: number;
    totalProfit: number;
    totalTrips: number;
    completedTrips: number;
    utilizationRate: number;
  };
  grade: string;
  periodDays: number;
}

interface DriverScorecardProps {
  driverId: string | null;
  driverName?: string;
  driverType?: string;
  className?: string;
}

function GradeBadge({ grade }: { grade: string }) {
  const gradeStyles: Record<string, string> = {
    A: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    B: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    C: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    D: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    F: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-lg border-2 text-xl font-bold",
        gradeStyles[grade] || gradeStyles.C
      )}
    >
      {grade}
    </div>
  );
}

function StarRating({ grade }: { grade: string }) {
  const starCount: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    F: 1,
  };
  const count = starCount[grade] || 3;

  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < count ? "text-amber-400 fill-amber-400" : "text-neutral-600"
          )}
        />
      ))}
    </div>
  );
}

function MetricRow({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  highlight?: "good" | "warn" | "bad";
}) {
  const highlightStyles = {
    good: "text-emerald-400",
    warn: "text-amber-400",
    bad: "text-red-400",
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-neutral-500" />
        <span className="text-xs text-neutral-400">{label}</span>
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          highlight ? highlightStyles[highlight] : "text-neutral-200"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function DriverScorecard({
  driverId,
  driverName,
  driverType,
  className,
}: DriverScorecardProps) {
  const [data, setData] = useState<DriverScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScorecard() {
      if (!driverId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/drivers/${driverId}/scorecard?days=90`);
        if (!response.ok) {
          throw new Error("Failed to fetch scorecard");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching driver scorecard:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchScorecard();
  }, [driverId]);

  if (!driverId) {
    return (
      <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Driver Scorecard
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-neutral-500 py-4 text-center">
            No driver assigned
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Driver Scorecard
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
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
            <Award className="h-4 w-4 text-amber-400" />
            Driver Scorecard
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-neutral-500 py-4">
            {driverName || "Driver"} ({driverType || "Unknown"})
            <p className="text-xs text-neutral-600 mt-1">Scorecard data unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { driver, metrics, grade, periodDays } = data;

  const getHighlight = (value: number, goodThreshold: number, badThreshold: number) => {
    if (value >= goodThreshold) return "good" as const;
    if (value < badThreshold) return "bad" as const;
    return "warn" as const;
  };

  return (
    <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-400" />
          Driver Scorecard
        </CardTitle>
        <p className="text-xs text-neutral-500">Last {periodDays} days performance</p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Driver Info & Grade */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <div>
            <p className="text-sm font-medium text-neutral-200">{driver.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-neutral-500">{driver.type}</span>
              <StarRating grade={grade} />
            </div>
          </div>
          <GradeBadge grade={grade} />
        </div>

        {/* Key Metrics */}
        <div className="space-y-0.5">
          <MetricRow
            label="On-Time Delivery"
            value={
              metrics.onTimeDeliveryRate !== null
                ? `${metrics.onTimeDeliveryRate.toFixed(1)}%`
                : "—"
            }
            icon={Clock}
            highlight={
              metrics.onTimeDeliveryRate !== null
                ? getHighlight(metrics.onTimeDeliveryRate, 90, 75)
                : undefined
            }
          />
          <MetricRow
            label="Avg Margin"
            value={`${metrics.avgMargin.toFixed(1)}%`}
            icon={TrendingUp}
            highlight={getHighlight(metrics.avgMargin, 15, 5)}
          />
          <MetricRow
            label="Avg PPM"
            value={`${formatCurrency(metrics.avgPpm)}/mi`}
            icon={DollarSign}
            highlight={getHighlight(metrics.avgPpm, 0.4, 0.15)}
          />
          <MetricRow
            label="Trips Completed"
            value={`${metrics.completedTrips}/${metrics.totalTrips}`}
            icon={Truck}
          />
          {metrics.utilizationRate > 0 && (
            <MetricRow
              label="Avg Utilization"
              value={`${metrics.utilizationRate.toFixed(1)}%`}
              icon={User}
              highlight={getHighlight(metrics.utilizationRate, 75, 50)}
            />
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-3 pt-3 border-t border-neutral-800 grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-xs text-neutral-500">Total Revenue</p>
            <p className="text-sm font-medium text-neutral-200">
              {formatCurrency(metrics.totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Total Profit</p>
            <p
              className={cn(
                "text-sm font-medium",
                metrics.totalProfit >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {formatCurrency(metrics.totalProfit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
