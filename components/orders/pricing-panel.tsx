"use client";

import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { Calculator, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EnterpriseOrderInput } from "@/lib/schemas/enterprise-order";

interface PricingPanelProps {
  register: UseFormRegister<EnterpriseOrderInput>;
  watch: UseFormWatch<EnterpriseOrderInput>;
  setValue: UseFormSetValue<EnterpriseOrderInput>;
  suggestedRate: {
    rate: number;
    rpm: number;
    miles: number;
    costPerMile?: number;
    targetMargin?: number;
  } | null;
  isFetchingRate: boolean;
  onFetchRate: () => void;
  onAcceptRate: () => void;
  className?: string;
}

export function PricingPanel({
  register,
  watch,
  setValue,
  suggestedRate,
  isFetchingRate,
  onFetchRate,
  onAcceptRate,
  className = "",
}: PricingPanelProps) {
  const totalMiles = watch("totalMiles") || 0;
  const ratePerMile = watch("ratePerMile") || 0;
  const quotedRate = watch("quotedRate") || 0;
  const targetMargin = watch("targetMarginPct") || 15;

  return (
    <div className={`rounded-lg border border-zinc-800 bg-zinc-900/30 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200">Pricing</h3>
        <span className="text-[10px] text-zinc-500">Auto-calculated</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Miles & Rate/Mile Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Miles</label>
            <div className="flex gap-1.5">
              <Input
                type="number"
                {...register("totalMiles", { valueAsNumber: true })}
                placeholder="500"
                className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-200"
              />
              <Button
                type="button"
                size="sm"
                variant="subtle"
                onClick={onFetchRate}
                disabled={isFetchingRate}
                className="h-9 px-2 text-zinc-400 hover:text-white flex-none"
                title="Calculate from route"
              >
                <Calculator className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Rate/Mile</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500">$</span>
              <Input
                type="number"
                step="0.01"
                {...register("ratePerMile", { valueAsNumber: true })}
                placeholder="2.18"
                className="h-9 text-sm bg-black/30 border-zinc-800 text-zinc-200 pl-5"
              />
            </div>
          </div>
        </div>

        {/* Quoted Rate - Highlighted */}
        <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-blue-400 font-medium">Quoted Rate</label>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <TrendingUp className="w-3 h-3" />
              <span>{targetMargin}% target margin</span>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
            <Input
              type="number"
              step="0.01"
              {...register("quotedRate", { valueAsNumber: true })}
              placeholder="1,250.00"
              className="h-11 text-lg font-semibold bg-black/30 border-zinc-800 text-white pl-7"
            />
          </div>
          
          {/* Formula display */}
          {totalMiles > 0 && ratePerMile > 0 && (
            <div className="mt-2 text-center text-xs text-zinc-500">
              <span className="font-mono">{totalMiles} mi</span>
              <span className="mx-1.5">×</span>
              <span className="font-mono">${ratePerMile.toFixed(2)}</span>
              <span className="mx-1.5">=</span>
              <span className="font-mono text-zinc-300">${(totalMiles * ratePerMile).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Suggested Rate Card */}
        {suggestedRate && (
          <div className="p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-emerald-400 font-medium mb-0.5">
                  AI Suggested @ {suggestedRate.targetMargin || targetMargin}%
                </div>
                <div className="text-sm font-semibold text-emerald-300">
                  ${suggestedRate.rate.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {suggestedRate.miles} mi × ${suggestedRate.rpm.toFixed(2)}/mi
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="subtle"
                onClick={onAcceptRate}
                className="h-7 px-2 text-xs border border-emerald-600 text-emerald-400 hover:bg-emerald-500/10"
              >
                Accept
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isFetchingRate && (
          <div className="text-center text-xs text-zinc-500 py-2">
            <span className="animate-pulse">Calculating rate...</span>
          </div>
        )}
      </div>
    </div>
  );
}
