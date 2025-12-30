"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, DollarSign, Fuel, Wrench, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TripCost, DriverType } from "@/lib/costing";

interface CostingOption {
  driverType: DriverType;
  label: string;
  cost: TripCost;
  zone?: string;
}

interface DriverAccordionProps {
  options: CostingOption[];
  selectedOption: CostingOption | null;
  onSelect: (option: CostingOption) => void;
  actualMiles: number;
  insights?: any;
}

export function DriverAccordion({
  options,
  selectedOption,
  onSelect,
  actualMiles,
  insights
}: DriverAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-2">
      {options.map((option, index) => {
        const id = `option-${option.driverType}-${option.zone || index}`;
        const isSelected = selectedOption?.driverType === option.driverType && selectedOption?.zone === option.zone;
        const isRecommended = option.cost.directTripCost === Math.min(...options.map(o => o.cost.directTripCost));
        const isExpanded = expandedId === id;

        return (
          <Card
            key={id}
            className={`transition-all duration-200 overflow-hidden border ${
              isSelected
                ? "bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                : isRecommended
                ? "bg-emerald-900/10 border-emerald-500/30"
                : "bg-zinc-900/40 border-zinc-800/70 hover:border-zinc-700"
            }`}
          >
            {/* Summary Header (Always Visible) */}
            <div
              className="p-3 cursor-pointer flex items-center justify-between"
              onClick={() => onSelect(option)}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  isSelected ? "bg-blue-500/20 text-blue-400" : 
                  isRecommended ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                }`}>
                  {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${isSelected ? "text-white" : "text-zinc-300"}`}>
                      {option.label}
                    </h3>
                    {isRecommended && (
                      <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        BEST VALUE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span>${option.cost.totalCPM.toFixed(2)} CPM</span>
                    <span>•</span>
                    <span>${option.cost.directTripCost.toFixed(2)} Est. Cost</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-bold ${isSelected ? "text-blue-400" : "text-zinc-300"}`}>
                    ${option.cost.directTripCost.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={(e) => toggleExpand(id, e)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
                <div className="pt-3 border-t border-zinc-800/50 grid grid-cols-3 gap-2">
                  <div className="bg-zinc-900/50 rounded p-2 border border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                      <User className="w-3 h-3" />
                      <span className="text-[10px] uppercase tracking-wider">Wage</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-300">
                      ${(option.cost.mileageCosts.wage * actualMiles).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="bg-zinc-900/50 rounded p-2 border border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                      <Fuel className="w-3 h-3" />
                      <span className="text-[10px] uppercase tracking-wider">Fuel</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-300">
                      ${(option.cost.mileageCosts.fuel * actualMiles).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 rounded p-2 border border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                      <Wrench className="w-3 h-3" />
                      <span className="text-[10px] uppercase tracking-wider">Maint</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-300">
                      ${((option.cost.mileageCosts.truckMaint + option.cost.mileageCosts.trailerMaint) * actualMiles).toFixed(2)}
                    </p>
                  </div>
                </div>
                
                {isRecommended && insights?.costOptimization?.potentialSavings && insights.costOptimization.potentialSavings !== "0" && (
                   <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-900/20 border border-emerald-900/50 px-2 py-1.5 rounded flex items-center gap-2">
                     <DollarSign className="w-3 h-3" />
                     <span>AI Insight: Save {insights.costOptimization.potentialSavings} by choosing this option.</span>
                   </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
