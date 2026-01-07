"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Loader2,
  RefreshCw,
  Package,
  Truck,
  Users,
  DollarSign,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FleetAnomaly {
  type: "cost_spike" | "rate_erosion" | "driver_behavior" | "customer_pattern";
  severity: "high" | "medium" | "low";
  title: string;
  details: string;
  affectedItems: string[];
}

interface OrderPriorityRank {
  orderId: string;
  orderNumber: string;
  urgencyScore: number;
  factors: {
    daysUntilPickup: number;
    customerTier: "premium" | "standard" | "new";
    marginOpportunity: "high" | "medium" | "low";
    assignmentStatus: "unassigned" | "assigned" | "at_risk";
  };
  slaRisk: boolean;
  recommendedAction: string;
}

interface FleetHealthData {
  fleetHealth: {
    overallScore: number;
    tripsOnTime: number;
    tripsAtRisk: number;
    tripsDelayed: number;
    totalActiveTrips: number;
    anomalies: FleetAnomaly[];
    insights: string[];
    recommendations: string[];
  };
  priorityOrders: OrderPriorityRank[];
}

interface FleetHealthDashboardProps {
  onOrderClick?: (orderId: string) => void;
  onTripClick?: (tripId: string) => void;
}

export function FleetHealthDashboard({ onOrderClick, onTripClick }: FleetHealthDashboardProps) {
  const [data, setData] = useState<FleetHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/fleet-health");
      if (!response.ok) throw new Error("Failed to fetch fleet health");
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load fleet health");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-emerald-500/20 to-emerald-600/10";
    if (score >= 60) return "from-amber-500/20 to-amber-600/10";
    return "from-rose-500/20 to-rose-600/10";
  };

  const getAnomalySeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  if (isLoading && !data) {
    return (
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          <p className="text-sm text-zinc-400">Analyzing fleet health...</p>
        </div>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="p-6 bg-rose-950/20 border-rose-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
          <Button variant="subtle" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { fleetHealth, priorityOrders } = data;

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className={cn(
        "overflow-hidden border-0 bg-gradient-to-br",
        getScoreBg(fleetHealth.overallScore)
      )}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Activity className={cn("h-6 w-6", getScoreColor(fleetHealth.overallScore))} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Fleet Health</h3>
                <p className="text-xs text-zinc-400">AI-powered real-time analysis</p>
              </div>
            </div>
            <Button variant="subtle" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className={cn("text-5xl font-bold", getScoreColor(fleetHealth.overallScore))}>
                {fleetHealth.overallScore}
              </p>
              <p className="text-sm text-zinc-400 mt-1">Health Score</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <p className="text-xl font-bold text-emerald-400">{fleetHealth.tripsOnTime}</p>
                </div>
                <p className="text-xs text-zinc-500">On Time</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <p className="text-xl font-bold text-amber-400">{fleetHealth.tripsAtRisk}</p>
                </div>
                <p className="text-xs text-zinc-500">At Risk</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                  <p className="text-xl font-bold text-rose-400">{fleetHealth.tripsDelayed}</p>
                </div>
                <p className="text-xs text-zinc-500">Delayed</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Insights */}
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <p className="text-sm font-medium text-white">AI Insights</p>
          </div>
          <div className="space-y-2">
            {fleetHealth.insights.slice(0, 4).map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <p className="text-sm text-zinc-300">{insight}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-sm font-medium text-white">Recommendations</p>
          </div>
          <div className="space-y-2">
            {fleetHealth.recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 text-sm">→</span>
                <p className="text-sm text-zinc-300">{rec}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Anomalies */}
      {fleetHealth.anomalies.length > 0 && (
        <Card className="p-4 bg-zinc-900/50 border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-medium text-white">Detected Anomalies</p>
          </div>
          <div className="space-y-2">
            {fleetHealth.anomalies.map((anomaly, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-3 rounded-lg border",
                  getAnomalySeverityColor(anomaly.severity)
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white">{anomaly.title}</p>
                  <Badge className={getAnomalySeverityColor(anomaly.severity)}>
                    {anomaly.severity}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400">{anomaly.details}</p>
                {anomaly.affectedItems.length > 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Affected: {anomaly.affectedItems.slice(0, 3).join(", ")}
                    {anomaly.affectedItems.length > 3 && ` +${anomaly.affectedItems.length - 3} more`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Priority Orders */}
      {priorityOrders.length > 0 && (
        <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-400" />
                <p className="text-sm font-medium text-white">Priority Orders</p>
              </div>
              <Badge variant="secondary" className="text-purple-400 border-purple-500/30">
                {priorityOrders.length} need attention
              </Badge>
            </div>
          </div>
          <div className="divide-y divide-zinc-800">
            {priorityOrders.slice(0, 5).map((order, i) => (
              <div 
                key={i}
                className="p-3 hover:bg-zinc-800/50 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => onOrderClick?.(order.orderId)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm",
                    order.urgencyScore >= 80 ? "bg-rose-500/20 text-rose-400" :
                    order.urgencyScore >= 60 ? "bg-amber-500/20 text-amber-400" :
                    "bg-blue-500/20 text-blue-400"
                  )}>
                    {order.urgencyScore}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {order.factors.daysUntilPickup}d until PU
                      </Badge>
                      {order.slaRisk && (
                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] px-1.5 py-0">
                          SLA Risk
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-zinc-500 max-w-[200px] truncate">{order.recommendedAction}</p>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
