"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  CloudRain,
  Truck,
  MapPin,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bell,
  Send
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ETAFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  details: string;
}

interface TripAlert {
  type: "delay" | "weather" | "hos" | "border" | "traffic" | "exception";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  recommendedAction?: string;
}

interface TripETAPrediction {
  tripId: string;
  predictedArrival: string;
  confidenceLevel: "high" | "medium" | "low";
  onTimeStatus: "on_time" | "at_risk" | "delayed";
  delayMinutes: number;
  factors: ETAFactor[];
  alerts: TripAlert[];
  suggestedActions: string[];
}

interface TripETAProps {
  tripId: string;
  currentLocation?: { lat: number; lng: number };
  onNotifyCustomer?: () => void;
}

export function TripETAPrediction({ tripId, currentLocation, onNotifyCustomer }: TripETAProps) {
  const [prediction, setPrediction] = useState<TripETAPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFactors, setShowFactors] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrediction = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/trip-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, currentLocation })
      });

      if (!response.ok) throw new Error("Failed to predict ETA");

      const data = await response.json();
      setPrediction(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to predict ETA");
    } finally {
      setIsLoading(false);
    }
  }, [tripId, currentLocation]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrediction]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_time": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "at_risk": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "delayed": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on_time": return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case "at_risk": return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "delayed": return <AlertCircle className="h-5 w-5 text-rose-400" />;
      default: return <Clock className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "weather": return <CloudRain className="h-4 w-4" />;
      case "hos": return <Clock className="h-4 w-4" />;
      case "border": return <MapPin className="h-4 w-4" />;
      case "traffic": return <Truck className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-rose-500/10 border-rose-500/30 text-rose-300";
      case "warning": return "bg-amber-500/10 border-amber-500/30 text-amber-300";
      default: return "bg-blue-500/10 border-blue-500/30 text-blue-300";
    }
  };

  if (isLoading && !prediction) {
    return (
      <Card className="p-4 bg-blue-950/20 border-blue-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-200">Predicting ETA</p>
            <p className="text-xs text-zinc-400">Analyzing traffic, weather, and route conditions...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !prediction) {
    return (
      <Card className="p-4 bg-rose-950/20 border-rose-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
          <Button 
            variant="subtle" 
            size="sm" 
            onClick={fetchPrediction}
            className="text-rose-400 hover:text-rose-300"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (!prediction) return null;

  const formattedETA = new Date(prediction.predictedArrival).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="space-y-4">
      {/* Main ETA Card */}
      <Card className={cn(
        "overflow-hidden border",
        getStatusColor(prediction.onTimeStatus)
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">AI ETA Prediction</p>
            </div>
            <Badge className={getStatusColor(prediction.onTimeStatus)}>
              {prediction.onTimeStatus.replace("_", " ").toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                prediction.onTimeStatus === "on_time" && "bg-emerald-500/20",
                prediction.onTimeStatus === "at_risk" && "bg-amber-500/20",
                prediction.onTimeStatus === "delayed" && "bg-rose-500/20"
              )}>
                {getStatusIcon(prediction.onTimeStatus)}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formattedETA}</p>
                <p className="text-xs text-zinc-400">
                  {prediction.confidenceLevel} confidence
                </p>
              </div>
            </div>

            {prediction.delayMinutes > 0 && (
              <div className="text-right">
                <p className={cn(
                  "text-xl font-bold",
                  prediction.onTimeStatus === "delayed" ? "text-rose-400" : "text-amber-400"
                )}>
                  +{prediction.delayMinutes} min
                </p>
                <p className="text-xs text-zinc-500">delay expected</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="subtle"
              onClick={fetchPrediction}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Refresh
            </Button>
            {prediction.onTimeStatus !== "on_time" && onNotifyCustomer && (
              <Button
                size="sm"
                onClick={onNotifyCustomer}
                className="flex-1 bg-blue-600 hover:bg-blue-500"
              >
                <Send className="h-4 w-4 mr-1" />
                Notify Customer
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {prediction.alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider px-1">Active Alerts</p>
          {prediction.alerts.map((alert, i) => (
            <Card key={i} className={cn("p-3 border", getAlertColor(alert.severity))}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  alert.severity === "critical" && "bg-rose-500/20",
                  alert.severity === "warning" && "bg-amber-500/20",
                  alert.severity === "info" && "bg-blue-500/20"
                )}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{alert.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{alert.message}</p>
                  {alert.recommendedAction && (
                    <p className="text-xs text-blue-400 mt-2">
                      💡 {alert.recommendedAction}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Suggested Actions */}
      {prediction.suggestedActions.length > 0 && (
        <Card className="p-3 bg-zinc-900/50 border-zinc-800">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Suggested Actions</p>
          <div className="space-y-1.5">
            {prediction.suggestedActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-emerald-400">→</span>
                <span className="text-zinc-300">{action}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Factors (Expandable) */}
      {prediction.factors.length > 0 && (
        <Card className="overflow-hidden border-zinc-800">
          <button
            className="w-full p-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
            onClick={() => setShowFactors(!showFactors)}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-200">ETA Factors ({prediction.factors.length})</p>
            </div>
            {showFactors ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>
          
          {showFactors && (
            <div className="border-t border-zinc-800 divide-y divide-zinc-800">
              {prediction.factors.map((factor, i) => (
                <div key={i} className="p-3 flex items-start gap-3">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                    factor.impact === "positive" && "bg-emerald-400",
                    factor.impact === "negative" && "bg-rose-400",
                    factor.impact === "neutral" && "bg-zinc-400"
                  )} />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{factor.factor}</p>
                    <p className="text-xs text-zinc-500">{factor.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-[10px] text-zinc-600 text-center">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Fleet-Wide Trip Monitor Component
// ============================================================================

interface FleetTripMonitorProps {
  onTripClick?: (tripId: string) => void;
}

export function FleetTripMonitor({ onTripClick }: FleetTripMonitorProps) {
  const [data, setData] = useState<{
    totalActiveTrips: number;
    atRiskTrips: any[];
    summary: string;
    urgentAlerts: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/trip-eta");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch fleet trip data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60 * 1000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading && !data) {
    return (
      <Card className="p-4 bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          <p className="text-sm text-zinc-400">Scanning active trips...</p>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const hasRisks = data.atRiskTrips.length > 0;

  return (
    <Card className={cn(
      "overflow-hidden border",
      hasRisks ? "border-amber-500/30 bg-amber-950/10" : "border-emerald-500/30 bg-emerald-950/10"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className={cn("h-4 w-4", hasRisks ? "text-amber-400" : "text-emerald-400")} />
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Fleet Trip Monitor</p>
          </div>
          <Button
            size="sm"
            variant="subtle"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-black/20">
            <p className="text-2xl font-bold text-white">{data.totalActiveTrips}</p>
            <p className="text-xs text-zinc-500">Active</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-black/20">
            <p className={cn(
              "text-2xl font-bold",
              data.atRiskTrips.length > 0 ? "text-amber-400" : "text-emerald-400"
            )}>
              {data.atRiskTrips.length}
            </p>
            <p className="text-xs text-zinc-500">At Risk</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-black/20">
            <p className="text-2xl font-bold text-emerald-400">
              {data.totalActiveTrips - data.atRiskTrips.length}
            </p>
            <p className="text-xs text-zinc-500">On Time</p>
          </div>
        </div>

        <p className="text-sm text-zinc-300">{data.summary}</p>

        {data.atRiskTrips.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Trips Needing Attention</p>
            {data.atRiskTrips.slice(0, 5).map((trip: any, i: number) => (
              <div 
                key={i}
                className="p-2 rounded-lg bg-black/30 hover:bg-black/50 cursor-pointer transition-colors"
                onClick={() => onTripClick?.(trip.tripId)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{trip.tripNumber}</p>
                  <Badge className={cn(
                    trip.onTimeStatus === "delayed" 
                      ? "bg-rose-500/20 text-rose-400" 
                      : "bg-amber-500/20 text-amber-400"
                  )}>
                    {trip.delayMinutes ? `+${trip.delayMinutes}m` : trip.onTimeStatus}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{trip.primaryRisk}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
