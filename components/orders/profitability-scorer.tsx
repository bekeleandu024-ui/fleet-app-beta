"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Loader2,
  Info,
  Lightbulb,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfitabilityScore {
  score: number;
  status: "profitable" | "marginal" | "unprofitable";
  estimatedMiles: number;
  estimatedCost: number;
  minimumRate: number;
  recommendedRate: number;
  margin: number;
  marginHealth: "red" | "yellow" | "green";
  breakdown: {
    linehaul: number;
    fuel: number;
    border: number;
    accessorials: number;
    overhead: number;
  };
  warnings: string[];
  suggestions: string[];
}

interface RateSuggestion {
  suggestedRate: number;
  marketRate: number;
  historicalAverage: number;
  acceptanceProbability: number;
  marginAtSuggestedRate: number;
  customerNotes: string[];
  negotiationTips: string[];
}

interface ProfitabilityScorerProps {
  origin?: string;
  destination?: string;
  customerRate?: number;
  customerId?: string;
  customerName?: string;
  commodity?: string;
  equipmentType?: string;
  accessorials?: string[];
  onRateSuggestion?: (rate: number) => void;
}

export function ProfitabilityScorer({
  origin,
  destination,
  customerRate,
  customerId,
  customerName,
  commodity,
  equipmentType,
  accessorials,
  onRateSuggestion
}: ProfitabilityScorerProps) {
  const [profitability, setProfitability] = useState<ProfitabilityScore | null>(null);
  const [rateSuggestion, setRateSuggestion] = useState<RateSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const canCalculate = origin && destination && origin.length > 2 && destination.length > 2;

  const calculateProfitability = useCallback(async () => {
    if (!canCalculate) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/profitability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          customerRate,
          customerId,
          customerName,
          commodity,
          equipmentType,
          accessorials
        })
      });

      if (!response.ok) throw new Error("Failed to calculate profitability");

      const data = await response.json();
      setProfitability(data.profitability);
      setRateSuggestion(data.rateSuggestion);
    } catch (err: any) {
      setError(err.message || "Failed to calculate profitability");
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, customerRate, customerId, customerName, commodity, equipmentType, accessorials, canCalculate]);

  // Auto-calculate when lane changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (canCalculate) {
        calculateProfitability();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [origin, destination, calculateProfitability, canCalculate]);

  if (!canCalculate) {
    return (
      <Card className="p-4 bg-zinc-900/30 border-zinc-800">
        <div className="flex items-center gap-3 text-zinc-500">
          <Sparkles className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">AI Profitability Analysis</p>
            <p className="text-xs">Enter pickup and delivery locations to see instant margin analysis</p>
          </div>
        </div>
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
            <p className="text-sm font-medium text-blue-200">Analyzing Profitability</p>
            <p className="text-xs text-zinc-400">Calculating costs and margins for this lane...</p>
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
            onClick={calculateProfitability}
            className="text-rose-400 hover:text-rose-300"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!profitability) return null;

  const getHealthColor = (health: string) => {
    switch (health) {
      case "green": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "yellow": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "red": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default: return "text-zinc-400 bg-zinc-500/10 border-zinc-500/30";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "green": return <CheckCircle className="h-5 w-5" />;
      case "yellow": return <AlertTriangle className="h-5 w-5" />;
      case "red": return <TrendingDown className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden border transition-all",
      getHealthColor(profitability.marginHealth)
    )}>
      {/* Main Summary */}
      <div 
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              profitability.marginHealth === "green" && "bg-emerald-500/20",
              profitability.marginHealth === "yellow" && "bg-amber-500/20",
              profitability.marginHealth === "red" && "bg-rose-500/20"
            )}>
              {getHealthIcon(profitability.marginHealth)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  {profitability.marginHealth === "green" && "Profitable Lane"}
                  {profitability.marginHealth === "yellow" && "Marginal Profitability"}
                  {profitability.marginHealth === "red" && "Below Margin Target"}
                </p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {profitability.score}/100
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                {profitability.estimatedMiles} miles • Est. cost ${profitability.estimatedCost.toFixed(0)}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className={cn(
              "text-lg font-bold",
              profitability.marginHealth === "green" && "text-emerald-400",
              profitability.marginHealth === "yellow" && "text-amber-400",
              profitability.marginHealth === "red" && "text-rose-400"
            )}>
              {profitability.margin.toFixed(1)}% margin
            </p>
            {customerRate && (
              <p className="text-xs text-zinc-500">at ${customerRate.toFixed(0)} rate</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-2 rounded-lg bg-black/20">
            <p className="text-xs text-zinc-500">Min Rate</p>
            <p className="text-sm font-semibold text-zinc-200">${profitability.minimumRate.toFixed(0)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-black/20">
            <p className="text-xs text-zinc-500">Target Rate (18%)</p>
            <p className="text-sm font-semibold text-emerald-400">${profitability.recommendedRate.toFixed(0)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-black/20">
            <p className="text-xs text-zinc-500">Est. Cost</p>
            <p className="text-sm font-semibold text-zinc-200">${profitability.estimatedCost.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/10 p-4 space-y-4 bg-black/20">
          {/* Cost Breakdown */}
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Cost Breakdown</p>
            <div className="space-y-1.5">
              <CostRow label="Linehaul (Driver)" value={profitability.breakdown.linehaul} />
              <CostRow label="Fuel" value={profitability.breakdown.fuel} />
              {profitability.breakdown.border > 0 && (
                <CostRow label="Border Crossing" value={profitability.breakdown.border} />
              )}
              {profitability.breakdown.accessorials > 0 && (
                <CostRow label="Accessorials" value={profitability.breakdown.accessorials} />
              )}
              <CostRow label="Overhead (5%)" value={profitability.breakdown.overhead} />
              <div className="flex justify-between pt-1.5 border-t border-zinc-800">
                <span className="text-sm font-medium text-white">Total Cost</span>
                <span className="text-sm font-bold text-white">${profitability.estimatedCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {profitability.warnings.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Warnings</p>
              <div className="space-y-1.5">
                {profitability.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {profitability.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Suggestions</p>
              <div className="space-y-1.5">
                {profitability.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Lightbulb className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate Suggestion (if customer provided) */}
          {rateSuggestion && (
            <div className="pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Smart Rate Suggestion</p>
                <Badge variant="secondary" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-400">
                  {rateSuggestion.acceptanceProbability}% acceptance
                </Badge>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-white">${rateSuggestion.suggestedRate.toFixed(0)}</p>
                  <p className="text-xs text-zinc-500">Suggested Rate</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-emerald-400">{rateSuggestion.marginAtSuggestedRate.toFixed(1)}% margin</p>
                  <p className="text-xs text-zinc-500">Market: ${rateSuggestion.marketRate.toFixed(0)}</p>
                </div>
              </div>

              {rateSuggestion.negotiationTips.length > 0 && (
                <div className="text-xs text-zinc-400 space-y-1">
                  {rateSuggestion.negotiationTips.slice(0, 2).map((tip, i) => (
                    <p key={i}>• {tip}</p>
                  ))}
                </div>
              )}

              {onRateSuggestion && (
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => onRateSuggestion(rateSuggestion.suggestedRate)}
                  className="w-full mt-3 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Apply Suggested Rate
                </Button>
              )}
            </div>
          )}

          <Button
            size="sm"
            variant="subtle"
            onClick={calculateProfitability}
            className="w-full text-zinc-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Recalculate
          </Button>
        </div>
      )}
    </Card>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="text-zinc-200">${value.toFixed(2)}</span>
    </div>
  );
}
