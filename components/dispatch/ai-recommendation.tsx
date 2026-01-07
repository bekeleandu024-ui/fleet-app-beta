"use client";

import { useState, useCallback } from "react";
import { 
  Sparkles, 
  User, 
  Truck, 
  MapPin, 
  Clock, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Scale,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DriverRecommendation {
  driverId: string;
  driverName: string;
  driverType: "COM" | "OO" | "RNR";
  unit?: string;
  fitScore: number;
  deadheadMiles: number;
  estimatedCost: number;
  costPerMile: number;
  hosRemaining?: number;
  borderEligible: boolean;
  laneExperience: number;
  reasoning: string;
  pros: string[];
  cons: string[];
}

interface WhatIfScenario {
  driverId: string;
  driverName: string;
  totalCost: number;
  deadheadMiles: number;
  profitMargin: number;
  arrivalTime: string;
  risks: string[];
}

interface ConflictWarning {
  type: "HOS_VIOLATION" | "DOUBLE_BOOKING" | "MAINTENANCE" | "BORDER_INELIGIBLE";
  severity: "critical" | "warning" | "info";
  message: string;
  driverId?: string;
}

interface DispatchRecommendation {
  orderId: string;
  topRecommendation: DriverRecommendation;
  alternatives: DriverRecommendation[];
  whatIfScenarios: WhatIfScenario[];
  conflicts: ConflictWarning[];
  summary: string;
}

interface DispatchAIRecommendationProps {
  orderId: string;
  orderDetails?: {
    origin: string;
    destination: string;
    pickupDate: string;
    revenue?: number;
  };
  onSelectDriver?: (driverId: string, unitId?: string) => void;
}

export function DispatchAIRecommendation({
  orderId,
  orderDetails,
  onSelectDriver
}: DispatchAIRecommendationProps) {
  const [recommendation, setRecommendation] = useState<DispatchRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/dispatch-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) throw new Error("Failed to get recommendations");

      const data = await response.json();
      setRecommendation(data);
    } catch (err: any) {
      setError(err.message || "Failed to get dispatch recommendations");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "COM": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "OO": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "RNR": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  if (!recommendation && !isLoading && !error) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-950/30 to-purple-950/30 border-blue-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Dispatch Recommendation</p>
              <p className="text-xs text-zinc-400">Get optimal driver and unit suggestions</p>
            </div>
          </div>
          <Button
            onClick={fetchRecommendations}
            className="bg-blue-600 hover:bg-blue-500 text-white"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-1" />
            Analyze
          </Button>
        </div>
        {orderDetails && (
          <div className="mt-3 pt-3 border-t border-zinc-800/50 text-xs text-zinc-500">
            {orderDetails.origin} → {orderDetails.destination}
          </div>
        )}
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4 bg-blue-950/20 border-blue-800/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-200">Analyzing Dispatch Options</p>
            <p className="text-xs text-zinc-400">Scoring drivers by proximity, HOS, cost, and experience...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
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
            onClick={fetchRecommendations}
            className="text-rose-400 hover:text-rose-300"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!recommendation) return null;

  const { topRecommendation, alternatives, whatIfScenarios, conflicts, summary } = recommendation;

  return (
    <div className="space-y-4">
      {/* Conflicts/Warnings */}
      {conflicts.length > 0 && (
        <Card className="p-3 bg-rose-950/20 border-rose-800/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <p className="text-xs font-medium text-rose-200 uppercase tracking-wider">Conflicts Detected</p>
          </div>
          <div className="space-y-1.5">
            {conflicts.map((conflict, i) => (
              <div key={i} className={cn(
                "text-xs px-2 py-1 rounded",
                conflict.severity === "critical" && "bg-rose-500/10 text-rose-300",
                conflict.severity === "warning" && "bg-amber-500/10 text-amber-300",
                conflict.severity === "info" && "bg-blue-500/10 text-blue-300"
              )}>
                {conflict.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Recommendation */}
      <Card className="overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-zinc-950">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Top Recommendation</p>
            </div>
            <Badge className={getTypeColor(topRecommendation.driverType)}>
              {topRecommendation.driverType}
            </Badge>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
                <User className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{topRecommendation.driverName}</p>
                {topRecommendation.unit && (
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {topRecommendation.unit}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={cn("text-2xl font-bold", getScoreColor(topRecommendation.fitScore))}>
                {topRecommendation.fitScore}
              </p>
              <p className="text-xs text-zinc-500">Fit Score</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="text-center p-2 rounded-lg bg-black/30">
              <MapPin className="h-4 w-4 text-zinc-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-zinc-200">{topRecommendation.deadheadMiles} mi</p>
              <p className="text-[10px] text-zinc-500">Deadhead</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/30">
              <DollarSign className="h-4 w-4 text-zinc-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-zinc-200">${topRecommendation.estimatedCost.toFixed(0)}</p>
              <p className="text-[10px] text-zinc-500">Est. Cost</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/30">
              <Clock className="h-4 w-4 text-zinc-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-zinc-200">{topRecommendation.hosRemaining || "N/A"}h</p>
              <p className="text-[10px] text-zinc-500">HOS Left</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-black/30">
              <Scale className="h-4 w-4 text-zinc-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-zinc-200">${topRecommendation.costPerMile.toFixed(2)}</p>
              <p className="text-[10px] text-zinc-500">Per Mile</p>
            </div>
          </div>

          <p className="text-sm text-zinc-300 mt-4 leading-relaxed">{topRecommendation.reasoning}</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-1">Pros</p>
              <div className="space-y-1">
                {topRecommendation.pros.slice(0, 3).map((pro, i) => (
                  <p key={i} className="text-xs text-zinc-400">• {pro}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-medium text-rose-400 uppercase tracking-wider mb-1">Cons</p>
              <div className="space-y-1">
                {topRecommendation.cons.slice(0, 3).map((con, i) => (
                  <p key={i} className="text-xs text-zinc-400">• {con}</p>
                ))}
              </div>
            </div>
          </div>

          {onSelectDriver && (
            <Button
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500"
              onClick={() => onSelectDriver(topRecommendation.driverId, topRecommendation.unit)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Assign {topRecommendation.driverName}
            </Button>
          )}
        </div>
      </Card>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <Card className="overflow-hidden border-zinc-800">
          <button
            className="w-full p-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
            onClick={() => setShowAlternatives(!showAlternatives)}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-200">Alternative Drivers ({alternatives.length})</p>
            </div>
            {showAlternatives ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>
          
          {showAlternatives && (
            <div className="border-t border-zinc-800 divide-y divide-zinc-800">
              {alternatives.map((driver, i) => (
                <div key={i} className="p-3 hover:bg-zinc-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                        <User className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{driver.driverName}</p>
                        <p className="text-xs text-zinc-500">
                          {driver.deadheadMiles} mi deadhead • ${driver.estimatedCost.toFixed(0)} est.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getTypeColor(driver.driverType)}>{driver.driverType}</Badge>
                      <span className={cn("font-semibold", getScoreColor(driver.fitScore))}>{driver.fitScore}</span>
                      {onSelectDriver && (
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() => onSelectDriver(driver.driverId, driver.unit)}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* What-If Scenarios */}
      {whatIfScenarios.length > 0 && (
        <Card className="overflow-hidden border-zinc-800">
          <button
            className="w-full p-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
            onClick={() => setShowWhatIf(!showWhatIf)}
          >
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-400" />
              <p className="text-sm font-medium text-zinc-200">Cost Comparison</p>
            </div>
            {showWhatIf ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>
          
          {showWhatIf && (
            <div className="border-t border-zinc-800 p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-500">
                      <th className="text-left py-2">Driver</th>
                      <th className="text-right py-2">Total Cost</th>
                      <th className="text-right py-2">Deadhead</th>
                      <th className="text-right py-2">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {whatIfScenarios.map((scenario, i) => (
                      <tr key={i} className="text-zinc-300">
                        <td className="py-2">{scenario.driverName}</td>
                        <td className="text-right py-2">${scenario.totalCost.toFixed(0)}</td>
                        <td className="text-right py-2">{scenario.deadheadMiles} mi</td>
                        <td className={cn(
                          "text-right py-2 font-medium",
                          scenario.profitMargin >= 18 ? "text-emerald-400" : 
                          scenario.profitMargin >= 10 ? "text-amber-400" : "text-rose-400"
                        )}>
                          {scenario.profitMargin.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Summary */}
      <div className="text-xs text-zinc-500 px-2">
        <Sparkles className="h-3 w-3 inline mr-1" />
        {summary}
      </div>

      <Button
        variant="subtle"
        size="sm"
        onClick={fetchRecommendations}
        className="w-full text-zinc-400"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Refresh Recommendations
      </Button>
    </div>
  );
}
