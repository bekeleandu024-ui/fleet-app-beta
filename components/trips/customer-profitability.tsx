"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Loader2,
  Crown,
  Medal,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CustomerProfitabilityData {
  customer: {
    id: string;
    name: string;
  };
  metrics: {
    totalTrips: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgMargin: number;
    avgPpm: number;
    firstTripDate?: string;
    lastTripDate?: string;
  };
  tier: "Platinum" | "Gold" | "Silver" | "Bronze" | "New";
  trend: "up" | "down" | "stable";
}

interface CustomerProfitabilityProps {
  customerId: string | null;
  customerName?: string;
  className?: string;
}

function TierBadge({ tier }: { tier: string }) {
  const tierConfig: Record<string, { icon: React.ElementType; color: string }> = {
    Platinum: { icon: Crown, color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
    Gold: { icon: Medal, color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    Silver: { icon: Award, color: "bg-slate-400/20 text-slate-300 border-slate-400/30" },
    Bronze: { icon: Award, color: "bg-orange-600/20 text-orange-300 border-orange-600/30" },
    New: { icon: Building2, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  };

  const config = tierConfig[tier] || tierConfig.New;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
        config.color
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {tier}
    </span>
  );
}

function TrendIndicator({ trend }: { trend: string }) {
  if (trend === "up") {
    return (
      <div className="flex items-center gap-1 text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="text-xs">Improving</span>
      </div>
    );
  }
  if (trend === "down") {
    return (
      <div className="flex items-center gap-1 text-red-400">
        <TrendingDown className="h-3.5 w-3.5" />
        <span className="text-xs">Declining</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-neutral-400">
      <Minus className="h-3.5 w-3.5" />
      <span className="text-xs">Stable</span>
    </div>
  );
}

export function CustomerProfitability({
  customerId,
  customerName,
  className,
}: CustomerProfitabilityProps) {
  const [data, setData] = useState<CustomerProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfitability() {
      if (!customerId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/customers/${customerId}/profitability`);
        if (!response.ok) {
          throw new Error("Failed to fetch profitability");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching customer profitability:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchProfitability();
  }, [customerId]);

  if (!customerId) {
    return (
      <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            Customer Profitability
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-neutral-500 py-4 text-center">
            No customer associated
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
            <Building2 className="h-4 w-4 text-blue-400" />
            Customer Profitability
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
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
            <Building2 className="h-4 w-4 text-blue-400" />
            Customer Profitability
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-neutral-500 py-4">
            {customerName || "Customer"}
            <p className="text-xs text-neutral-600 mt-1">Profitability data unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { customer, metrics, tier, trend } = data;

  return (
    <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-400" />
          Customer Profitability
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Customer Header */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <div>
            <p className="text-sm font-medium text-neutral-200 truncate max-w-[150px]">
              {customer.name}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {metrics.totalTrips} trips
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <TierBadge tier={tier} />
            <TrendIndicator trend={trend} />
          </div>
        </div>

        {/* Profitability Metrics */}
        <div className="space-y-3">
          {/* Lifetime Profit */}
          <div className="p-3 rounded-lg bg-neutral-800/30">
            <p className="text-xs text-neutral-500 mb-1">Lifetime Profit</p>
            <p
              className={cn(
                "text-lg font-bold",
                metrics.totalProfit >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {formatCurrency(metrics.totalProfit)}
            </p>
          </div>

          {/* Revenue & Margin */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-neutral-800/30 text-center">
              <p className="text-xs text-neutral-500 mb-1">Total Revenue</p>
              <p className="text-sm font-medium text-neutral-200">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-neutral-800/30 text-center">
              <p className="text-xs text-neutral-500 mb-1">Avg Margin</p>
              <p
                className={cn(
                  "text-sm font-medium",
                  metrics.avgMargin >= 15
                    ? "text-emerald-400"
                    : metrics.avgMargin >= 5
                    ? "text-amber-400"
                    : "text-red-400"
                )}
              >
                {metrics.avgMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* PPM */}
          <div className="flex items-center justify-between py-1.5 border-t border-neutral-800">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-xs text-neutral-400">Avg PPM</span>
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                metrics.avgPpm >= 0.3
                  ? "text-emerald-400"
                  : metrics.avgPpm >= 0.1
                  ? "text-amber-400"
                  : "text-red-400"
              )}
            >
              {formatCurrency(metrics.avgPpm)}/mi
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
