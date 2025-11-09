"use client";

import { User, Truck, TrendingDown, Clock, MapPin, DollarSign } from "lucide-react";
import { BookingRecommendation } from "../types";

interface BookingRecommendationPanelProps {
  recommendation: BookingRecommendation;
}

export function BookingRecommendationPanel({
  recommendation,
}: BookingRecommendationPanelProps) {
  return (
    <div className="bg-[#0B1020] border border-[#1E2638] rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#E6EAF2] mb-1">
          Booking Recommendation
        </h2>
        <p className="text-xs text-[#6C7484]">
          Synthesized from telematics, routing, and live market data.
        </p>
      </div>

      {/* Recommended Driver */}
      <div className="mb-6">
        <div className="text-xs font-medium text-[#6C7484] mb-3">
          RECOMMENDED DRIVER
        </div>
        <div className="flex items-start gap-4 p-4 bg-[#0F1420] border border-[#1E2638] rounded-lg">
          <div className="w-10 h-10 bg-[#60A5FA]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-[#60A5FA]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#E6EAF2] mb-1">
              {recommendation.driver.name}
            </div>
            <div className="text-xs text-[#9AA4B2] mb-2">
              {recommendation.driver.homeTerminal}
            </div>
            {recommendation.driver.currentLocation && (
              <div className="flex items-center gap-1 text-xs text-[#6C7484]">
                <MapPin className="h-3 w-3" />
                <span>Currently: {recommendation.driver.currentLocation}</span>
              </div>
            )}
          </div>
          {recommendation.driver.efficiency && (
            <div className="text-right">
              <div className="text-xs text-[#6C7484] mb-1">Efficiency</div>
              <div className="text-sm font-semibold text-[#24D67B]">
                {recommendation.driver.efficiency}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Unit */}
      <div className="mb-6">
        <div className="text-xs font-medium text-[#6C7484] mb-3">
          RECOMMENDED UNIT
        </div>
        <div className="flex items-start gap-4 p-4 bg-[#0F1420] border border-[#1E2638] rounded-lg">
          <div className="w-10 h-10 bg-[#A78BFA]/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Truck className="h-5 w-5 text-[#A78BFA]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#E6EAF2] mb-1">
              {recommendation.unit.unitNumber}
            </div>
            <div className="text-xs text-[#9AA4B2] mb-2">
              {recommendation.unit.unitNumber}, Class {recommendation.unit.class}
            </div>
            <div className="text-xs text-[#6C7484]">
              {recommendation.unit.homeTerminal}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6C7484] mb-1">Status</div>
            <div className="px-2 py-1 bg-[#24D67B]/10 border border-[#24D67B]/30 rounded text-xs font-medium text-[#24D67B]">
              {recommendation.unit.availability}
            </div>
          </div>
        </div>
      </div>

      {/* Quoted Rate vs Market */}
      <div className="mb-6 p-4 bg-[#0F1420] border border-[#1E2638] rounded-lg">
        <div className="text-xs font-medium text-[#6C7484] mb-3">
          QUOTED RATE VS MARKET
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold text-[#E6EAF2]">
            ${recommendation.quotedRateVsMarket.rate.toFixed(2)}/mi
          </div>
          <div className="flex items-center gap-1 text-xs text-[#24D67B]">
            <TrendingDown className="h-4 w-4" />
            <span>Below Market</span>
          </div>
        </div>
        <div className="text-xs text-[#6C7484]">
          {recommendation.quotedRateVsMarket.market}
        </div>
      </div>

      {/* ETA & Miles */}
      <div className="mb-6 p-4 bg-[#0F1420] border border-[#1E2638] rounded-lg">
        <div className="text-xs font-medium text-[#6C7484] mb-3">
          ETA & MILES
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-[#60A5FA]" />
              <span className="text-lg font-semibold text-[#E6EAF2]">
                {recommendation.miles} mi
              </span>
            </div>
            <div className="text-xs text-[#6C7484]">Total Distance</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[#FFC857]" />
              <span className="text-lg font-semibold text-[#E6EAF2]">
                {recommendation.etaHours.toFixed(1)} hr
              </span>
            </div>
            <div className="text-xs text-[#6C7484]">Estimated Time</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#1E2638] text-xs text-[#9AA4B2]">
          {recommendation.routingNotes}
        </div>
      </div>

      {/* Revenue Targets for 5% Margin */}
      <div className="p-4 bg-[#24D67B]/5 border border-[#24D67B]/20 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4 text-[#24D67B]" />
          <div className="text-xs font-medium text-[#24D67B]">
            REVENUE TARGETS FOR {recommendation.revenueTargets.margin}% MARGIN
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[#6C7484] mb-1">Recommended Revenue</div>
            <div className="text-lg font-bold text-[#E6EAF2]">
              ${recommendation.revenueTargets.revenue.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6C7484] mb-1">Recommended RPM</div>
            <div className="text-lg font-bold text-[#E6EAF2]">
              ${recommendation.revenueTargets.rpm.toFixed(3)}/mi
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6C7484] mb-1">Target Margin</div>
            <div className="text-lg font-bold text-[#24D67B]">
              {recommendation.revenueTargets.margin}%
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-[#24D67B]/20 text-xs text-[#9AA4B2]">
          Targets a {recommendation.revenueTargets.margin}% margin using current
          miles and cost assumptions.
        </div>
      </div>
    </div>
  );
}
