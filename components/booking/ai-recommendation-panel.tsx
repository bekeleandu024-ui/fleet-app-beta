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
  } | null;
  unit: {
    id: string;
    code: string;
    type?: string;
    homeBase?: string;
  } | null;
  rate: {
    id: string;
    rate_type: string;
    zone: string;
    total_cpm: number;
  } | null;
  estimatedMiles: number;
  estimatedCost: number;
  targetRevenue: number;
  suggestedRPM: number;
  marketRate: number | null;
  confidence: string;
}

interface AIRecommendationPanelProps {
  orderId: string | null;
  onApplyRecommendation?: (recommendation: AIRecommendation) => void;
  className?: string;
}

export function AIRecommendationPanel({
  orderId,
  onApplyRecommendation,
  className = "",
}: AIRecommendationPanelProps) {
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setRecommendation(null);
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
        setRecommendation(data.recommendations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recommendations");
        setRecommendation(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendation();
  }, [orderId]);

  if (!orderId) {
    return (
      <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-neutral-500">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm">Select an order to see AI recommendations</p>
        </div>
      </Card>
    );
  }

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

  if (!recommendation) {
    return null;
  }

  const marginPct =
    recommendation.targetRevenue > 0
      ? ((recommendation.targetRevenue - recommendation.estimatedCost) / recommendation.targetRevenue) * 100
      : 0;

  const confidenceColor =
    recommendation.confidence === "high"
      ? "text-emerald-400"
      : recommendation.confidence === "medium"
      ? "text-amber-400"
      : "text-neutral-400";

  const marginColor = marginPct >= 15 ? "text-emerald-400" : marginPct >= 8 ? "text-amber-400" : "text-rose-400";

  return (
    <Card className={`rounded-xl border border-emerald-800/50 bg-neutral-900/60 p-4 shadow-lg shadow-black/40 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-neutral-200">AI Booking Recommendation</h2>
        </div>
        <span className={`text-xs font-medium uppercase tracking-wide ${confidenceColor}`}>
          {recommendation.confidence} confidence
        </span>
      </div>

      {/* Margin Warning */}
      {marginPct < 10 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span className="text-xs font-medium text-rose-200">Margin below target threshold</span>
        </div>
      )}

      {/* Driver Recommendation */}
      {recommendation.driver && (
        <div className="mb-2 rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-3">
          <div className="mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-400">Recommended Driver</p>
          </div>
          <p className="mb-1 text-sm font-semibold text-white">{recommendation.driver.name}</p>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            {recommendation.driver.homeBase && <span>Base: {recommendation.driver.homeBase}</span>}
            {recommendation.driver.hoursAvailableToday && (
              <span>{recommendation.driver.hoursAvailableToday}h available</span>
            )}
          </div>
        </div>
      )}

      {/* Unit Recommendation */}
      {recommendation.unit && (
        <div className="mb-2 rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
          <div className="mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-amber-400" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-400">Recommended Unit</p>
          </div>
          <p className="mb-1 text-sm font-semibold text-white">{recommendation.unit.code}</p>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            {recommendation.unit.type && <span>{recommendation.unit.type}</span>}
            {recommendation.unit.homeBase && <span>Base: {recommendation.unit.homeBase}</span>}
          </div>
        </div>
      )}

      {/* Rate & Financial Projection */}
      {recommendation.rate && (
        <div className="mb-3 rounded-lg border border-purple-800/50 bg-purple-950/30 p-3">
          <div className="mb-1 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-purple-400" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-purple-400">Recommended Rate</p>
          </div>
          <p className="mb-1 text-sm font-semibold text-white">
            {recommendation.rate.rate_type} - {recommendation.rate.zone}
          </p>
          <p className="text-xs text-neutral-400">${recommendation.rate.total_cpm.toFixed(2)} CPM</p>
        </div>
      )}

      {/* Financial Summary */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Estimated Miles</p>
          <p className="mt-1 text-base font-semibold text-white">{recommendation.estimatedMiles.toFixed(0)}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Suggested RPM</p>
          <p className="mt-1 text-base font-semibold text-white">${recommendation.suggestedRPM.toFixed(2)}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Target Revenue</p>
          <p className="mt-1 text-base font-semibold text-white">${recommendation.targetRevenue.toFixed(2)}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Target Margin</p>
          <p className={`mt-1 text-base font-semibold ${marginColor}`}>{marginPct.toFixed(1)}%</p>
        </div>
      </div>

      {/* Market Comparison */}
      {recommendation.marketRate && (
        <div className="mb-3 rounded-lg border border-blue-800/50 bg-blue-950/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-blue-400">Market RPM</p>
              <p className="text-sm font-semibold text-white">${recommendation.marketRate.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {recommendation.suggestedRPM > recommendation.marketRate ? (
                <>
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">
                    +{((recommendation.suggestedRPM / recommendation.marketRate - 1) * 100).toFixed(0)}% above market
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 rotate-180 text-rose-400" />
                  <span className="text-rose-400">
                    {((recommendation.suggestedRPM / recommendation.marketRate - 1) * 100).toFixed(0)}% below market
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      {onApplyRecommendation && (
        <Button
          onClick={() => onApplyRecommendation(recommendation)}
          className="w-full rounded-lg bg-emerald-500 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
        >
          Apply AI Recommendation
        </Button>
      )}
    </Card>
  );
}
