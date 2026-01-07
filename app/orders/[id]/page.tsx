"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
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
  MoreHorizontal,
  Package,
  Phone,
  RefreshCw,
  Trash2,
  Truck,
  Upload,
  User,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchOrderDetail, updateOrderStatus } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { OrderDetail } from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════
// STATUS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  New: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  Planning: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  Dispatched: { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  "In Transit": { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  "At Risk": { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  Delivered: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  Completed: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  Exception: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  Invoiced: { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/30" },
  Void: { color: "text-neutral-400", bg: "bg-neutral-500/10", border: "border-neutral-500/30" },
};

const STATUS_OPTIONS = ["New", "Planning", "Dispatched", "In Transit", "At Risk", "Delivered", "Exception", "Completed", "Invoiced", "Void"];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params?.id ?? "";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: Boolean(orderId),
    retry: 2,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => updateOrderStatus(orderId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    },
  });

  if (isLoading) return <OrderDetailSkeleton />;

  if (isError || !data) {
    return (
      <div className="p-6">
        <Card className="border-red-900/50 bg-red-950/10 p-6">
          <div className="flex items-center gap-3 text-red-400 mb-2">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Unable to load order</h3>
          </div>
          <p className="text-sm text-red-300/70 mb-4">
            {error instanceof Error ? error.message : "Order not found or an error occurred."}
          </p>
          <div className="flex gap-2">
            <Button variant="subtle" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
            </Button>
            <Button variant="subtle" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const order = data as OrderDetail & {
    tripId?: string;
    tripNumber?: string;
    driverName?: string;
    unitNumber?: string;
    dispatchStatus?: string;
    equipmentType?: string;
    cost?: number;
    // Enhanced cargo/billing from API
    cargo?: {
      totalWeightLbs?: number;
      totalPallets?: number;
      totalPieces?: number;
      totalCubicFeet?: number;
      totalLinearFeet?: number;
      isHazmat?: boolean;
      isHighValue?: boolean;
      stackable?: boolean;
      declaredValue?: number;
      commodity?: string;
    };
    equipment?: {
      type?: string;
      length?: number;
      temperatureSetting?: string;
    };
    billing?: {
      status?: string;
      quotedRate?: number;
      targetRate?: number;
      marginTargetPct?: number;
      finalBillableAmount?: number;
      billingNotes?: string;
      billingFinalizedAt?: string;
      billingFinalizedBy?: string;
    };
    dispatch?: {
      status?: string;
      assignedDriverId?: string;
      assignedUnitId?: string;
      awardedCarrierId?: string;
    };
    notes?: {
      internal?: string;
      special?: string;
      qualification?: string;
    };
    priority?: string;
    createdAt?: string;
  };

  const statusStyle = statusConfig[order.status] || statusConfig.New;
  // Check if order is in a "locked" state (completed billing flow)
  const lockedStatuses = ["Invoiced", "Void", "Closed", "Completed"];
  const isLocked = lockedStatuses.includes(order.status);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* ═══════════════════════════════════════════════════════════════════
            1. AT-A-GLANCE HEADER (Sticky)
        ═══════════════════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-10 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 -mx-4 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Identity */}
            <div className="flex items-center gap-4">
              <Button variant="subtle" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-neutral-100">{order.reference}</h1>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusStyle.color} ${statusStyle.bg} ${statusStyle.border} border`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {order.customer} • {order.serviceLevel} • {order.lane}
                </p>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-2">
              {!isLocked && (
                <>
                  <Button variant="subtle" size="sm">
                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="subtle" size="sm" className="text-red-400 hover:text-red-300">
                    <XCircle className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </>
              )}
              <Button variant="subtle" size="sm">
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </Button>
              <Button variant="subtle" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status Change Bar (if not locked) */}
          {!isLocked && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-800">
              <span className="text-xs text-neutral-500">Change Status:</span>
              <div className="flex flex-wrap gap-1">
                {STATUS_OPTIONS.filter(s => s !== order.status && s !== "Void").map((status) => (
                  <button
                    key={status}
                    onClick={() => statusMutation.mutate(status)}
                    disabled={statusMutation.isPending}
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      statusConfig[status]?.border || "border-neutral-700"
                    } ${statusConfig[status]?.bg || "bg-neutral-800"} ${
                      statusConfig[status]?.color || "text-neutral-300"
                    } hover:opacity-80 disabled:opacity-50`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLocked && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-800 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">This order is {order.status.toLowerCase()} and locked from editing.</span>
            </div>
          )}
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CONTENT - 3 Column Grid
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* ─────────────────────────────────────────────────────────────────
              LEFT COLUMN - Route & Stops + Execution
          ───────────────────────────────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            
            {/* 2. ROUTE & STOPS */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  Route & Stops
                </h2>
                <a
                  href={`https://www.google.com/maps/dir/${encodeURIComponent(order.snapshot.stops[0]?.location || "")}/${encodeURIComponent(order.snapshot.stops[1]?.location || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> View Map
                </a>
              </div>

              <div className="space-y-4">
                {order.snapshot.stops.map((stop, idx) => (
                  <StopCard key={stop.id} stop={stop} index={idx} isLast={idx === order.snapshot.stops.length - 1} />
                ))}
              </div>

              {/* Lane Summary */}
              <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between text-sm">
                <span className="text-neutral-500">Total Distance</span>
                <span className="text-neutral-200 font-medium">{order.laneMiles} miles</span>
              </div>
            </Card>

            {/* 5. EXECUTION & DISPATCH */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-4">
                <Truck className="h-4 w-4 text-violet-400" />
                Execution & Dispatch
              </h2>

              {order.tripId ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-500">Trip Number</span>
                    <Link href={`/trips/${order.tripId}`} className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
                      {order.tripNumber || "View Trip"} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  {order.driverName && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-500">Driver</span>
                      <span className="text-sm text-neutral-200">{order.driverName}</span>
                    </div>
                  )}
                  {order.unitNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-500">Truck ID</span>
                      <span className="text-sm text-neutral-200">{order.unitNumber}</span>
                    </div>
                  )}
                  
                  {/* Tracking Link */}
                  <div className="pt-3 border-t border-neutral-800">
                    <Button variant="subtle" size="sm" className="w-full justify-center">
                      <Copy className="h-4 w-4 mr-2" /> Copy Tracking Link
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-300 mb-1">Not Yet Dispatched</p>
                  <p className="text-xs text-neutral-500 mb-4">This order has not been assigned to a trip.</p>
                  <Link href="/dispatch">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                      Go to Dispatch Board
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Tracking Updates (simplified) */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-3">
                <RefreshCw className="h-4 w-4 text-cyan-400" />
                Tracking Updates
              </h2>
              <div className="text-sm text-neutral-500 text-center py-4">
                <p>Last known status: <span className="text-neutral-300">{order.status}</span></p>
                <p className="text-xs mt-1">Real-time tracking available when in transit</p>
              </div>
            </Card>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              MIDDLE COLUMN - Cargo + Financials
          ───────────────────────────────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            
            {/* 3. CARGO (The "What") */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-amber-400" />
                Cargo Details
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Commodity</span>
                  <span className="text-neutral-200">{order.cargo?.commodity || order.snapshot.commodity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Equipment</span>
                  <span className="text-neutral-200">{order.equipment?.type || order.equipmentType || "Dry Van"}</span>
                </div>
                {order.equipment?.length && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Length</span>
                    <span className="text-neutral-200">{order.equipment.length} ft</span>
                  </div>
                )}
                {order.equipment?.temperatureSetting && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Temperature</span>
                    <span className="text-neutral-200">{order.equipment.temperatureSetting}</span>
                  </div>
                )}
                
                {/* Hazmat Warning */}
                {order.cargo?.isHazmat && (
                  <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/30">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 text-xs font-semibold">HAZMAT SHIPMENT</span>
                  </div>
                )}

                {/* High Value Warning */}
                {order.cargo?.isHighValue && (
                  <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-amber-400 text-xs font-semibold">HIGH VALUE CARGO</span>
                    {order.cargo.declaredValue && (
                      <span className="text-amber-400 text-xs ml-auto">{formatCurrency(order.cargo.declaredValue)}</span>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Load Details</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-neutral-800/50">
                      <span className="text-neutral-500">Weight</span>
                      <p className="text-neutral-200 font-medium">{order.cargo?.totalWeightLbs ? `${order.cargo.totalWeightLbs.toLocaleString()} lbs` : "—"}</p>
                    </div>
                    <div className="p-2 rounded bg-neutral-800/50">
                      <span className="text-neutral-500">Pallets</span>
                      <p className="text-neutral-200 font-medium">{order.cargo?.totalPallets ?? "—"}</p>
                    </div>
                    <div className="p-2 rounded bg-neutral-800/50">
                      <span className="text-neutral-500">Cube</span>
                      <p className="text-neutral-200 font-medium">{order.cargo?.totalCubicFeet ? `${order.cargo.totalCubicFeet} cu ft` : "—"}</p>
                    </div>
                    <div className="p-2 rounded bg-neutral-800/50">
                      <span className="text-neutral-500">Stackable</span>
                      <p className="text-neutral-200 font-medium">{order.cargo?.stackable === true ? "Yes" : order.cargo?.stackable === false ? "No" : "—"}</p>
                    </div>
                  </div>
                  {(order.cargo?.totalPieces || order.cargo?.totalLinearFeet) && (
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      {order.cargo?.totalPieces && (
                        <div className="p-2 rounded bg-neutral-800/50">
                          <span className="text-neutral-500">Pieces</span>
                          <p className="text-neutral-200 font-medium">{order.cargo.totalPieces}</p>
                        </div>
                      )}
                      {order.cargo?.totalLinearFeet && (
                        <div className="p-2 rounded bg-neutral-800/50">
                          <span className="text-neutral-500">Linear Feet</span>
                          <p className="text-neutral-200 font-medium">{order.cargo.totalLinearFeet} ft</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* 4. FINANCIALS */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Financials
              </h2>

              {/* Revenue Section */}
              <div className="mb-4">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Bill To (Revenue)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Customer</span>
                    <span className="text-neutral-200">{order.customer}</span>
                  </div>
                  {order.pricing.items.map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-neutral-500">{item.label}</span>
                      <span className="text-neutral-200">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-neutral-800">
                    <span className="text-neutral-400 font-medium">Total to Invoice</span>
                    <span className="text-emerald-400 font-bold">{order.cost ? formatCurrency(order.cost) : order.pricing.totals.value}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Status */}
              <div className="p-3 rounded bg-neutral-800/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">Billing Status</p>
                  <p className="text-sm text-neutral-200">{order.billing?.status || (isLocked ? "Invoiced" : "Pending")}</p>
                  {order.billing?.billingFinalizedAt && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Finalized {formatDateTime(order.billing.billingFinalizedAt)}
                      {order.billing.billingFinalizedBy && ` by ${order.billing.billingFinalizedBy}`}
                    </p>
                  )}
                </div>
                {!isLocked && (
                  <Button variant="subtle" size="sm">Create Invoice</Button>
                )}
              </div>
              
              {/* Quoted Rate (if available) */}
              {order.billing?.quotedRate && (
                <div className="mt-3 p-2 rounded bg-neutral-800/50 flex justify-between text-sm">
                  <span className="text-neutral-500">Quoted Rate</span>
                  <span className="text-neutral-200">{formatCurrency(order.billing.quotedRate)}</span>
                </div>
              )}

              {/* Billing Notes */}
              {order.billing?.billingNotes && (
                <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  <span className="font-semibold">Billing Note:</span> {order.billing.billingNotes}
                </div>
              )}

              {/* Cost Section (Admin view) */}
              <div className="mt-4 pt-4 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Cost (Expense)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">{order.pricing.totals.label}</span>
                    <span className="text-red-400">{order.pricing.totals.value}</span>
                  </div>
                  {order.pricing.totals.helper && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Revenue</span>
                      <span className="text-emerald-400">{order.pricing.totals.helper.replace("Revenue ", "")}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT COLUMN - Documents + Notes + Audit
          ───────────────────────────────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* 6. DOCUMENTS (CYA Section) */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-blue-400" />
                Documents
              </h2>

              <div className="space-y-3">
                <DocumentRow label="Bill of Lading (BOL)" uploaded={false} required />
                <DocumentRow label="Proof of Delivery (POD)" uploaded={false} required />
                <DocumentRow label="Rate Confirmation" uploaded={false} />
              </div>

              {/* Drop Zone */}
              <div className="mt-4 border-2 border-dashed border-neutral-700 rounded-lg p-4 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
                <Upload className="h-6 w-6 text-neutral-500 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">Drop files here or click to upload</p>
              </div>

              {/* POD Warning */}
              {order.status === "Delivered" && (
                <div className="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  POD required before marking billable
                </div>
              )}
            </Card>

            {/* INTERNAL NOTES */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                Internal Notes
              </h2>

              {/* Show different note types */}
              {(order.notes?.internal || order.notes?.special || order.notes?.qualification || order.snapshot.notes) ? (
                <div className="space-y-2 mb-3">
                  {order.notes?.internal && (
                    <div className="p-2 rounded bg-neutral-800/50 text-sm text-neutral-300">
                      <span className="text-xs text-neutral-500 block mb-1">Internal Note</span>
                      {order.notes.internal}
                    </div>
                  )}
                  {order.notes?.special && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-sm text-amber-300">
                      <span className="text-xs text-amber-500 block mb-1">Special Instructions</span>
                      {order.notes.special}
                    </div>
                  )}
                  {order.notes?.qualification && (
                    <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300">
                      <span className="text-xs text-blue-500 block mb-1">Qualification Notes</span>
                      {order.notes.qualification}
                    </div>
                  )}
                  {!order.notes?.internal && !order.notes?.special && !order.notes?.qualification && order.snapshot.notes && (
                    <div className="p-2 rounded bg-neutral-800/50 text-sm text-neutral-300">
                      {order.snapshot.notes}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 mb-3">No notes yet</p>
              )}

              <textarea
                placeholder="Add a note..."
                className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <Button variant="subtle" size="sm" className="w-full mt-2">
                Add Note
              </Button>
            </Card>

            {/* AUDIT LOG */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-neutral-400" />
                Audit Log
              </h2>

              <div className="space-y-2 text-xs">
                <AuditEntry
                  action="Order created"
                  timestamp={order.createdAt || new Date(Date.now() - order.ageHours * 3600000).toISOString()}
                  user="System"
                />
                {order.status !== "New" && (
                  <AuditEntry
                    action={`Status changed to ${order.status}`}
                    timestamp={new Date().toISOString()}
                    user="System"
                  />
                )}
                {order.billing?.billingFinalizedAt && (
                  <AuditEntry
                    action="Billing finalized"
                    timestamp={order.billing.billingFinalizedAt}
                    user={order.billing.billingFinalizedBy || "System"}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface Stop {
  id: string;
  type: string;
  location: string;
  windowStart?: string;
  windowEnd?: string;
  instructions?: string;
}

function StopCard({ stop, index, isLast }: { stop: Stop; index: number; isLast: boolean }) {
  const isPickup = stop.type === "Pickup";
  const colorClass = isPickup ? "bg-emerald-500" : "bg-red-500";
  const textClass = isPickup ? "text-emerald-400" : "text-red-400";

  return (
    <div className="relative">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-neutral-700" />
      )}

      <div className="flex gap-3">
        {/* Stop Marker */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${colorClass}`}>
          {index + 1}
        </div>

        {/* Stop Details */}
        <div className="flex-1 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${textClass}`}>{stop.type}</span>
          </div>

          {/* Location with Map Link */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-200 hover:text-blue-400 flex items-start gap-1 mb-2"
          >
            <MapPin className="h-3 w-3 mt-1 text-neutral-500 shrink-0" />
            {stop.location}
          </a>

          {/* Time Window */}
          {(stop.windowStart || stop.windowEnd) && (
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
              <Calendar className="h-3 w-3" />
              <span>
                {stop.windowStart ? formatDateTime(stop.windowStart) : "Open"} 
                {stop.windowEnd ? ` - ${formatDateTime(stop.windowEnd)}` : ""}
              </span>
            </div>
          )}

          {/* Contact (placeholder) */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
            <Phone className="h-3 w-3" />
            <span>Contact: —</span>
          </div>

          {/* Instructions */}
          {stop.instructions && (
            <div className="text-xs bg-neutral-800/50 rounded p-2 text-neutral-400">
              <span className="text-neutral-500">Notes:</span> {stop.instructions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentRow({ label, uploaded, required }: { label: string; uploaded: boolean; required?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-b-0">
      <div className="flex items-center gap-2">
        {uploaded ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <XCircle className="h-4 w-4 text-neutral-500" />
        )}
        <span className="text-sm text-neutral-300">{label}</span>
        {required && !uploaded && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Required</span>
        )}
      </div>
      {uploaded ? (
        <Button variant="subtle" size="sm" className="text-xs h-6 px-2">View</Button>
      ) : (
        <Button variant="subtle" size="sm" className="text-xs h-6 px-2">Upload</Button>
      )}
    </div>
  );
}

function AuditEntry({ action, timestamp, user }: { action: string; timestamp: string; user: string }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-neutral-800 last:border-b-0">
      <Clock className="h-3 w-3 text-neutral-500 mt-0.5" />
      <div className="flex-1">
        <p className="text-neutral-300">{action}</p>
        <p className="text-neutral-500">
          {formatDateTime(timestamp)} • {user}
        </p>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="h-20 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="h-64 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
            <div className="h-40 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="h-48 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
            <div className="h-56 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          </div>
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="h-48 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
            <div className="h-32 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
            <div className="h-24 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
