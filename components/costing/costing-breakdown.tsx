"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { TripCost, DriverType } from "@/lib/costing";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CostingBreakdownProps {
  driverType: DriverType;
  distance: number;
  cost: TripCost;
  actualRevenue?: number;
}

export function CostingBreakdown({
  driverType,
  distance,
  cost,
  actualRevenue,
}: CostingBreakdownProps) {
  const [showOverhead, setShowOverhead] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    mileage: true,
    events: true,
    overhead: false,
  });

  const { mileageCosts, eventCosts, weeklyOverhead, directTripCost, fullyAllocatedCost, recommendedRevenue } = cost;
  const hasRolling = driverType === 'COM' || driverType === 'RNR';
  
  const actualMargin = actualRevenue 
    ? Math.round(((actualRevenue - directTripCost) / actualRevenue) * 100 * 100) / 100
    : null;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-100">Cost Breakdown</h3>
        <p className="text-xs text-neutral-500">Detailed trip costing analysis</p>
      </div>

      {/* Section 1: Mileage-Based Costs */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('mileage')}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Mileage-Based Costs
          </span>
          {expandedSections.mileage ? (
            <ChevronUp className="h-4 w-4 text-neutral-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          )}
        </button>

        {expandedSections.mileage && (
          <div className="space-y-1.5 text-xs">
            <div className="grid grid-cols-4 gap-2 text-neutral-500 font-medium mb-1">
              <span>Item</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Miles</span>
              <span className="text-right">Total</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <span className="text-neutral-300">Driver base wage</span>
              <span className="text-right text-neutral-300">
                {formatCurrency(mileageCosts.wage / distance)}/mi
              </span>
              <span className="text-right text-neutral-300">{distance}</span>
              <span className="text-right text-neutral-200 font-medium">
                {formatCurrency(mileageCosts.wage)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <span className="text-neutral-300">Fuel</span>
              <span className="text-right text-neutral-300">
                {formatCurrency(mileageCosts.fuel / distance)}/mi
              </span>
              <span className="text-right text-neutral-300">{distance}</span>
              <span className="text-right text-neutral-200 font-medium">
                {formatCurrency(mileageCosts.fuel)}
              </span>
            </div>

            {hasRolling && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  <span className="text-neutral-300">Benefits (12%)</span>
                  <span className="text-right text-neutral-300">—</span>
                  <span className="text-right text-neutral-300">—</span>
                  <span className="text-right text-neutral-200 font-medium">
                    {formatCurrency(mileageCosts.benefits)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span className="text-neutral-300">Performance (5%)</span>
                  <span className="text-right text-neutral-300">—</span>
                  <span className="text-right text-neutral-300">—</span>
                  <span className="text-right text-neutral-200 font-medium">
                    {formatCurrency(mileageCosts.performance)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span className="text-neutral-300">Safety (3%)</span>
                  <span className="text-right text-neutral-300">—</span>
                  <span className="text-right text-neutral-300">—</span>
                  <span className="text-right text-neutral-200 font-medium">
                    {formatCurrency(mileageCosts.safety)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span className="text-neutral-300">Step (2%)</span>
                  <span className="text-right text-neutral-300">—</span>
                  <span className="text-right text-neutral-300">—</span>
                  <span className="text-right text-neutral-200 font-medium">
                    {formatCurrency(mileageCosts.step)}
                  </span>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 gap-2">
              <span className="text-neutral-300">Truck R&M</span>
              <span className="text-right text-neutral-300">$0.12/mi</span>
              <span className="text-right text-neutral-300">{distance}</span>
              <span className="text-right text-neutral-200 font-medium">
                {formatCurrency(mileageCosts.truckMaint)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <span className="text-neutral-300">Trailer R&M</span>
              <span className="text-right text-neutral-300">$0.04/mi</span>
              <span className="text-right text-neutral-300">{distance}</span>
              <span className="text-right text-neutral-200 font-medium">
                {formatCurrency(mileageCosts.trailerMaint)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 border-t border-neutral-800 pt-1.5 mt-1.5">
              <span className="col-span-3 text-neutral-100 font-semibold">Subtotal</span>
              <span className="text-right text-neutral-100 font-bold">
                {formatCurrency(mileageCosts.subtotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Event-Based Costs */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('events')}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Event-Based Costs
          </span>
          {expandedSections.events ? (
            <ChevronUp className="h-4 w-4 text-neutral-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          )}
        </button>

        {expandedSections.events && (
          <div className="space-y-1.5 text-xs">
            {eventCosts.pickupCost > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-300">Pickup(s)</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(eventCosts.pickupCost)}
                </span>
              </div>
            )}
            {eventCosts.deliveryCost > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-300">Delivery(ies)</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(eventCosts.deliveryCost)}
                </span>
              </div>
            )}
            {eventCosts.borderCost > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-300">Border crossing(s)</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(eventCosts.borderCost)}
                </span>
              </div>
            )}
            {eventCosts.dropHookCost > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-300">Drop/hook(s)</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(eventCosts.dropHookCost)}
                </span>
              </div>
            )}

            <div className="flex justify-between border-t border-neutral-800 pt-1.5 mt-1.5">
              <span className="text-neutral-100 font-semibold">Subtotal</span>
              <span className="text-neutral-100 font-bold">
                {formatCurrency(eventCosts.subtotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Weekly Overhead (Optional/Toggleable) */}
      {weeklyOverhead && (
        <div className="mb-4">
          <button
            onClick={() => setShowOverhead(!showOverhead)}
            className="flex items-center justify-between w-full text-left mb-2"
          >
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Weekly Overhead Allocation
            </span>
            {showOverhead ? (
              <ChevronUp className="h-4 w-4 text-neutral-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            )}
          </button>

          {showOverhead && (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-300">Insurance</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(weeklyOverhead.insurance)}/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Trailer lease</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(weeklyOverhead.trailerLease)}/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">SG&A</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(weeklyOverhead.sga)}/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Dispatch/ops</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(weeklyOverhead.dispatchOps)}/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">PrePass</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(weeklyOverhead.prepass)}/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Isaac ELD</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(weeklyOverhead.isaacEld)}/day
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-300">Miscellaneous</span>
                <span className="text-neutral-200 font-medium">
                  {formatCurrency(weeklyOverhead.miscellaneous)}/day
                </span>
              </div>

              <div className="flex justify-between border-t border-neutral-800 pt-1.5 mt-1.5">
                <span className="text-neutral-100 font-semibold">Subtotal</span>
                <span className="text-neutral-100 font-bold">
                  {formatCurrency(weeklyOverhead.dailyTotal)}/day
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cost Summary */}
      <div className="border-t border-neutral-800 pt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-300 font-medium">Direct Trip Cost</span>
          <span className="text-neutral-100 font-bold">{formatCurrency(directTripCost)}</span>
        </div>
        
        {weeklyOverhead && (
          <div className="flex justify-between">
            <span className="text-neutral-300 font-medium">Fully Allocated Cost</span>
            <span className="text-neutral-100 font-bold">{formatCurrency(fullyAllocatedCost)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-neutral-300 font-medium">Recommended Revenue</span>
          <span className="text-emerald-400 font-bold">{formatCurrency(recommendedRevenue)}</span>
        </div>

        {actualRevenue && actualMargin !== null && (
          <div className="flex justify-between pt-2 border-t border-neutral-800">
            <span className="text-neutral-300 font-medium">Actual Margin</span>
            <span className={`font-bold ${actualMargin >= 18 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {actualMargin}%
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
