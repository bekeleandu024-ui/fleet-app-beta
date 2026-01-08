"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  Edit2,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DetailPanelHeader,
  DetailGrid,
  GridColumn,
  SectionCard,
  DataRow,
  ProgressStepper,
} from "./master-detail-layout";
import type { OrderDetail } from "@/lib/types";

// Status badge colors - Enterprise neutral with color-as-exception
const statusColors: Record<string, string> = {
  New: "bg-[#2a2a32] text-[#a0a0b0]",
  Planning: "bg-[#2a2a32] text-[#a0a0b0]",
  Dispatched: "bg-[#2a2a32] text-[#a0a0b0]",
  "In Transit": "bg-[#2a2a32] text-[#a0a0b0]",
  "At Risk": "bg-[#b45353]/20 text-[#b45353]",
  Delivered: "bg-[#2a2a32] text-[#a0a0b0]",
  Completed: "bg-[#2a2a32] text-[#a0a0b0]",
  Exception: "bg-[#b45353]/20 text-[#b45353]",
  Invoiced: "bg-[#2a2a32] text-[#a0a0b0]",
  Void: "bg-[#1c1c22] text-[#5a5a6e]",
  "Fleet Assigned": "bg-[#2a2a32] text-[#a0a0b0]",
  "Brokerage": "bg-[#2a2a32] text-[#a0a0b0]",
  "Ready to Book": "bg-[#2a2a32] text-[#a0a0b0]",
};

// Extended order type with optional properties from various API responses
interface ExtendedOrder extends OrderDetail {
  tripId?: string;
  tripNumber?: string;
  driverName?: string;
  unitNumber?: string;
  commodity?: string;
  weight?: number;
  equipmentType?: string;
  rate?: number;
  linehaul?: number;
  cost?: number;
  customerContact?: string;
  customerPhone?: string;
  cargo?: {
    totalWeightLbs?: number;
    totalPallets?: number;
    totalPieces?: number;
    totalCubicFeet?: number;
    totalLinearFeet?: number;
    isHazmat?: boolean;
    commodity?: string;
  };
  billing?: {
    quotedRate?: number;
    targetRate?: number;
    marginTargetPct?: number;
  };
  notes?: {
    internal?: string;
    special?: string;
  };
}

interface OrderDetailPanelProps {
  order: ExtendedOrder;
  onEdit?: () => void;
  onCancel?: () => void;
  onDuplicate?: () => void;
}

/**
 * Order Detail Panel for Master-Detail Layout
 * 3-Column Grid:
 * - Col 1 (Execution): Route & Stops
 * - Col 2 (Specifics): Cargo Details, Equipment
 * - Col 3 (Administrative): Financials, Dispatch Status
 */
export function OrderDetailPanel({
  order,
  onEdit,
  onCancel,
  onDuplicate,
}: OrderDetailPanelProps) {
  const progressSteps = getOrderProgressSteps(order.status);
  const isLocked = ["Invoiced", "Void", "Completed", "Closed"].includes(order.status);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════
          STICKY HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <DetailPanelHeader
        title={order.reference}
        subtitle={`${order.customer} • ${order.serviceLevel || "Standard"} • ${order.lane}`}
        status={order.status}
        statusColor={statusColors[order.status] || statusColors.New}
        actions={
          <>
            {!isLocked && onEdit && (
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
            {!isLocked && onCancel && (
              <Button size="sm" variant="subtle" onClick={onCancel} className="h-8 text-red-400 hover:text-red-300">
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Cancel
              </Button>
            )}
          </>
        }
        progressStepper={<ProgressStepper steps={progressSteps} />}
      />

      {/* Locked Warning */}
      {isLocked && (
        <div className="flex-none px-4 py-2 bg-[#c97a5a]/10 border-b border-[#c97a5a]/30 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[#c97a5a]" />
          <span className="text-xs text-[#c97a5a]">
            This order is {order.status.toLowerCase()} and locked from editing.
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3-COLUMN GRID CONTENT - UNIFIED PANEL DESIGN
      ═══════════════════════════════════════════════════════════════ */}
      <DetailGrid>
        {/* ─────────────────────────────────────────────────────────────
            COLUMN 1: EXECUTION (Route & Stops + Timing - UNIFIED PANEL)
        ───────────────────────────────────────────────────────────── */}
        <GridColumn span={5}>
          <div className="flex-1 rounded-lg border border-[#1c1c22] bg-[#111114] overflow-hidden flex flex-col">
            
            {/* ══════════════════════════════════════════════════════════════
                ROUTE & STOPS SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#5a5a6e]" />
                  <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                    Route & Stops
                  </span>
                </div>
                {order.snapshot?.stops && order.snapshot.stops.length >= 2 && (
                  <a
                    href={`https://www.google.com/maps/dir/${encodeURIComponent(order.snapshot.stops[0]?.location || "")}/${encodeURIComponent(order.snapshot.stops[1]?.location || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#5a6a8a] hover:text-[#7a8aaa] flex items-center gap-0.5"
                  >
                    <ExternalLink className="h-2.5 w-2.5" /> Map
                  </a>
                )}
              </div>

              {/* Stops */}
              <div className="space-y-3">
                {order.snapshot?.stops?.map((stop, idx) => (
                  <StopRow
                    key={stop.id}
                    stop={stop}
                    index={idx}
                    isLast={idx === (order.snapshot?.stops?.length || 1) - 1}
                  />
                ))}
              </div>

              {/* Lane Summary */}
              <div className="mt-4 pt-3 border-t border-[#1c1c22] flex justify-between items-center">
                <span className="text-xs text-[#5a5a6e]">Total Distance</span>
                <span className="text-xs text-[#a0a0b0] font-medium">{order.laneMiles} mi</span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade
            ══════════════════════════════════════════════════════════════ */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a32] to-transparent" />

            {/* ══════════════════════════════════════════════════════════════
                TIMING SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4 flex-1">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-[#5a5a6e]" />
                <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                  Timing
                </span>
              </div>

              {/* Timing Rows */}
              {order.snapshot?.stops?.map((stop, idx) => (
                <div key={stop.id} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-[#5a5a6e]">{stop.type}</span>
                  <span className="text-xs text-[#a0a0b0]">
                    {stop.windowStart
                      ? formatDateTime(stop.windowStart)
                      : "TBD"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GridColumn>

        {/* ─────────────────────────────────────────────────────────────
            COLUMN 2: SPECIFICS (Cargo + Equipment + Dispatch - UNIFIED PANEL)
        ───────────────────────────────────────────────────────────── */}
        <GridColumn span={4}>
          <div className="flex-1 rounded-lg border border-[#1c1c22] bg-[#111114] overflow-hidden flex flex-col">
            
            {/* ══════════════════════════════════════════════════════════════
                CARGO SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-3.5 w-3.5 text-[#5a5a6e]" />
                <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                  Cargo
                </span>
              </div>

              <DataRow
                label="Commodity"
                value={order.cargo?.commodity || order.commodity || "General Freight"}
              />
              <DataRow
                label="Weight"
                value={`${(order.cargo?.totalWeightLbs || order.weight || 0).toLocaleString()} lbs`}
              />
              {order.cargo?.totalPallets !== undefined && order.cargo.totalPallets > 0 && (
                <DataRow label="Pallets" value={order.cargo.totalPallets} />
              )}
              {order.cargo?.totalPieces !== undefined && order.cargo.totalPieces > 0 && (
                <DataRow label="Pieces" value={order.cargo.totalPieces} />
              )}
              {order.cargo?.totalLinearFeet !== undefined && order.cargo.totalLinearFeet > 0 && (
                <DataRow label="Linear Feet" value={`${order.cargo.totalLinearFeet} ft`} />
              )}
              {order.cargo?.isHazmat && (
                <div className="mt-2 p-2 bg-[#b45353]/20 border border-[#b45353]/30 rounded text-xs text-[#b45353] flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Hazmat Load
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade
            ══════════════════════════════════════════════════════════════ */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a32] to-transparent" />

            {/* ══════════════════════════════════════════════════════════════
                EQUIPMENT SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-3.5 w-3.5 text-[#5a5a6e]" />
                <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                  Equipment
                </span>
              </div>

              <DataRow
                label="Type"
                value={order.equipmentType || "Dry Van"}
              />
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade
            ══════════════════════════════════════════════════════════════ */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a32] to-transparent" />

            {/* ══════════════════════════════════════════════════════════════
                DISPATCH SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4 flex-1">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-3.5 w-3.5 text-[#5a5a6e]" />
                <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                  Dispatch
                </span>
              </div>

              {order.tripId ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-[#5a5a6e]">Trip</span>
                    <Link
                      href={`/trips/master?id=${order.tripId}`}
                      className="text-xs text-[#5a6a8a] hover:text-[#7a8aaa] flex items-center gap-1"
                    >
                      {order.tripNumber || order.tripId.slice(0, 8)}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                  {order.driverName && (
                    <DataRow label="Driver" value={order.driverName} />
                  )}
                  {order.unitNumber && (
                    <DataRow label="Unit" value={order.unitNumber} />
                  )}
                </div>
              ) : (
                <div className="text-xs text-[#5a5a6e] flex items-center gap-1.5 py-2">
                  <XCircle className="h-3.5 w-3.5" />
                  Not dispatched
                </div>
              )}
            </div>
          </div>
        </GridColumn>

        {/* ─────────────────────────────────────────────────────────────
            COLUMN 3: ADMINISTRATIVE (Financials + Customer - UNIFIED PANEL)
            *** CRITICAL: Must be visible without scrolling ***
        ───────────────────────────────────────────────────────────── */}
        <GridColumn span={3}>
          <div className="flex-1 rounded-lg border border-[#1c1c22] bg-[#111114] overflow-hidden flex flex-col">
            
            {/* ══════════════════════════════════════════════════════════════
                FINANCIALS SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-[#5a5a6e]" />
                  <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                    Financials
                  </span>
                </div>
                {order.billing?.marginTargetPct !== undefined && (
                  <span className="text-xs font-bold text-[#a0a0b0]">
                    {order.billing.marginTargetPct.toFixed(0)}% Target
                  </span>
                )}
              </div>

              {/* Revenue */}
              <div className="text-center p-3 mb-3 rounded bg-[#1c1c22]">
                <p className="text-[10px] text-[#5a5a6e] mb-0.5">Quoted Rate</p>
                <p className="text-lg font-bold text-[#e8e8ed]">
                  {formatCurrency(order.billing?.quotedRate || order.rate || 0)}
                </p>
                {order.laneMiles > 0 && (
                  <p className="text-[10px] text-[#5a5a6e]">
                    {formatCurrency((order.billing?.quotedRate || order.rate || 0) / order.laneMiles)}/mi
                  </p>
                )}
              </div>

              {/* Target Rate */}
              {order.billing?.targetRate !== undefined && (
                <DataRow
                  label="Target Rate"
                  value={formatCurrency(order.billing.targetRate)}
                />
              )}

              {/* Linehaul */}
              {order.linehaul !== undefined && (
                <DataRow
                  label="Linehaul"
                  value={formatCurrency(order.linehaul)}
                />
              )}

              {/* Estimated Cost */}
              {order.cost !== undefined && (
                <DataRow
                  label="Est. Cost"
                  value={formatCurrency(order.cost)}
                  valueClassName="text-[#a0a0b0]"
                />
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                SUBTLE DIVIDER - Gradient fade
            ══════════════════════════════════════════════════════════════ */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a32] to-transparent" />

            {/* ══════════════════════════════════════════════════════════════
                CUSTOMER SECTION
            ══════════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4 flex-1">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-3">
                <User className="h-3.5 w-3.5 text-[#5a5a6e]" />
                <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                  Customer
                </span>
              </div>

              <p className="text-sm font-medium text-[#e8e8ed] mb-2">{order.customer}</p>
              {order.customerContact && (
                <DataRow label="Contact" value={order.customerContact} />
              )}
              {order.customerPhone && (
                <div className="flex items-center gap-1.5 text-xs text-[#a0a0b0] mt-1">
                  <Phone className="h-3 w-3" />
                  <span>{order.customerPhone}</span>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                NOTES SECTION (if exists)
            ══════════════════════════════════════════════════════════════ */}
            {(order.notes?.internal || order.notes?.special) && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-[#2a2a32] to-transparent" />
                <div className="px-5 py-4">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-3.5 w-3.5 text-[#5a5a6e]" />
                    <span className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider">
                      Notes
                    </span>
                  </div>

                  {order.notes.special && (
                    <div className="mb-2">
                      <p className="text-[10px] text-[#c97a5a] mb-0.5">Special Instructions</p>
                      <p className="text-xs text-[#a0a0b0]">{order.notes.special}</p>
                    </div>
                  )}
                  {order.notes.internal && (
                    <div>
                      <p className="text-[10px] text-[#5a5a6e] mb-0.5">Internal Notes</p>
                      <p className="text-xs text-[#a0a0b0]">{order.notes.internal}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </GridColumn>
      </DetailGrid>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

interface StopData {
  id: string;
  type: string;
  location: string;
  facilityName?: string;
  scheduledWindowStart?: string;
  scheduledWindowEnd?: string;
  status?: string;
}

function StopRow({
  stop,
  index,
  isLast,
}: {
  stop: StopData;
  index: number;
  isLast: boolean;
}) {
  const statusIcons: Record<string, React.ReactNode> = {
    Completed: <CheckCircle2 className="h-3 w-3 text-[#5a5a6e]" />,
    "In Progress": <Clock className="h-3 w-3 text-[#c97a5a] animate-pulse" />,
    Pending: <Clock className="h-3 w-3 text-[#5a5a6e]" />,
  };

  return (
    <div className="relative">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-[#2a2a32]" />
      )}

      <div className="flex gap-2">
        {/* Stop Marker - Enterprise neutral gray */}
        <div
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 bg-[#2a2a32] border border-[#3a3a42] text-[#a0a0b0]"
        >
          {index + 1}
        </div>

        {/* Stop Details */}
        <div className="flex-1 min-w-0 pb-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-[#e8e8ed]">{stop.type}</span>
            {stop.status && statusIcons[stop.status]}
          </div>

          {stop.facilityName && (
            <p className="text-xs text-[#a0a0b0] mb-0.5">{stop.facilityName}</p>
          )}

          <div className="flex items-start gap-1 text-[11px] text-[#a0a0b0]">
            <MapPin className="h-2.5 w-2.5 mt-0.5 text-[#5a5a6e] flex-shrink-0" />
            <span className="truncate">{stop.location}</span>
          </div>

          {/* Time Window */}
          {stop.scheduledWindowStart && (
            <div className="text-[10px] text-[#5a5a6e] mt-1 flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {formatDateTime(stop.scheduledWindowStart)}
              {stop.scheduledWindowEnd && ` - ${formatDateTime(stop.scheduledWindowEnd)}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getOrderProgressSteps(status: string) {
  const allSteps = [
    { label: "New", key: "New" },
    { label: "Planning", key: "Planning" },
    { label: "Dispatched", key: "Dispatched" },
    { label: "In Transit", key: "In Transit" },
    { label: "Delivered", key: "Delivered" },
    { label: "Completed", key: "Completed" },
  ];

  const currentIndex = allSteps.findIndex(
    (s) => s.key === status || s.label === status
  );

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
