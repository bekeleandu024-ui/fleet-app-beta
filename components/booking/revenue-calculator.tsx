"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MarginGauge } from "@/components/margin-gauge";

interface RevenueCalculatorProps {
  miles: number;
  rpm: number;
  revenue: number;
  onRpmChange: (rpm: number) => void;
  onRevenueChange: (revenue: number) => void;
  onMilesChange: (miles: number) => void;
  className?: string;
}

export function RevenueCalculator({
  miles,
  rpm,
  revenue,
  onRpmChange,
  onRevenueChange,
  onMilesChange,
  className = "",
}: RevenueCalculatorProps) {
  const [localMiles, setLocalMiles] = useState(String(miles || ""));
  const [localRpm, setLocalRpm] = useState(String(rpm || ""));
  const [localRevenue, setLocalRevenue] = useState(String(revenue || ""));

  // Sync with parent props
  useEffect(() => {
    setLocalMiles(String(miles || ""));
  }, [miles]);

  useEffect(() => {
    setLocalRpm(String(rpm || ""));
  }, [rpm]);

  useEffect(() => {
    setLocalRevenue(String(revenue || ""));
  }, [revenue]);

  const handleMilesChange = (value: string) => {
    setLocalMiles(value);
    const m = parseFloat(value) || 0;
    onMilesChange(m);

    // If RPM exists, calculate revenue
    const r = parseFloat(localRpm) || 0;
    if (m > 0 && r > 0) {
      const calculatedRevenue = m * r;
      setLocalRevenue(calculatedRevenue.toFixed(2));
      onRevenueChange(calculatedRevenue);
    }
  };

  const handleRpmChange = (value: string) => {
    setLocalRpm(value);
    const r = parseFloat(value) || 0;
    onRpmChange(r);

    // Calculate revenue: miles × RPM
    const m = parseFloat(localMiles) || 0;
    if (m > 0 && r > 0) {
      const calculatedRevenue = m * r;
      setLocalRevenue(calculatedRevenue.toFixed(2));
      onRevenueChange(calculatedRevenue);
    }
  };

  const handleRevenueChange = (value: string) => {
    setLocalRevenue(value);
    const rev = parseFloat(value) || 0;
    onRevenueChange(rev);

    // Calculate RPM: revenue ÷ miles
    const m = parseFloat(localMiles) || 0;
    if (m > 0 && rev > 0) {
      const calculatedRpm = rev / m;
      setLocalRpm(calculatedRpm.toFixed(2));
      onRpmChange(calculatedRpm);
    }
  };

  const calculatedRevenue = (parseFloat(localMiles) || 0) * (parseFloat(localRpm) || 0);
  const isRevenueLinked = Math.abs(calculatedRevenue - (parseFloat(localRevenue) || 0)) < 0.01;

  return (
    <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-neutral-200">Revenue Calculation</h3>
      </div>

      <div className="space-y-3">
        {/* Miles Input */}
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
            Total Miles
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              value={localMiles}
              onChange={(e) => handleMilesChange(e.target.value)}
              placeholder="500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">mi</span>
          </div>
        </div>

        {/* Linked Indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <div className="h-px w-12 bg-linear-to-r from-transparent via-neutral-700 to-transparent" />
            <span className={isRevenueLinked ? "text-emerald-400" : "text-amber-400"}>
              {isRevenueLinked ? "Linked" : "Manual Override"}
            </span>
            <div className="h-px w-12 bg-linear-to-r from-transparent via-neutral-700 to-transparent" />
          </div>
        </div>

        {/* RPM and Revenue Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-neutral-500">
              <DollarSign className="h-3 w-3" />
              RPM (Rate Per Mile)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              value={localRpm}
              onChange={(e) => handleRpmChange(e.target.value)}
              placeholder="2.50"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-neutral-500">
              <TrendingUp className="h-3 w-3" />
              Total Revenue
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              value={localRevenue}
              onChange={(e) => handleRevenueChange(e.target.value)}
              placeholder="1250.00"
            />
          </div>
        </div>

        {/* Formula Display */}
        <div className="rounded-lg border border-blue-800/30 bg-blue-950/20 px-3 py-2">
          <p className="text-center text-xs text-blue-300">
            <span className="font-mono">{parseFloat(localMiles) || 0} mi</span>
            <span className="mx-2 text-blue-500">×</span>
            <span className="font-mono">${parseFloat(localRpm) || 0}</span>
            <span className="mx-2 text-blue-500">=</span>
            <span className="font-semibold font-mono">${calculatedRevenue.toFixed(2)}</span>
          </p>
        </div>

        {/* Additional Revenue Fields */}
        <div className="grid gap-2 border-t border-white/10 pt-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
              Fuel Surcharge
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              placeholder="50.00"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
              Add-ons/Accessorials
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              placeholder="75.00"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
