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
    <div className="rounded-lg border border-fleet bg-fleet-primary p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-1 text-lg font-semibold text-fleet-primary">
          Booking Recommendation
        </h2>
        <p className="text-xs text-fleet-muted">
          Synthesized from telematics, routing, and live market data.
        </p>
      </div>

      {/* Recommended Driver */}
      <div className="mb-6">
        <div className="mb-3 text-xs font-medium text-fleet-muted">
          RECOMMENDED DRIVER
        </div>
        <div className="flex items-start gap-4 rounded-lg border border-fleet bg-fleet-tertiary p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fleet-accent/20">
            <User className="h-5 w-5 text-fleet-accent" />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-sm font-semibold text-fleet-primary">
              {recommendation.driver.name}
            </div>
            <div className="mb-2 text-xs text-fleet-secondary">
              {recommendation.driver.homeTerminal}
            </div>
            {recommendation.driver.currentLocation && (
              <div className="flex items-center gap-1 text-xs text-fleet-muted">
                <MapPin className="h-3 w-3" />
                <span>Currently: {recommendation.driver.currentLocation}</span>
              </div>
            )}
          </div>
          {recommendation.driver.efficiency && (
            <div className="text-right">
              <div className="mb-1 text-xs text-fleet-muted">Efficiency</div>
              <div className="text-sm font-semibold text-fleet-success">
                {recommendation.driver.efficiency}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Unit */}
      <div className="mb-6">
        <div className="mb-3 text-xs font-medium text-fleet-muted">
          RECOMMENDED UNIT
        </div>
        <div className="flex items-start gap-4 rounded-lg border border-fleet bg-fleet-tertiary p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fleet-insight/20">
            <Truck className="h-5 w-5 text-fleet-insight" />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-sm font-semibold text-fleet-primary">
              {recommendation.unit.unitNumber}
            </div>
            <div className="mb-2 text-xs text-fleet-secondary">
              {recommendation.unit.unitNumber}, Class {recommendation.unit.class}
            </div>
            <div className="text-xs text-fleet-muted">
              {recommendation.unit.homeTerminal}
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-xs text-fleet-muted">Status</div>
            <div className="rounded border border-fleet-success/20 bg-fleet-success/10 px-2 py-1 text-xs font-medium text-fleet-success">
              {recommendation.unit.availability}
            </div>
          </div>
        </div>
      </div>

      {/* Quoted Rate vs Market */}
      <div className="mb-6 rounded-lg border border-fleet bg-fleet-tertiary p-4">
        <div className="mb-3 text-xs font-medium text-fleet-muted">
          QUOTED RATE VS MARKET
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold text-fleet-primary">
            ${recommendation.quotedRateVsMarket.rate.toFixed(2)}/mi
          </div>
          <div className="flex items-center gap-1 text-xs text-fleet-success">
            <TrendingDown className="h-4 w-4" />
            <span>Below Market</span>
          </div>
        </div>
        <div className="text-xs text-fleet-muted">
          {recommendation.quotedRateVsMarket.market}
        </div>
      </div>

      {/* ETA & Miles */}
      <div className="mb-6 rounded-lg border border-fleet bg-fleet-tertiary p-4">
        <div className="mb-3 text-xs font-medium text-fleet-muted">
          ETA & MILES
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-fleet-accent" />
              <span className="text-lg font-semibold text-fleet-primary">
                {recommendation.miles} mi
              </span>
            </div>
            <div className="text-xs text-fleet-muted">Total Distance</div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-fleet-warning" />
              <span className="text-lg font-semibold text-fleet-primary">
                {recommendation.etaHours.toFixed(1)} hr
              </span>
            </div>
            <div className="text-xs text-fleet-muted">Estimated Time</div>
          </div>
        </div>
        <div className="mt-3 border-t border-fleet pt-3 text-xs text-fleet-secondary">
          {recommendation.routingNotes}
        </div>
      </div>

      {/* Revenue Targets for 5% Margin */}
      <div className="rounded-lg border border-fleet-success/20 bg-fleet-success/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-fleet-success" />
          <div className="text-xs font-medium text-fleet-success">
            REVENUE TARGETS FOR {recommendation.revenueTargets.margin}% MARGIN
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="mb-1 text-xs text-fleet-muted">Recommended Revenue</div>
            <div className="text-lg font-bold text-fleet-primary">
              ${recommendation.revenueTargets.revenue.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-fleet-muted">Recommended RPM</div>
            <div className="text-lg font-bold text-fleet-primary">
              ${recommendation.revenueTargets.rpm.toFixed(3)}/mi
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs text-fleet-muted">Target Margin</div>
            <div className="text-lg font-bold text-fleet-success">
              {recommendation.revenueTargets.margin}%
            </div>
          </div>
        </div>
        <div className="mt-3 border-t border-fleet-success/20 pt-3 text-xs text-fleet-secondary">
          Targets a {recommendation.revenueTargets.margin}% margin using current
          miles and cost assumptions.
        </div>
      </div>
    </div>
  );
}
