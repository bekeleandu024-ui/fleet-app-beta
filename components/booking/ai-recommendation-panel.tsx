"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AIRecommendation {
  driver: {
    id: string;
    name: string;
    homeBase?: string;
    hoursAvailableToday?: number;
    reason?: string;
  } | null;
  unit: {
    id: string;
    code: string;
    type?: string;
    homeBase?: string;
    reason?: string;
  } | null;
  rate: {
    id: string;
    rate_type: string;
    zone: string;
    total_cpm: number;
    reason?: string;
  } | null;
  estimatedMiles: number;
  estimatedCost: number;
  targetRevenue: number;
  suggestedRPM: number;
  marginPercent?: number;
  marketRate: number | null;
  confidence: string;
}

interface AIAnalysis {
  recommendations: AIRecommendation;
  riskAssessment: {
    onTimeRisk: "LOW" | "MEDIUM" | "HIGH";
    profitabilityRisk: "LOW" | "MEDIUM" | "HIGH";
    riskFactors: string[];
    mitigations: string[];
  };
  routeOptimization: {
    estimatedTransitHours: number;
    recommendedDeparture: string;
    potentialDelays: string[];
    backhaul: string | null;
  };
  marketIntelligence: {
    laneProfitability: "HIGH" | "MEDIUM" | "LOW";
    demandLevel: "HIGH" | "MEDIUM" | "LOW";
    ratePositioning: string;
    insights: string[];
  };
  alternativeOptions: Array<{
    type: string;
    option: string;
    advantage: string;
    tradeoff: string;
  }>;
}

interface OrderSuggestion {
  orderId: string;
  reference: string;
  priority: "URGENT" | "HIGH" | "MEDIUM";
  reason: string;
  urgencyScore: number;
  riskFactors: string[];
}

interface AIRecommendationPanelProps {
  orderId: string | null;
  onApplyRecommendation?: (recommendation: AIRecommendation) => void;
  orders?: any[];
  onSelectOrder?: (orderId: string) => void;
  className?: string;
}

export function AIRecommendationPanel({
  orderId,
  onApplyRecommendation,
  orders = [],
  onSelectOrder,
  className = "",
}: AIRecommendationPanelProps) {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [orderSuggestions, setOrderSuggestions] = useState<{ topOrders: OrderSuggestion[]; summary: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order suggestions when no order is selected
  useEffect(() => {
    if (!orderId && orders.length > 0) {
      const fetchOrderSuggestions = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/trips/order-suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orders }),
          });

          if (!response.ok) throw new Error("Failed to fetch order suggestions");

          const data = await response.json();
          setOrderSuggestions(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load suggestions");
          setOrderSuggestions(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchOrderSuggestions();
    } else {
      setOrderSuggestions(null);
    }
  }, [orderId, orders]);

  // Fetch booking recommendation when order is selected
  useEffect(() => {
    if (!orderId) {
      setAiAnalysis(null);
      return;
    }

    const fetchRecommendation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/trips/ai-recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        if (!response.ok) throw new Error("Failed to fetch recommendations");

        const data = await response.json();
        setAiAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recommendations");
        setAiAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendation();
  }, [orderId]);

  // Show order suggestions when no order is selected
  if (!orderId) {
    if (isLoading) {
      return (
        <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-emerald-400" />
            <p className="text-sm text-neutral-400">Analyzing order priorities...</p>
          </div>
        </Card>
      );
    }

    if (orderSuggestions) {
      return (
        <Card className={`rounded-xl border border-amber-800/50 bg-neutral-900/60 p-4 shadow-lg ${className}`}>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-neutral-200">AI Order Priority</h2>
          </div>

          <p className="text-xs text-neutral-400 mb-4">{orderSuggestions.summary}</p>

          <div className="space-y-3">
            {orderSuggestions.topOrders.map((suggestion, idx) => {
              const priorityColor = 
                suggestion.priority === "URGENT" ? "border-rose-500/50 bg-rose-950/30" :
                suggestion.priority === "HIGH" ? "border-amber-500/50 bg-amber-950/30" :
                "border-blue-500/50 bg-blue-950/30";

              const priorityTextColor =
                suggestion.priority === "URGENT" ? "text-rose-400" :
                suggestion.priority === "HIGH" ? "text-amber-400" :
                "text-blue-400";

              return (
                <div
                  key={suggestion.orderId}
                  onClick={() => onSelectOrder?.(suggestion.orderId)}
                  className={`rounded-lg border ${priorityColor} p-3 cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{suggestion.reference}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${priorityTextColor}`}>
                        #{idx + 1} {suggestion.priority} Priority
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500">Urgency</p>
                      <p className={`text-sm font-bold ${priorityTextColor}`}>{suggestion.urgencyScore}</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 mb-2">{suggestion.reason}</p>

                  {suggestion.riskFactors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {suggestion.riskFactors.map((risk, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800/50 text-neutral-400"
                        >
                          {risk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      );
    }

    return (
      <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-neutral-500">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm">Select an order to see AI recommendations</p>
        </div>
      </Card>
    );
  }

  // When order is selected, show comprehensive AI analysis
  if (orderId) {
    if (isLoading) {
      return (
        <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-emerald-400" />
            <p className="text-sm text-neutral-400">Analyzing optimal booking...</p>
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className={`rounded-xl border border-rose-800/50 bg-neutral-900/60 p-4 ${className}`}>
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      );
    }

    if (!aiAnalysis) return null;

    const { recommendations, riskAssessment, routeOptimization, marketIntelligence, alternativeOptions } = aiAnalysis;
    
    // Calculate 5% margin: revenue = cost + 5%
    const estimatedCost = recommendations.estimatedCost || 0;
    const revenueWith5Percent = estimatedCost * 1.05;
    const marginPct = estimatedCost > 0 ? ((revenueWith5Percent - estimatedCost) / revenueWith5Percent * 100) : 5;
    
    const confidenceColor =
      recommendations.confidence === "high" ? "text-emerald-400" :
      recommendations.confidence === "medium" ? "text-amber-400" : "text-neutral-400";

    const riskColor = {
      LOW: "text-emerald-400",
      MEDIUM: "text-amber-400",
      HIGH: "text-rose-400"
    };

    return (
      <div className={`space-y-3 ${className}`}>
        {/* Main Recommendations Card */}
        <Card className="rounded-xl border border-emerald-800/50 bg-neutral-900/60 p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-neutral-200">AI Recommendations</h2>
            </div>
            <span className={`text-xs font-medium uppercase tracking-wide ${confidenceColor}`}>
              {recommendations.confidence}
            </span>
          </div>

          {/* Driver */}
          {recommendations.driver && (
            <div className="mb-2 rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-2.5">
              <p className="text-[10px] font-medium uppercase text-emerald-400 mb-1">Best Driver</p>
              <p className="text-xs font-semibold text-white">{recommendations.driver.name}</p>
              <p className="text-[9px] text-neutral-400 mt-0.5">{recommendations.driver.reason}</p>
            </div>
          )}

          {/* Unit */}
          {recommendations.unit && (
            <div className="mb-2 rounded-lg border border-amber-800/50 bg-amber-950/30 p-2.5">
              <p className="text-[10px] font-medium uppercase text-amber-400 mb-1">Best Unit</p>
              <p className="text-xs font-semibold text-white">{recommendations.unit.code}</p>
              <p className="text-[9px] text-neutral-400 mt-0.5">{recommendations.unit.reason}</p>
            </div>
          )}

          {/* Financials */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-lg bg-neutral-950/40 p-2">
              <p className="text-[9px] uppercase text-neutral-500">Revenue</p>
              <p className="text-sm font-bold text-emerald-400">${revenueWith5Percent.toFixed(0)}</p>
              <p className="text-[8px] text-neutral-500 mt-0.5">Cost + 5%</p>
            </div>
            <div className="rounded-lg bg-neutral-950/40 p-2">
              <p className="text-[9px] uppercase text-neutral-500">Margin</p>
              <p className="text-sm font-bold text-emerald-400">5.0%</p>
            </div>
          </div>

          {onApplyRecommendation && (
            <Button
              onClick={() => onApplyRecommendation(recommendations)}
              className="w-full rounded-lg bg-emerald-500 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 py-2"
            >
              Apply Recommendations
            </Button>
          )}
        </Card>

        {/* Risk Assessment */}
        <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Risk Assessment
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400">On-Time Risk</span>
              <span className={`text-[10px] font-bold ${riskColor[riskAssessment.onTimeRisk]}`}>
                {riskAssessment.onTimeRisk}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-neutral-400">Profit Risk</span>
              <span className={`text-[10px] font-bold ${riskColor[riskAssessment.profitabilityRisk]}`}>
                {riskAssessment.profitabilityRisk}
              </span>
            </div>
            {riskAssessment.riskFactors.length > 0 && (
              <div className="mt-2 space-y-1">
                {riskAssessment.riskFactors.map((risk, i) => (
                  <p key={i} className="text-[9px] text-rose-400">• {risk}</p>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Route Optimization */}
        <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Route Optimization
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] text-neutral-400">Transit Time</span>
              <span className="text-[10px] font-semibold text-white">{routeOptimization.estimatedTransitHours}h</span>
            </div>
            <p className="text-[9px] text-neutral-400">{routeOptimization.recommendedDeparture}</p>
            {routeOptimization.backhaul && (
              <p className="text-[9px] text-emerald-400 mt-2">💡 {routeOptimization.backhaul}</p>
            )}
          </div>
        </Card>

        {/* Market Intelligence */}
        <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
          <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Market Intel
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] text-neutral-400">Lane Profit</span>
              <span className="text-[10px] font-bold text-emerald-400">{marketIntelligence.laneProfitability}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-neutral-400">Demand</span>
              <span className="text-[10px] font-bold text-amber-400">{marketIntelligence.demandLevel}</span>
            </div>
            <p className="text-[9px] text-blue-400 mt-1">Rate is {marketIntelligence.ratePositioning}</p>
            {marketIntelligence.insights.map((insight, i) => (
              <p key={i} className="text-[9px] text-neutral-400 mt-1">• {insight}</p>
            ))}
          </div>
        </Card>

        {/* Alternatives */}
        {alternativeOptions.length > 0 && (
          <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <h3 className="text-xs font-semibold text-white mb-2">Alternatives</h3>
            <div className="space-y-2">
              {alternativeOptions.slice(0, 2).map((alt, i) => (
                <div key={i} className="rounded bg-neutral-950/40 p-2">
                  <p className="text-[10px] font-semibold text-white">{alt.option}</p>
                  <p className="text-[9px] text-emerald-400">+ {alt.advantage}</p>
                  <p className="text-[9px] text-rose-400">- {alt.tradeoff}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }
}
