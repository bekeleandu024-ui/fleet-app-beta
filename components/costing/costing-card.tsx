"use client";

import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { TripCost, DriverType } from "@/lib/costing";
import { CheckCircle2 } from "lucide-react";

interface CostingCardProps {
  driverType: DriverType;
  label: string;
  distance: number;
  cost: TripCost;
  isRecommended?: boolean;
  isSelected?: boolean;
  insight?: string;
  onSelect?: () => void;
}

export function CostingCard({
  driverType,
  label,
  distance,
  cost,
  isRecommended = false,
  isSelected = false,
  insight,
  onSelect,
}: CostingCardProps) {
  const { mileageCosts, eventCosts, totalCPM, directTripCost } = cost;
  const hasRolling = driverType === 'COM' || driverType === 'RNR';

  return (
    <Card
      className={`p-3 cursor-pointer transition-all hover:border-emerald-500/50 ${
        isSelected 
          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30' 
          : isRecommended 
            ? 'border-emerald-500 bg-emerald-500/5' 
            : 'border-neutral-800/70 bg-neutral-900/60'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-neutral-100">
            {label}
          </h3>
          {isRecommended && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Best
            </div>
          )}
        </div>
        <p className="text-[10px] text-neutral-500 mt-0.5">
          Total: {formatCurrency(directTripCost)}
        </p>
      </div>

      {/* Compact Summary */}
      <div className="flex items-center justify-between text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Wage:</span>
            <span className="text-neutral-200 font-semibold">{formatCurrency(mileageCosts.wage)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Fuel:</span>
            <span className="text-neutral-200 font-semibold">{formatCurrency(mileageCosts.fuel)}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Maint:</span>
            <span className="text-neutral-200 font-semibold">
              {formatCurrency(mileageCosts.truckMaint + mileageCosts.trailerMaint)}
            </span>
          </div>
          {hasRolling && mileageCosts.rolling > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Rolling:</span>
              <span className="text-neutral-200 font-semibold">{formatCurrency(mileageCosts.rolling)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Total CPM - Highlighted */}
      <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-between items-center">
        <span className="text-xs font-medium text-neutral-400">TOTAL CPM</span>
        <span className="text-base font-bold text-neutral-100">
          {formatCurrency(totalCPM)}
        </span>
      </div>

      {/* Insight */}
      {insight && (
        <div className="mt-2 pt-2 border-t border-neutral-800/50">
          <p className="text-[10px] font-medium text-emerald-400 leading-tight">
            {insight}
          </p>
        </div>
      )}
    </Card>
  );
}
