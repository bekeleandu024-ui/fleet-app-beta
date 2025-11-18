import { ArrowRight, BadgeCheck, CircleDollarSign } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";

interface DriverCostComparisonProps {
  distanceMiles?: number;
}

const BASE_CPM = {
  RNR: 0.456,
  COM: 0.54,
  OO: 0.816,
};

export function DriverCostComparison({ distanceMiles = 120 }: DriverCostComparisonProps) {
  const options = [
    {
      label: "RNR driver",
      helper: "Most cost-effective",
      badge: "MOST COST-EFFECTIVE",
      badgeTone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      cpm: BASE_CPM.RNR,
      tone: "text-emerald-300",
    },
    {
      label: "COM driver",
      helper: "Balanced, currently assigned",
      badge: "CURRENT",
      badgeTone: "bg-blue-500/10 text-blue-200 border-blue-500/30",
      cpm: BASE_CPM.COM,
      tone: "text-blue-200",
    },
    {
      label: "OO driver",
      helper: "Premium option",
      badge: "PREMIUM",
      badgeTone: "bg-amber-500/10 text-amber-200 border-amber-500/30",
      cpm: BASE_CPM.OO,
      tone: "text-amber-200",
    },
  ];

  return (
    <Card className="border-neutral-800/80 bg-neutral-900/60 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-neutral-100">Driver/Truck Configuration Comparison</h3>
          <p className="text-sm text-neutral-500">Cost impact for this lane at ~{Math.round(distanceMiles)} miles.</p>
        </div>
        <BadgeCheck className="h-5 w-5 text-neutral-500" />
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const total = option.cpm * distanceMiles;
          return (
            <div
              key={option.label}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800/80 bg-neutral-900/70 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide border ${option.badgeTone}`}>
                  {option.badge}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-100">{option.label}</p>
                  <p className="text-xs text-neutral-500">{option.helper}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-200">
                <div className="text-right">
                  <p className={`text-base font-semibold ${option.tone}`}>{formatCurrency(total)}</p>
                  <p className="text-xs text-neutral-500">{formatCurrency(option.cpm)}/mile</p>
                </div>
                <ArrowRight className="h-4 w-4 text-neutral-600" />
                <div className="text-right">
                  <p className="text-base font-semibold text-neutral-100">{formatCurrency(total)}</p>
                  <p className="text-xs text-neutral-500">Estimated driver cost</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-neutral-400">
        <CircleDollarSign className="h-4 w-4" />
        <span>Costs assume {formatNumber(distanceMiles)} miles at the effective CPM per driver type.</span>
      </div>
    </Card>
  );
}
