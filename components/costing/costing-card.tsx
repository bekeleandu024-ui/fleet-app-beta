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
  onSelect?: () => void;
}

export function CostingCard({
  driverType,
  label,
  distance,
  cost,
  isRecommended = false,
  onSelect,
}: CostingCardProps) {
  const { mileageCosts, eventCosts, totalCPM, directTripCost } = cost;
  const hasRolling = driverType === 'COM' || driverType === 'RNR';

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:border-emerald-500/50 ${
        isRecommended ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-800/70 bg-neutral-900/60'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">
            {label} ({distance}mi)
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {formatCurrency(totalCPM)}/mi • Total: {formatCurrency(directTripCost)}
          </p>
        </div>
        {isRecommended && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Best Value
          </div>
        )}
      </div>

      {/* Cost Breakdown - Two Columns */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        {/* Left Column - Fixed Costs */}
        <div className="space-y-1.5">
          <p className="text-neutral-500 font-medium mb-2">Fixed Costs</p>
          <div className="flex justify-between">
            <span className="text-neutral-400">Events</span>
            <span className="text-neutral-200 font-medium">
              {formatCurrency(eventCosts.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Fuel</span>
            <span className="text-neutral-200 font-medium">
              {formatCurrency(mileageCosts.fuel)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Trailer Maint</span>
            <span className="text-neutral-200 font-medium">
              {formatCurrency(mileageCosts.trailerMaint)}
            </span>
          </div>
        </div>

        {/* Right Column - Variable Costs */}
        <div className="space-y-1.5">
          <p className="text-neutral-500 font-medium mb-2">Variable Costs</p>
          <div className="flex justify-between">
            <span className="text-neutral-400">Wage</span>
            <span className="text-neutral-200 font-medium">
              {formatCurrency(mileageCosts.wage)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Truck Maint</span>
            <span className="text-neutral-200 font-medium">
              {formatCurrency(mileageCosts.truckMaint)}
            </span>
          </div>
          {hasRolling && mileageCosts.rolling > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Rolling</span>
              <span className="text-neutral-200 font-medium">
                {formatCurrency(mileageCosts.rolling)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Total CPM - Highlighted */}
      <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between items-center">
        <span className="text-xs font-medium text-neutral-400">TOTAL CPM</span>
        <span className="text-lg font-bold text-neutral-100">
          {formatCurrency(totalCPM)}
        </span>
      </div>
    </Card>
  );
}
