"use client";

import { useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  FileCheck,
  FileX,
  Gauge,
  MapPin,
  Navigation,
  Truck,
  User,
  XCircle,
  ChevronRight,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { enterprisePalette, shouldHighlight, getValueColor } from "@/lib/enterprise-colors";
import { Button } from "@/components/ui/button";
import {
  DetailPanelHeader,
  DetailGrid,
  GridColumn,
  DataRow,
  ProgressStepper,
} from "./master-detail-layout";
import { AIInsightsBar, type Insight } from "@/components/trips/ai-insights-bar";
import { LiveOpsConsole } from "@/components/trips/live-ops-console";
import { LiveOpsMap } from "@/components/trips/live-ops-map";
import type { TripDetail, TripStop } from "@/lib/types";
import { Radio } from "lucide-react";

// Status badge colors
const statusColors: Record<string, string> = {
  Draft: "bg-zinc-700 text-zinc-200",
  Assigned: "bg-zinc-600/80 text-zinc-100",
  Dispatched: "bg-blue-600/80 text-blue-100",
  "In Transit": "bg-amber-600/80 text-amber-100",
  "At Pickup": "bg-purple-600/80 text-purple-100",
  "At Delivery": "bg-purple-600/80 text-purple-100",
  Completed: "bg-emerald-600/80 text-emerald-100",
  Delivered: "bg-emerald-600/80 text-emerald-100",
  Cancelled: "bg-red-600/80 text-red-100",
  Invoiced: "bg-teal-600/80 text-teal-100",
};

// Margin health colors
const marginColors: Record<string, string> = {
  healthy: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400",
};

interface TripDetailPanelProps {
  trip: TripDetail;
  onEdit?: () => void;
  onCancel?: () => void;
  onDuplicate?: () => void;
  onClose?: () => void;
  isEditing?: boolean;
}

/**
 * Trip Detail Panel for Master-Detail Layout
 * 3-Column Grid:
 * - Col 1 (Execution): Itinerary/Route & Stops
 * - Col 2 (Specifics): Cargo Details & Power Unit/Driver info
 * - Col 3 (Administrative): Financials, Documents, Notes
 */
export function TripDetailPanel({
  trip,
  onEdit,
  onCancel,
  onDuplicate,
  onClose,
  isEditing = false,
}: TripDetailPanelProps) {
  // Local state for tab navigation
  const [activeTab, setActiveTab] = useState<"details" | "operations">("details");

  // Progress stepper based on trip status
  const progressSteps = getProgressSteps(trip.status);

  // Prepare stops data for LiveOpsConsole
  const consoleStops = trip.stops.map((stop, idx) => ({
    type: stop.type,
    location: stop.location,
    sequence: stop.sequence || idx + 1,
  }));

  // Handler for AI Insights Bar actions
  const handleInsightAction = useCallback((actionType: string, insight: Insight) => {
    console.log("AI Insight action triggered:", actionType, insight);
    
    switch (actionType) {
      case "open_rate_modal":
        // TODO: Open rate review modal
        console.log("Opening rate review for trip:", trip.id);
        break;
      case "upload_pod":
      case "upload_bol":
      case "upload_document":
        // TODO: Open document upload modal
        console.log("Opening document upload:", actionType);
        break;
      case "view_driver_hos":
        // TODO: Navigate to driver HOS view
        console.log("Viewing driver HOS");
        break;
      case "view_timing":
      case "view_details":
        console.log("View details action");
        break;
      case "view_lane_history":
        // TODO: Open lane analysis view
        console.log("Viewing lane history");
        break;
      default:
        console.log("Unhandled action type:", actionType);
    }
  }, [trip.id]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════
          STICKY HEADER - Actions + Progress Stepper
      ═══════════════════════════════════════════════════════════════ */}
      <DetailPanelHeader
        title={trip.tripNumber}
        subtitle={`${trip.customer.name} • ${trip.isRounder ? "Rounder" : "One-Way"} • ${trip.totalDistance} mi`}
        status={trip.status}
        statusColor={statusColors[trip.status] || statusColors.Draft}
        actions={
          <>
            {onEdit && (
              <Button size="sm" variant="subtle" onClick={onEdit} className="h-8">
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
            {onDuplicate && (
              <Button size="sm" variant="subtle" onClick={onDuplicate} className="h-8">
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Duplicate
              </Button>
            )}
            {onCancel && trip.status !== "Cancelled" && trip.status !== "Completed" && (
              <Button size="sm" variant="subtle" onClick={onCancel} className="h-8 text-red-400 hover:text-red-300">
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
            )}
          </>
        }
        progressStepper={<ProgressStepper steps={progressSteps} />}
      />

      {/* ═══════════════════════════════════════════════════════════════
          TAB NAVIGATION - Enterprise neutral styling
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1 border-b border-[#1c1c22] bg-[#111114] px-4 pt-2">
        <button
          onClick={() => setActiveTab("details")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2",
            activeTab === "details"
              ? "bg-[#1c1c22] text-[#e8e8ed] border-[#5a6a8a]"
              : "text-[#5a5a6e] border-transparent hover:text-[#a0a0b0] hover:bg-[#1c1c22]/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Trip Details
          </div>
        </button>
        <button
          onClick={() => setActiveTab("operations")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2",
            activeTab === "operations"
              ? "bg-[#1c1c22] text-[#e8e8ed] border-[#5a6a8a]"
              : "text-[#5a5a6e] border-transparent hover:text-[#a0a0b0] hover:bg-[#1c1c22]/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Live Operations
            {/* Keep subtle green for Live system status indicator */}
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5a7a6b] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5a7a6b]"></span>
            </span>
          </div>
        </button>
      </div>

      {activeTab === "details" ? (
      /* ═══════════════════════════════════════════════════════════════
          DETAILS TAB CONTENT - 3-COLUMN GRID
      ═══════════════════════════════════════════════════════════════ */
      <DetailGrid>
        {/* ─────────────────────────────────────────────────────────────
            COLUMN 1: EXECUTION (Itinerary + Timing)
            *** UNIFIED PANEL - Single container with subtle dividers ***
        ───────────────────────────────────────────────────────────── */}
        <GridColumn span={5}>
          <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col">
            
            {/* ══════════════════════════════════════════════════════════════
                ITINERARY SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                    Itinerary
                  </span>
                </div>
                {trip.isRounder && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">
                    Rounder
                  </span>
                )}
              </div>

              {/* Stops */}
              <div className="space-y-3">
                {trip.stops.map((stop, idx) => (
                  <StopRow key={idx} stop={stop} isLast={idx === trip.stops.length - 1} />
                ))}
              </div>

              {/* Distance Breakdown for Rounders */}
              {trip.isRounder && (
                <div className="mt-4 pt-3 border-t border-[#1c1c22] grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-[#5a5a6e]">Deadhead</p>
                    <p className="text-xs font-semibold text-[#a0a0b0]">{trip.deadheadMiles || 0} mi</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5a5a6e]">Linehaul</p>
                    <p className="text-xs font-semibold text-[#e8e8ed]">{trip.linehaulMiles || 0} mi</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5a5a6e]">Return</p>
                    <p className="text-xs font-semibold text-[#a0a0b0]">{trip.returnMiles || 0} mi</p>
                  </div>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade
            ══════════════════════════════════════════════════════════════ */}
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

            {/* ══════════════════════════════════════════════════════════════
                TIMING SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4 flex-1">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                  Timing
                </span>
              </div>

              {/* Timing Rows */}
              <TimingRow
                label="Pickup"
                onTime={trip.onTimePickup}
                scheduled={trip.stops[0]?.scheduledWindow.start}
                actual={trip.actualStart}
              />
              <TimingRow
                label="Delivery"
                onTime={trip.onTimeDelivery}
                scheduled={trip.stops[trip.stops.length > 1 ? 1 : 0]?.scheduledWindow.start}
                actual={trip.completedAt}
              />
            </div>
          </div>
        </GridColumn>

        {/* ─────────────────────────────────────────────────────────────
            COLUMN 2: SPECIFICS (Driver, Unit, Capacity)
            *** UNIFIED PANEL - Single container with subtle dividers ***
        ───────────────────────────────────────────────────────────── */}
        <GridColumn span={4}>
          <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col">
            
            {/* ══════════════════════════════════════════════════════════════
                DRIVER SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <User className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                  Driver
                </span>
              </div>

              {trip.resources.driver.name ? (
                <div className="space-y-1">
                  <p className="text-base font-semibold text-zinc-100">{trip.resources.driver.name}</p>
                  <DataRow label="Type" value={trip.resources.driver.type || "Company"} />
                  <DataRow label="Category" value={trip.resources.driver.category || "Highway"} />
                  {trip.resources.driver.hosRemaining != null && (
                    <DataRow
                      label="HOS Remaining"
                      value={`${trip.resources.driver.hosRemaining}h`}
                      valueClassName={cn(
                        "font-medium",
                        (trip.resources.driver.hosRemaining ?? 0) < 2
                          ? "text-[#b45353]"
                          : (trip.resources.driver.hosRemaining ?? 0) < 4
                          ? "text-[#c97a5a]"
                          : "text-[#a0a0b0]"
                      )}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <XCircle className="h-3.5 w-3.5" />
                  Not Assigned
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade
            ══════════════════════════════════════════════════════════════ */}
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

            {/* ══════════════════════════════════════════════════════════════
                POWER UNIT SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                  Power Unit
                </span>
              </div>

              {trip.resources.powerUnit.number ? (
                <div className="space-y-1">
                  <p className="text-base font-semibold text-zinc-100">{trip.resources.powerUnit.number}</p>
                  <DataRow label="Type" value={trip.resources.powerUnit.type || "Dry Van"} />
                  {trip.resources.powerUnit.plate && (
                    <DataRow label="Plate" value={trip.resources.powerUnit.plate} />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <XCircle className="h-3.5 w-3.5" />
                  Not Assigned
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade
            ══════════════════════════════════════════════════════════════ */}
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

            {/* ══════════════════════════════════════════════════════════════
                CAPACITY SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4 flex-1">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                  Capacity
                </span>
              </div>

              <div className="space-y-2">
                <CapacityBar
                  label="Weight"
                  current={trip.capacity.weight.current}
                  max={trip.capacity.weight.max}
                  unit="lbs"
                />
                <CapacityBar
                  label="Cube"
                  current={trip.capacity.cube.current}
                  max={trip.capacity.cube.max}
                  unit="cf"
                />
                <CapacityBar
                  label="Linear Feet"
                  current={trip.capacity.linearFeet.current}
                  max={trip.capacity.linearFeet.max}
                  unit="ft"
                />
                {trip.capacity.limitingFactor && (
                  <div className="pt-2 border-t border-[#1c1c22]">
                    <span className="text-[10px] text-[#5a5a6e]">Limiting Factor: </span>
                    <span className="text-[10px] text-[#a0a0b0] font-medium">{trip.capacity.limitingFactor}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GridColumn>

        {/* ─────────────────────────────────────────────────────────────
            COLUMN 3: ADMINISTRATIVE (Financials, Docs, Notes)
            *** AI INSIGHTS BAR moved to bottom row ***
        ───────────────────────────────────────────────────────────── */}
        <GridColumn span={3}>
          <div className="flex flex-col h-full">
            
            {/* ══════════════════════════════════════════════════════════════
                ADMINISTRATIVE PANEL (Financials, Docs, Notes)
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col">
            
            {/* ══════════════════════════════════════════════════════════════
                FINANCIALS SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-[#a0a0b0] uppercase tracking-wide">
                  Financials
                </span>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", 
                  trip.financials.marginHealth === "critical" || trip.financials.profit < 0
                    ? "bg-[#b45353]/20 text-[#b45353]" 
                    : "bg-[#2a2a32] text-[#a0a0b0]"
                )}>
                  {trip.financials.marginPct.toFixed(1)}%
                </span>
              </div>

              {/* Revenue / Cost / Profit Row */}
              <div className={cn(
                "grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg transition-colors",
                trip.financials.profit < 0 
                  ? "bg-gradient-to-r from-[#b45353]/10 to-transparent border-l-2 border-[#b45353]" 
                  : "bg-transparent"
              )}>
                <div className="text-center">
                  <p className="text-[10px] text-[#5a5a6e] uppercase tracking-wide mb-1">Revenue</p>
                  <p className="text-base font-bold text-[#e8e8ed] whitespace-nowrap">{formatCurrency(trip.financials.revenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#5a5a6e] uppercase tracking-wide mb-1">Cost</p>
                  <p className="text-base font-bold text-[#e8e8ed] whitespace-nowrap">{formatCurrency(trip.financials.costs.total)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#5a5a6e] uppercase tracking-wide mb-1">Profit</p>
                  <p className={cn(
                    "text-base font-bold whitespace-nowrap",
                    trip.financials.profit < 0 ? "text-[#b45353]" : "text-[#e8e8ed]"
                  )}>
                    {formatCurrency(trip.financials.profit)}
                  </p>
                </div>
              </div>

              {/* Rate Metrics Row */}
              <div className="flex items-center justify-between text-xs pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#5a5a6e]">RPM</span>
                  <span className="text-[#a0a0b0] font-medium">{formatCurrency(trip.financials.rpm)}/mi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#5a5a6e]">CPM</span>
                  <span className="text-[#a0a0b0] font-medium">{formatCurrency(trip.financials.cpm)}/mi</span>
                </div>
                <details>
                  <summary className="text-[10px] text-zinc-500 cursor-pointer hover:text-violet-400 transition-colors">
                    ▸ Breakdown
                  </summary>
                </details>
              </div>

              {/* Cost Breakdown (Expandable) */}
              <details className="group">
                <summary className="sr-only">Cost Breakdown</summary>
                <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-1.5">
                  <DataRow label="Labor" value={formatCurrency(trip.financials.costs.labor)} />
                  <DataRow label="Fuel" value={formatCurrency(trip.financials.costs.fuel)} />
                  <DataRow label="Fixed" value={formatCurrency(trip.financials.costs.fixed)} />
                  <DataRow label="Maintenance" value={formatCurrency(trip.financials.costs.maintenance)} />
                  {trip.financials.costs.events > 0 && (
                    <DataRow label="Events" value={formatCurrency(trip.financials.costs.events)} />
                  )}
                </div>
              </details>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade
            ══════════════════════════════════════════════════════════════ */}
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

            {/* ══════════════════════════════════════════════════════════════
                DOCUMENTS SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide block mb-3">
                Documents
              </span>

              {/* Document Status Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <DocumentPill 
                  label="BOL" 
                  uploaded={trip.documents.bolUploaded} 
                />
                <DocumentPill 
                  label="POD" 
                  uploaded={trip.documents.podUploaded} 
                  required={trip.documents.podRequired}
                />
              </div>

              {/* POD Warning */}
              {!trip.documents.canClose && trip.documents.podRequired && (
                <div className="mt-3 text-[11px] text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  POD required to close this trip
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade (only if notes exist)
            ══════════════════════════════════════════════════════════════ */}
            {trip.notes && trip.notes.length > 0 && (
              <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            )}

            {/* ══════════════════════════════════════════════════════════════
                NOTES SECTION (flex-1 to fill remaining space)
            ══════════════════════════════════════════════════════════════ */}
            {trip.notes && trip.notes.length > 0 && (
              <div className="px-5 py-4 flex-1">
                {/* Section Header with Add action */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
                    Notes
                  </span>
                  <button className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                    + Add
                  </button>
                </div>

                {/* Notes List */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {trip.notes.map((note) => (
                    <div 
                      key={note.id} 
                      className="p-3 rounded-lg bg-[#1c1c22] border-l-2 border-[#3a3a42]"
                    >
                      <p className="text-xs text-[#a0a0b0] leading-relaxed">{note.text}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#5a5a6e]">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#2a2a32] text-[#5a5a6e] text-[8px] font-medium">
                          {note.author?.charAt(0).toUpperCase() || "S"}
                        </span>
                        <span>{note.author}</span>
                        <span>•</span>
                        <span>{note.timestamp ? formatDateTime(note.timestamp) : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spacer when no notes - ensures column 3 stretches to match */}
            {(!trip.notes || trip.notes.length === 0) && (
              <div className="flex-1" />
            )}
          </div>
          </div>
        </GridColumn>

        {/* ══════════════════════════════════════════════════════════════
            AI INSIGHTS BAR - Full Width Bottom Row
        ══════════════════════════════════════════════════════════════ */}
        <div className="col-span-12">
            <AIInsightsBar
              tripId={trip.id}
              tripData={trip}
              onAction={handleInsightAction}
            />
        </div>
      </DetailGrid>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
            OPERATIONS TAB CONTENT - MAP + CONSOLE
        ═══════════════════════════════════════════════════════════════ */
        <div className="flex-1 overflow-hidden p-2 bg-[#111114] flex flex-col min-h-0">
          <div className="grid grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
            {/* Left Side - Map */}
            <div className="col-span-7 rounded-xl border border-[#1c1c22] bg-[#111114] overflow-hidden relative">
              <LiveOpsMap 
                tripId={trip.id}
                tripNumber={trip.tripNumber}
                driverName={trip.resources.driver.name ?? undefined}
                powerUnitNumber={trip.resources.powerUnit.number ?? undefined}
                stops={trip.stops} 
              />
            </div>

            {/* Right Side - Live Operations Console */}
            <div className="col-span-5 overflow-hidden">
              <LiveOpsConsole
                tripId={trip.id}
                tripNumber={trip.tripNumber}
                stops={consoleStops}
                driverName={trip.resources.driver.name ?? undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

function StopRow({ stop, isLast }: { stop: TripStop; isLast: boolean }) {
  const stopColors: Record<string, string> = {
    Pickup: "bg-emerald-500",
    Delivery: "bg-blue-500",
    Deadhead: "bg-zinc-600",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    Completed: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
    "In Progress": <Clock className="h-3 w-3 text-amber-400 animate-pulse" />,
    Pending: <Clock className="h-3 w-3 text-zinc-600" />,
  };

  return (
    <div className="relative">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-zinc-700" />
      )}

      <div className="flex gap-2">
        {/* Stop Marker */}
        <div className={cn(
          "w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0",
          stopColors[stop.type] || stopColors.Deadhead
        )}>
          {stop.sequence}
        </div>

        {/* Stop Details */}
        <div className="flex-1 min-w-0 pb-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-zinc-100">{stop.type}</span>
            {statusIcons[stop.status]}
          </div>

          <div className="flex items-start gap-1 text-[11px] text-zinc-400 mb-1">
            <MapPin className="h-2.5 w-2.5 mt-0.5 text-zinc-500 flex-shrink-0" />
            <span className="truncate">{stop.location}</span>
          </div>

          {/* Time Window */}
          {(stop.scheduledWindow.start || stop.scheduledWindow.end) && (
            <div className="text-[10px] text-zinc-500">
              {stop.scheduledWindow.start ? formatDateTime(stop.scheduledWindow.start) : "Open"}
              {" → "}
              {stop.scheduledWindow.end ? formatDateTime(stop.scheduledWindow.end) : "Open"}
            </div>
          )}

          {/* Cargo Summary */}
          {stop.work.shipmentRef && (
            <div className="mt-1.5 p-1.5 rounded bg-zinc-800/50 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Ref</span>
                <span className="text-zinc-300 font-medium">{stop.work.shipmentRef}</span>
              </div>
              {stop.work.weight > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Weight</span>
                  <span className="text-zinc-300">{stop.work.weight.toLocaleString()} lbs</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimingRow({
  label,
  onTime,
  scheduled,
  actual,
}: {
  label: string;
  onTime: boolean | null | undefined;
  scheduled?: string | null;
  actual?: string | null;
}) {
  // Only show icon for late status
  const icon =
    onTime === false ? (
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#b45353]" />
        <XCircle className="h-3.5 w-3.5 text-[#b45353]" />
      </div>
    ) : (
      <Clock className="h-3.5 w-3.5 text-[#5a5a6e]" />
    );

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-[#a0a0b0]">{label}</span>
      </div>
      <span
        className={cn(
          "text-[10px] font-medium",
          onTime === false ? "text-[#b45353]" : "text-[#a0a0b0]"
        )}
      >
        {onTime === true ? "On Time" : onTime === false ? "Late" : "Pending"}
      </span>
    </div>
  );
}

function DocStatus({
  label,
  uploaded,
  required,
}: {
  label: string;
  uploaded: boolean;
  required?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-zinc-400">{label}</span>
      {uploaded ? (
        <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
          <FileCheck className="h-3 w-3" /> Uploaded
        </span>
      ) : (
        <span
          className={cn(
            "flex items-center gap-1 text-[10px]",
            required ? "text-amber-400" : "text-zinc-500"
          )}
        >
          <FileX className="h-3 w-3" /> {required ? "Required" : "Pending"}
        </span>
      )}
    </div>
  );
}

/**
 * Document Pill - Enterprise neutral style
 * Shows document status as plain text with dot indicator for required
 */
function DocumentPill({
  label,
  uploaded,
  required,
}: {
  label: string;
  uploaded: boolean;
  required?: boolean;
}) {
  if (uploaded) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1c1c22] text-xs text-[#a0a0b0] border border-[#1c1c22]">
        {label}
        <span className="text-[10px] text-[#5a5a6e] font-medium">
          Uploaded
        </span>
      </span>
    );
  }

  // Required documents get critical styling with dot indicator
  if (required) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#b45353]/10 text-xs text-[#b45353] border border-[#b45353]/30">
        <span className="w-1.5 h-1.5 rounded-full bg-[#b45353]" />
        {label}
        <span className="text-[10px] font-medium">
          Required
        </span>
      </span>
    );
  }

  // Pending documents - neutral/muted
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1c1c22] text-xs text-[#a0a0b0] border border-[#1c1c22]">
      {label}
      <span className="text-[10px] text-[#5a5a6e] font-medium">
        Pending
      </span>
    </span>
  );
}

function CapacityBar({
  label,
  current,
  max,
  unit,
}: {
  label: string;
  current: number;
  max: number;
  unit: string;
}) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  // Neutral gray by default, only warning/critical at high capacity
  const color =
    pct >= 95 ? "bg-[#b45353]" : pct >= 85 ? "bg-[#c97a5a]" : "bg-[#3a3a42]";

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-[#5a5a6e]">{label}</span>
        <span className="text-[#a0a0b0]">
          {current.toLocaleString()} / {max.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-1.5 bg-[#1c1c22] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function getProgressSteps(status: string) {
  const allSteps = [
    { label: "New", key: "Draft" },
    { label: "Assigned", key: "Assigned" },
    { label: "Dispatched", key: "Dispatched" },
    { label: "In Transit", key: "In Transit" },
    { label: "Delivered", key: "Delivered" },
    { label: "Completed", key: "Completed" },
  ];

  const currentIndex = allSteps.findIndex((s) => s.key === status || s.label === status);

  return allSteps.map((step, idx) => ({
    label: step.label,
    status:
      idx < currentIndex
        ? ("completed" as const)
        : idx === currentIndex
        ? ("current" as const)
        : ("upcoming" as const),
  }));
}
