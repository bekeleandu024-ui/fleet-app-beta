"use client";

import { Check, DollarSign, Wrench, Fuel, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RateCard {
  id: string;
  rate_type: string;
  zone: string;
  fixed_cpm: number;
  wage_cpm: number;
  addons_cpm: number;
  fuel_cpm: number;
  truck_maint_cpm: number;
  trailer_maint_cpm: number;
  rolling_cpm: number;
  total_cpm: number;
}

interface RateSelectorProps {
  rates: RateCard[];
  selectedRateId: string;
  recommendedRateId?: string | null;
  onRateSelect: (rateId: string) => void;
  className?: string;
}

export function RateSelector({
  rates,
  selectedRateId,
  recommendedRateId,
  onRateSelect,
  className = "",
}: RateSelectorProps) {
  return (
    <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Select Rate Card</h3>
      </div>

      <div className="space-y-2">
        {rates.map((rate) => {
          const isRecommended = rate.id === recommendedRateId;
          const isSelected = rate.id === selectedRateId;

          // Safe conversion of rate values with defaults
          const safeRate = {
            total_cpm: Number(rate.total_cpm) || 0,
            fixed_cpm: Number(rate.fixed_cpm) || 0,
            wage_cpm: Number(rate.wage_cpm) || 0,
            fuel_cpm: Number(rate.fuel_cpm) || 0,
            truck_maint_cpm: Number(rate.truck_maint_cpm) || 0,
            trailer_maint_cpm: Number(rate.trailer_maint_cpm) || 0,
            rolling_cpm: Number(rate.rolling_cpm) || 0,
            addons_cpm: Number(rate.addons_cpm) || 0,
          };

          return (
            <button
              key={rate.id}
              type="button"
              onClick={() => onRateSelect(rate.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-purple-500 bg-purple-950/30"
                  : isRecommended
                  ? "border-purple-800/50 bg-purple-950/20 hover:bg-purple-950/30"
                  : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {rate.rate_type} - {rate.zone}
                  </p>
                  <p className="mt-1 text-lg font-bold text-purple-300">${safeRate.total_cpm.toFixed(2)} CPM</p>
                </div>
                {isSelected && <Check className="h-5 w-5 text-purple-400" />}
                {isRecommended && !isSelected && (
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-purple-400">
                    Recommended
                  </span>
                )}
              </div>

              {/* CPM Breakdown */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-white/10 pt-2 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Fixed</span>
                  <span className="font-medium text-neutral-300">${safeRate.fixed_cpm.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Wage
                  </span>
                  <span className="font-medium text-neutral-300">${safeRate.wage_cpm.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    Fuel
                  </span>
                  <span className="font-medium text-neutral-300">${safeRate.fuel_cpm.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Truck Maint
                  </span>
                  <span className="font-medium text-neutral-300">${safeRate.truck_maint_cpm.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    Trailer Maint
                  </span>
                  <span className="font-medium text-neutral-300">${safeRate.trailer_maint_cpm.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Rolling</span>
                  <span className="font-medium text-neutral-300">${safeRate.rolling_cpm.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Add-ons</span>
                  <span className="font-medium text-neutral-300">${safeRate.addons_cpm.toFixed(2)}</span>
                </div>
              </div>
            </button>
          );
        })}

        {rates.length === 0 && (
          <div className="py-8 text-center text-sm text-neutral-500">No rate cards available</div>
        )}
      </div>
    </Card>
  );
}

