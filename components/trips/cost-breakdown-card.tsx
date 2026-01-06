"use client";

import { useState } from "react";
import {
  DollarSign,
  Fuel,
  Wrench,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CostBreakdownData {
  fixedCost?: number;
  laborCost?: number;
  fuelCost?: number;
  maintenanceCost?: number;
  eventsCost?: number;
  totalCost?: number;
  totalCpm?: number;
  fixedCpm?: number;
  wageCpm?: number;
  rollingCpm?: number;
  accessorialCpm?: number;
  miles?: number;
  borderCrossings?: number;
  pickupCount?: number;
  deliveryCount?: number;
}

interface CostBreakdownCardProps {
  costs: CostBreakdownData;
  className?: string;
}

export function CostBreakdownCard({ costs, className }: CostBreakdownCardProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    fixedCost = 0,
    laborCost = 0,
    fuelCost = 0,
    maintenanceCost = 0,
    eventsCost = 0,
    totalCost = 0,
    totalCpm = 0,
    fixedCpm = 0,
    wageCpm = 0,
    rollingCpm = 0,
    accessorialCpm = 0,
    miles = 0,
    borderCrossings = 0,
    pickupCount = 0,
    deliveryCount = 0,
  } = costs;

  // Calculate percentage breakdown for visualization
  const costCategories = [
    { name: "Fixed", value: fixedCost || (fixedCpm * miles), color: "bg-blue-500", icon: DollarSign },
    { name: "Labor", value: laborCost || (wageCpm * miles), color: "bg-emerald-500", icon: User },
    { name: "Fuel", value: fuelCost, color: "bg-amber-500", icon: Fuel },
    { name: "Maintenance", value: maintenanceCost || (rollingCpm * miles * 0.16), color: "bg-purple-500", icon: Wrench },
    { name: "Events", value: eventsCost || (accessorialCpm * miles), color: "bg-rose-500", icon: MapPin },
  ];

  const calculatedTotal = costCategories.reduce((sum, cat) => sum + cat.value, 0);
  const displayTotal = totalCost > 0 ? totalCost : calculatedTotal;

  return (
    <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Cost Breakdown
          </CardTitle>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Detailed cost analysis for this trip
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Total Cost Summary */}
        <div className="mb-4 p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">Total Trip Cost</span>
            <span className="text-lg font-bold text-neutral-100">
              {formatCurrency(displayTotal)}
            </span>
          </div>
          {miles > 0 && totalCpm > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Cost Per Mile</span>
              <span className="text-neutral-300 font-medium">
                {formatCurrency(totalCpm)}/mi × {Math.round(miles)} mi
              </span>
            </div>
          )}
        </div>

        {/* Stacked Bar Visualization */}
        <div className="mb-4">
          <div className="h-4 rounded-full overflow-hidden flex bg-neutral-800">
            {costCategories.map((cat, idx) => {
              const percentage = displayTotal > 0 ? (cat.value / displayTotal) * 100 : 0;
              if (percentage < 1) return null;
              return (
                <div
                  key={cat.name}
                  className={cn(cat.color, "transition-all duration-300")}
                  style={{ width: `${percentage}%` }}
                  title={`${cat.name}: ${formatCurrency(cat.value)} (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {costCategories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                <span className="text-neutral-400">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown */}
        {expanded && (
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            {costCategories.map((cat) => {
              const Icon = cat.icon;
              const percentage = displayTotal > 0 ? (cat.value / displayTotal) * 100 : 0;
              return (
                <div
                  key={cat.name}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md", cat.color.replace('bg-', 'bg-') + '/20')}>
                      <Icon className={cn("h-3.5 w-3.5", cat.color.replace('bg-', 'text-'))} />
                    </div>
                    <span className="text-sm text-neutral-300">{cat.name} Costs</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-neutral-200">
                      {formatCurrency(cat.value)}
                    </span>
                    <span className="text-xs text-neutral-500 ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Per-Mile Breakdown */}
            {miles > 0 && (
              <div className="mt-3 pt-3 border-t border-neutral-800">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                  CPM Breakdown
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Fixed CPM</span>
                    <span className="text-neutral-300">{formatCurrency(fixedCpm)}/mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Wage CPM</span>
                    <span className="text-neutral-300">{formatCurrency(wageCpm)}/mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Rolling CPM</span>
                    <span className="text-neutral-300">{formatCurrency(rollingCpm)}/mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Accessorial CPM</span>
                    <span className="text-neutral-300">{formatCurrency(accessorialCpm)}/mi</span>
                  </div>
                </div>
              </div>
            )}

            {/* Event Costs Details */}
            {(borderCrossings > 0 || pickupCount > 0 || deliveryCount > 0) && (
              <div className="mt-3 pt-3 border-t border-neutral-800">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
                  Event Details
                </p>
                <div className="flex flex-wrap gap-2">
                  {pickupCount > 0 && (
                    <span className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300">
                      {pickupCount} Pickup{pickupCount > 1 ? 's' : ''} × $30
                    </span>
                  )}
                  {deliveryCount > 0 && (
                    <span className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300">
                      {deliveryCount} Delivery{deliveryCount > 1 ? 'ies' : ''} × $30
                    </span>
                  )}
                  {borderCrossings > 0 && (
                    <span className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300">
                      {borderCrossings} Border Crossing{borderCrossings > 1 ? 's' : ''} × $15
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
