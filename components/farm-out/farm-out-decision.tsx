"use client";

import { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Truck,
  ExternalLink,
  DollarSign,
  Loader2,
  Star,
  Clock,
  MapPin,
  Building2,
  Check,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FarmOutDecisionProps {
  orderId: string;
  orderNumber: string;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  weight?: number;
  equipment?: string;
  customerRate?: number;
  onClose?: () => void;
  onFarmOut?: (carrierId: string) => void;
  onKeepInHouse?: () => void;
}

interface CarrierOption {
  carrierId: string;
  name: string;
  rating: number;
  onTimePercent: number;
  estimatedRate: number;
  pros: string[];
  cons: string[];
  recommendation: "best" | "good" | "acceptable";
  availability: "confirmed" | "likely" | "check";
}

interface FarmOutAnalysis {
  recommendation: "farm_out" | "keep_fleet" | "either";
  confidence: number;
  reasoning: string[];
  fleetOption: {
    estimatedCost: number;
    profitMargin: number;
    driverAvailability: "available" | "limited" | "none";
    considerations: string[];
  };
  farmOutOption: {
    marketRateLow: number;
    marketRateHigh: number;
    bestCarriers: CarrierOption[];
    considerations: string[];
  };
  keyFactors: Array<{
    factor: string;
    favors: "fleet" | "farm_out" | "neutral";
    weight: "high" | "medium" | "low";
  }>;
}

export function FarmOutDecision({
  orderId,
  orderNumber,
  origin,
  destination,
  pickupDate,
  deliveryDate,
  weight,
  equipment,
  customerRate,
  onClose,
  onFarmOut,
  onKeepInHouse
}: FarmOutDecisionProps) {
  const [analysis, setAnalysis] = useState<FarmOutAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/farm-out-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          orderNumber,
          origin,
          destination,
          pickupDate,
          deliveryDate,
          weight,
          equipment,
          customerRate
        })
      });

      if (!response.ok) throw new Error("Failed to analyze");
      const result = await response.json();
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "farm_out": return "text-blue-400";
      case "keep_fleet": return "text-emerald-400";
      default: return "text-amber-400";
    }
  };

  const getRecommendationBg = (rec: string) => {
    switch (rec) {
      case "farm_out": return "from-blue-500/20 to-blue-600/10";
      case "keep_fleet": return "from-emerald-500/20 to-emerald-600/10";
      default: return "from-amber-500/20 to-amber-600/10";
    }
  };

  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case "farm_out": return "Farm Out";
      case "keep_fleet": return "Keep In-House";
      default: return "Either Option";
    }
  };

  const getCarrierBadge = (rec: CarrierOption["recommendation"]) => {
    switch (rec) {
      case "best": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "good": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  // Initial state - show analysis trigger
  if (!analysis && !isLoading && !error) {
    return (
      <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800">
        <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-purple-500/30">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Farm-Out Decision AI</h3>
                <p className="text-xs text-zinc-400">Compare fleet vs carrier options</p>
              </div>
            </div>
            {onClose && (
              <Button variant="subtle" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-zinc-800/30 rounded-lg">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs">Route</span>
              </div>
              <p className="text-sm text-white">{origin} → {destination}</p>
            </div>
            <div className="p-3 bg-zinc-800/30 rounded-lg">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">Pickup</span>
              </div>
              <p className="text-sm text-white">{new Date(pickupDate).toLocaleDateString()}</p>
            </div>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={fetchAnalysis}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze Options
          </Button>
        </div>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6 bg-zinc-900/50 border-zinc-800">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-purple-400 animate-spin" />
          </div>
          <p className="text-sm text-zinc-400">Analyzing fleet vs farm-out options...</p>
          <p className="text-xs text-zinc-500">Checking driver availability, costs & carriers</p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6 bg-rose-950/20 border-rose-800/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <div>
            <p className="text-sm text-rose-200">{error}</p>
            <Button variant="subtle" size="sm" onClick={fetchAnalysis} className="mt-2">
              Retry Analysis
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <Card className="overflow-hidden bg-zinc-900/50 border-zinc-800">
      {/* Header with Recommendation */}
      <div className={cn(
        "p-4 bg-gradient-to-r",
        getRecommendationBg(analysis.recommendation)
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              {analysis.recommendation === "farm_out" ? (
                <ExternalLink className={cn("h-6 w-6", getRecommendationColor(analysis.recommendation))} />
              ) : analysis.recommendation === "keep_fleet" ? (
                <Truck className={cn("h-6 w-6", getRecommendationColor(analysis.recommendation))} />
              ) : (
                <Sparkles className={cn("h-6 w-6", getRecommendationColor(analysis.recommendation))} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={cn("text-lg font-bold", getRecommendationColor(analysis.recommendation))}>
                  {getRecommendationText(analysis.recommendation)}
                </p>
                <Badge className="bg-white/10 text-white border-0">
                  {analysis.confidence}% confident
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">AI Recommendation for {orderNumber}</p>
            </div>
          </div>
          {onClose && (
            <Button variant="subtle" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Reasoning */}
        <div className="p-3 bg-zinc-800/30 rounded-lg">
          <p className="text-xs text-zinc-400 mb-2">Reasoning</p>
          <ul className="space-y-1">
            {analysis.reasoning.map((reason, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-purple-400">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Key Factors */}
        <div>
          <p className="text-xs text-zinc-400 mb-2">Key Factors</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {analysis.keyFactors.map((factor, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-2 rounded-lg text-center border",
                  factor.favors === "fleet" ? "bg-emerald-500/10 border-emerald-500/20" :
                  factor.favors === "farm_out" ? "bg-blue-500/10 border-blue-500/20" :
                  "bg-zinc-800/50 border-zinc-700"
                )}
              >
                <p className="text-xs text-zinc-400">{factor.factor}</p>
                <p className={cn(
                  "text-sm font-medium",
                  factor.favors === "fleet" ? "text-emerald-400" :
                  factor.favors === "farm_out" ? "text-blue-400" :
                  "text-zinc-400"
                )}>
                  {factor.favors === "fleet" ? "Favors Fleet" :
                   factor.favors === "farm_out" ? "Favors Farm-Out" :
                   "Neutral"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fleet Option */}
          <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold text-white">Keep In-House</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-zinc-400">Est. Cost</span>
                <span className="text-sm font-medium text-white">
                  ${analysis.fleetOption.estimatedCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-400">Profit Margin</span>
                <span className={cn(
                  "text-sm font-medium",
                  analysis.fleetOption.profitMargin >= 18 ? "text-emerald-400" :
                  analysis.fleetOption.profitMargin >= 10 ? "text-amber-400" :
                  "text-rose-400"
                )}>
                  {analysis.fleetOption.profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-400">Driver Availability</span>
                <Badge className={cn(
                  analysis.fleetOption.driverAvailability === "available" ? "bg-emerald-500/20 text-emerald-400" :
                  analysis.fleetOption.driverAvailability === "limited" ? "bg-amber-500/20 text-amber-400" :
                  "bg-rose-500/20 text-rose-400"
                )}>
                  {analysis.fleetOption.driverAvailability}
                </Badge>
              </div>

              <div className="pt-2 border-t border-emerald-500/20">
                <p className="text-xs text-zinc-400 mb-1">Considerations</p>
                <ul className="space-y-1">
                  {analysis.fleetOption.considerations.slice(0, 3).map((c, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1">
                      <span>→</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button 
              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700"
              onClick={onKeepInHouse}
              disabled={analysis.fleetOption.driverAvailability === "none"}
            >
              <Truck className="h-4 w-4 mr-2" />
              Use Fleet
            </Button>
          </div>

          {/* Farm-Out Option */}
          <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="h-5 w-5 text-blue-400" />
              <p className="text-sm font-semibold text-white">Farm Out</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-zinc-400">Market Rate Range</span>
                <span className="text-sm font-medium text-white">
                  ${analysis.farmOutOption.marketRateLow.toLocaleString()} - ${analysis.farmOutOption.marketRateHigh.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-blue-500/20">
                <p className="text-xs text-zinc-400 mb-2">Recommended Carriers</p>
                <div className="space-y-2">
                  {analysis.farmOutOption.bestCarriers.slice(0, 3).map((carrier, i) => (
                    <div 
                      key={i} 
                      className="p-2 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800"
                      onClick={() => onFarmOut?.(carrier.carrierId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm text-white">{carrier.name}</span>
                        </div>
                        <Badge className={getCarrierBadge(carrier.recommendation)}>
                          {carrier.recommendation}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400" />
                          {carrier.rating.toFixed(1)}
                        </span>
                        <span>{carrier.onTimePercent}% on-time</span>
                        <span className="text-emerald-400">${carrier.estimatedRate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-blue-500/20">
                <p className="text-xs text-zinc-400 mb-1">Considerations</p>
                <ul className="space-y-1">
                  {analysis.farmOutOption.considerations.slice(0, 3).map((c, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1">
                      <span>→</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
