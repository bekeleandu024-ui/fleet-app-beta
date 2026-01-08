"use client";

import { useState } from "react";
import {
  Award,
  Truck,
  FileCheck,
  DollarSign,
  CheckCircle2,
  Circle,
  ChevronRight,
  Clock,
  AlertTriangle,
  Upload,
  ArrowRight,
  Loader2,
  Building2,
  Receipt,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ============================================================================
// TYPES
// ============================================================================

export type FarmOutTripPhase = 
  | "pending"      // Not posted yet
  | "posted"       // Posted to load boards
  | "covered"      // Carrier awarded
  | "in_transit"   // Picked up, en route
  | "delivered"    // Arrived at destination
  | "closed";      // Finalized, settled

interface TripWorkflowData {
  tripId: string;
  tripNumber: string;
  phase: FarmOutTripPhase;
  // Coverage
  carrierName?: string;
  awardedAmount?: number;
  awardedAt?: string;
  bidCount: number;
  // Execution
  pickupTime?: string;
  deliveryTime?: string;
  podUploaded: boolean;
  podUrl?: string;
  // Settlement
  customerRate: number;
  carrierCost: number;
  accessorialTotal?: number;
  margin?: number;
  billingStatus?: "pending" | "invoiced" | "paid";
  paymentStatus?: "pending" | "scheduled" | "paid";
}

interface WhatNowWorkflowProps {
  trip: TripWorkflowData;
  onLogBid: () => void;
  onAwardCarrier?: (carrierId: string) => void;
  onUpdateStatus: (newPhase: FarmOutTripPhase) => void;
  onUploadPOD: () => void;
  onFinalizeBilling: () => void;
  isUpdating?: boolean;
}

// ============================================================================
// PHASE CONFIGURATION
// ============================================================================

const PHASE_CONFIG: Record<FarmOutTripPhase, {
  step: number;
  label: string;
  icon: typeof Award;
  color: string;
  bgColor: string;
}> = {
  pending: { step: 0, label: "Pending", icon: Clock, color: "text-zinc-400", bgColor: "bg-zinc-500/20" },
  posted: { step: 1, label: "Posted", icon: Building2, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  covered: { step: 2, label: "Covered", icon: Award, color: "text-amber-400", bgColor: "bg-amber-500/20" },
  in_transit: { step: 3, label: "In Transit", icon: Truck, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  delivered: { step: 4, label: "Delivered", icon: FileCheck, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  closed: { step: 5, label: "Closed", icon: CheckCircle2, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function WhatNowWorkflow({
  trip,
  onLogBid,
  onAwardCarrier,
  onUpdateStatus,
  onUploadPOD,
  onFinalizeBilling,
  isUpdating = false,
}: WhatNowWorkflowProps) {
  const currentPhaseConfig = PHASE_CONFIG[trip.phase];
  const currentStep = currentPhaseConfig.step;

  // Calculate margin
  const margin = trip.customerRate - trip.carrierCost - (trip.accessorialTotal || 0);
  const marginPct = trip.customerRate > 0 ? ((margin / trip.customerRate) * 100).toFixed(1) : 0;

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              What Now?
            </div>
            <Badge className={cn(currentPhaseConfig.bgColor, currentPhaseConfig.color, "text-[10px]")}>
              {currentPhaseConfig.label}
            </Badge>
          </div>
          <div className="text-[10px] text-zinc-500">
            Step {Math.min(currentStep + 1, 3)} of 3
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1 mb-4">
          {/* Step 1: Coverage */}
          <StepIndicator 
            step={1}
            label="Coverage"
            isComplete={currentStep >= 2}
            isActive={currentStep === 0 || currentStep === 1}
          />
          <ChevronRight className="h-3 w-3 text-zinc-700 flex-shrink-0" />
          
          {/* Step 2: Execution */}
          <StepIndicator 
            step={2}
            label="Execution"
            isComplete={currentStep >= 4}
            isActive={currentStep === 2 || currentStep === 3}
          />
          <ChevronRight className="h-3 w-3 text-zinc-700 flex-shrink-0" />
          
          {/* Step 3: Settlement */}
          <StepIndicator 
            step={3}
            label="Settlement"
            isComplete={currentStep >= 5}
            isActive={currentStep === 4}
          />
        </div>

        {/* Phase-Specific Content */}
        {(trip.phase === "pending" || trip.phase === "posted") && (
          <CoveragePhase 
            trip={trip}
            onLogBid={onLogBid}
            isUpdating={isUpdating}
          />
        )}

        {trip.phase === "covered" && (
          <ExecutionReadyPhase
            trip={trip}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdating}
          />
        )}

        {trip.phase === "in_transit" && (
          <InTransitPhase
            trip={trip}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdating}
          />
        )}

        {trip.phase === "delivered" && (
          <DeliveredPhase
            trip={trip}
            onUploadPOD={onUploadPOD}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdating}
          />
        )}

        {trip.phase === "closed" && (
          <ClosedPhase
            trip={trip}
            margin={margin}
            marginPct={marginPct}
            onFinalizeBilling={onFinalizeBilling}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StepIndicator({ 
  step, 
  label, 
  isComplete, 
  isActive 
}: { 
  step: number; 
  label: string; 
  isComplete: boolean; 
  isActive: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors flex-1 justify-center",
      isComplete && "bg-emerald-500/10",
      isActive && !isComplete && "bg-amber-500/10",
      !isComplete && !isActive && "bg-zinc-800/50"
    )}>
      {isComplete ? (
        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
      ) : isActive ? (
        <Circle className="h-3 w-3 text-amber-400 fill-amber-400" />
      ) : (
        <Circle className="h-3 w-3 text-zinc-600" />
      )}
      <span className={cn(
        "text-[10px] font-medium",
        isComplete && "text-emerald-400",
        isActive && !isComplete && "text-amber-400",
        !isComplete && !isActive && "text-zinc-500"
      )}>
        {label}
      </span>
    </div>
  );
}

function CoveragePhase({ 
  trip, 
  onLogBid,
  isUpdating 
}: { 
  trip: TripWorkflowData; 
  onLogBid: () => void;
  isUpdating: boolean;
}) {
  return (
    <Card className="bg-zinc-800/30 border-zinc-700/50">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Award className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-zinc-100 mb-1">
              {trip.phase === "pending" ? "Post to Load Boards" : "Awaiting Carrier Coverage"}
            </h4>
            <p className="text-xs text-zinc-400 mb-3">
              {trip.phase === "pending" 
                ? "This trip needs to be posted to external load boards to receive carrier bids."
                : trip.bidCount > 0 
                  ? `${trip.bidCount} bid(s) received. Review and award to proceed.`
                  : "Posted and waiting for carrier bids. Log bids as they come in."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="subtle"
                onClick={onLogBid}
                disabled={isUpdating}
                className="h-7 text-xs border-zinc-700"
              >
                <Award className="h-3 w-3 mr-1.5" />
                Log Bid
              </Button>
              {trip.bidCount > 0 && (
                <span className="text-[10px] text-zinc-500">
                  Award a bid to move to "Covered"
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutionReadyPhase({ 
  trip, 
  onUpdateStatus,
  isUpdating 
}: { 
  trip: TripWorkflowData; 
  onUpdateStatus: (phase: FarmOutTripPhase) => void;
  isUpdating: boolean;
}) {
  return (
    <Card className="bg-zinc-800/30 border-amber-500/30">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Truck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-zinc-100 mb-1">
              Carrier Covered — Ready for Execution
            </h4>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                {trip.carrierName}
              </Badge>
              <span className="text-xs text-zinc-500">
                ${trip.awardedAmount?.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Carrier has been awarded. Confirm pickup to move to "In Transit".
            </p>
            <Button
              size="sm"
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => onUpdateStatus("in_transit")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3 w-3 mr-1.5" />
              )}
              Confirm Pickup — Move to In Transit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InTransitPhase({ 
  trip, 
  onUpdateStatus,
  isUpdating 
}: { 
  trip: TripWorkflowData; 
  onUpdateStatus: (phase: FarmOutTripPhase) => void;
  isUpdating: boolean;
}) {
  return (
    <Card className="bg-zinc-800/30 border-blue-500/30">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Truck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-zinc-100 mb-1">
              In Transit — Awaiting Delivery
            </h4>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">
                {trip.carrierName}
              </Badge>
              {trip.pickupTime && (
                <span className="text-[10px] text-zinc-500">
                  Picked up {new Date(trip.pickupTime).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Load is en route. Confirm delivery arrival to proceed.
            </p>
            <Button
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => onUpdateStatus("delivered")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <FileCheck className="h-3 w-3 mr-1.5" />
              )}
              Confirm Delivery Arrival
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DeliveredPhase({ 
  trip, 
  onUploadPOD,
  onUpdateStatus,
  isUpdating 
}: { 
  trip: TripWorkflowData; 
  onUploadPOD: () => void;
  onUpdateStatus: (phase: FarmOutTripPhase) => void;
  isUpdating: boolean;
}) {
  return (
    <Card className={cn(
      "bg-zinc-800/30",
      trip.podUploaded ? "border-emerald-500/30" : "border-amber-500/30"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            trip.podUploaded ? "bg-emerald-500/10" : "bg-amber-500/10"
          )}>
            <FileCheck className={cn(
              "h-4 w-4",
              trip.podUploaded ? "text-emerald-400" : "text-amber-400"
            )} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-zinc-100 mb-1">
              Delivered — {trip.podUploaded ? "Ready to Close" : "POD Required"}
            </h4>
            {trip.deliveryTime && (
              <p className="text-[10px] text-zinc-500 mb-2">
                Delivered {new Date(trip.deliveryTime).toLocaleString()}
              </p>
            )}
            
            {!trip.podUploaded ? (
              <>
                <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 mb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-300">
                    POD document required to close this trip
                  </span>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={onUploadPOD}
                >
                  <Upload className="h-3 w-3 mr-1.5" />
                  Upload POD
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 mb-3">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-emerald-300">
                    POD uploaded — Ready for settlement
                  </span>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onUpdateStatus("closed")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <DollarSign className="h-3 w-3 mr-1.5" />
                  )}
                  Close Trip & Move to Settlement
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClosedPhase({ 
  trip, 
  margin,
  marginPct,
  onFinalizeBilling 
}: { 
  trip: TripWorkflowData; 
  margin: number;
  marginPct: number | string;
  onFinalizeBilling: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Settlement Summary */}
      <Card className="bg-zinc-800/30 border-emerald-500/30">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-zinc-100 mb-2">
                Trip Closed — Settlement Required
              </h4>
              
              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="p-2 rounded bg-zinc-900/50">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                    <Receipt className="h-3 w-3" />
                    Customer AR
                  </div>
                  <div className="text-sm font-bold text-zinc-100">
                    ${trip.customerRate.toLocaleString()}
                  </div>
                  <Badge className={cn(
                    "text-[9px] mt-1",
                    trip.billingStatus === "paid" ? "bg-emerald-500/20 text-emerald-400" :
                    trip.billingStatus === "invoiced" ? "bg-blue-500/20 text-blue-400" :
                    "bg-amber-500/20 text-amber-400"
                  )}>
                    {trip.billingStatus || "Pending"}
                  </Badge>
                </div>
                
                <div className="p-2 rounded bg-zinc-900/50">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                    <CreditCard className="h-3 w-3" />
                    Carrier AP
                  </div>
                  <div className="text-sm font-bold text-zinc-100">
                    ${trip.carrierCost.toLocaleString()}
                  </div>
                  <Badge className={cn(
                    "text-[9px] mt-1",
                    trip.paymentStatus === "paid" ? "bg-emerald-500/20 text-emerald-400" :
                    trip.paymentStatus === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                    "bg-amber-500/20 text-amber-400"
                  )}>
                    {trip.paymentStatus || "Pending"}
                  </Badge>
                </div>
                
                <div className="p-2 rounded bg-zinc-900/50">
                  <div className="text-[10px] text-zinc-500 mb-0.5">Margin</div>
                  <div className={cn(
                    "text-sm font-bold",
                    margin >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    ${margin.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {marginPct}%
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="subtle"
                className="h-7 text-xs border-zinc-700"
                onClick={onFinalizeBilling}
              >
                <DollarSign className="h-3 w-3 mr-1.5" />
                Review & Finalize Billing
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail Note */}
      <div className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-800/30 border border-zinc-700/50">
        <FileCheck className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[10px] text-zinc-500">
          POD on file • Bid history logged • Ready for accounts processing
        </span>
      </div>
    </div>
  );
}
