"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FileX,
  Gauge,
  MapPin,
  Navigation,
  Package,
  Phone,
  Truck,
  User,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchTripDetail } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import { CapacityGauge } from "@/components/trips/capacity-gauge";
import type { TripDetail, TripStop } from "@/lib/types";

// Status badge colors
const statusColors: Record<string, string> = {
  Draft: "bg-zinc-700 text-zinc-200",
  Dispatched: "bg-blue-600/80 text-blue-100",
  "In Transit": "bg-amber-600/80 text-amber-100",
  "At Pickup": "bg-purple-600/80 text-purple-100",
  "At Delivery": "bg-purple-600/80 text-purple-100",
  Completed: "bg-emerald-600/80 text-emerald-100",
  Cancelled: "bg-red-600/80 text-red-100",
  Invoiced: "bg-teal-600/80 text-teal-100",
};

// Margin health colors
const marginColors: Record<string, string> = {
  healthy: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400",
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = params?.id ?? "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.trip(tripId),
    queryFn: () => fetchTripDetail(tripId),
    enabled: Boolean(tripId),
    refetchInterval: 30000,
  });

  if (!tripId || isLoading) {
    return <TripDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6">
          <div className="flex items-center gap-3 text-red-400 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Unable to load trip detail</h3>
          </div>
          <p className="text-sm text-red-300/70">
            {error?.message || "The requested trip could not be found."}
          </p>
          <Button 
            variant="subtle" 
            size="sm" 
            className="mt-4"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const trip = data as TripDetail;

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* ═══════════════════════════════════════════════════════════════════
            HERO HEADER - Trip ID, Status, Distance, ETA
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button size="sm" variant="subtle" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-100">{trip.tripNumber}</h1>
              <p className="text-xs text-neutral-500">
                {trip.customer.name} • {trip.isRounder ? "Rounder" : "One-Way"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusColors[trip.status] || statusColors.Draft}`}>
              {trip.status}
            </span>
            
            <div className="flex items-center gap-4 pl-4 border-l border-neutral-700">
              <div className="text-right">
                <p className="text-xs text-neutral-500">Total Distance</p>
                <p className="text-lg font-semibold text-neutral-100">{trip.totalDistance} mi</p>
              </div>
              {trip.estimatedHours && (
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Est. Time</p>
                  <p className="text-lg font-semibold text-neutral-100">{trip.estimatedHours}h</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN GRID - 3 Column Layout
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid gap-4 grid-cols-12">
          
          {/* ─────────────────────────────────────────────────────────────────
              LEFT COLUMN - Resources (Driver, Unit, Capacity)
          ───────────────────────────────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Driver Card */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-blue-400" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Driver</span>
              </div>
              
              {trip.resources.driver.name ? (
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-neutral-100">{trip.resources.driver.name}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Type</span>
                    <span className="text-neutral-200">{trip.resources.driver.type || "Company"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Category</span>
                    <span className="text-neutral-200">{trip.resources.driver.category || "Highway"}</span>
                  </div>
                  {trip.resources.driver.phone && (
                    <div className="flex items-center gap-2 text-sm pt-2 border-t border-neutral-800">
                      <Phone className="h-3 w-3 text-neutral-500" />
                      <span className="text-neutral-200">{trip.resources.driver.phone}</span>
                    </div>
                  )}
                  {trip.resources.driver.hosRemaining && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-neutral-800">
                      <span className="text-neutral-500">HOS Remaining</span>
                      <span className={`font-medium ${trip.resources.driver.hosRemaining < 2 ? 'text-red-400' : trip.resources.driver.hosRemaining < 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {trip.resources.driver.hosRemaining}h
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-neutral-500">
                  <XCircle className="h-4 w-4" />
                  <span>Not Assigned</span>
                </div>
              )}
            </Card>

            {/* Power Unit Card */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Power Unit</span>
              </div>
              
              {trip.resources.powerUnit.number ? (
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-neutral-100">{trip.resources.powerUnit.number}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Type</span>
                    <span className="text-neutral-200">{trip.resources.powerUnit.type || "Dry Van"}</span>
                  </div>
                  {trip.resources.powerUnit.plate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Plate</span>
                      <span className="text-neutral-200">{trip.resources.powerUnit.plate}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-neutral-500">
                  <XCircle className="h-4 w-4" />
                  <span>Not Assigned</span>
                </div>
              )}
            </Card>

            {/* Capacity Gauge */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="h-4 w-4 text-purple-400" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Capacity</span>
              </div>
              <CapacityGauge 
                currentWeight={trip.capacity.weight.current}
                maxWeight={trip.capacity.weight.max}
                currentCube={trip.capacity.cube.current}
                maxCube={trip.capacity.cube.max}
                currentLinearFeet={trip.capacity.linearFeet.current}
                maxLinearFeet={trip.capacity.linearFeet.max}
                utilizationPercent={trip.capacity.utilizationPct}
                limitingFactor={trip.capacity.limitingFactor}
              />
            </Card>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              MIDDLE COLUMN - Itinerary + Financials
          ───────────────────────────────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            
            {/* Itinerary */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-neutral-200">Itinerary</span>
                {trip.isRounder && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Rounder
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                {trip.stops.map((stop, idx) => (
                  <StopCard key={idx} stop={stop} isLast={idx === trip.stops.length - 1} />
                ))}
              </div>
              
              {/* Distance Breakdown */}
              {trip.isRounder && (
                <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-neutral-500">Deadhead</p>
                    <p className="text-sm font-semibold text-neutral-200">{trip.deadheadMiles || 0} mi</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Linehaul</p>
                    <p className="text-sm font-semibold text-emerald-400">{trip.linehaulMiles || 0} mi</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Return</p>
                    <p className="text-sm font-semibold text-neutral-200">{trip.returnMiles || 0} mi</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Financial P&L */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-neutral-200">P&L Summary</span>
                </div>
                <span className={`text-sm font-bold ${marginColors[trip.financials.marginHealth]}`}>
                  {trip.financials.marginPct.toFixed(1)}% Margin
                </span>
              </div>

              {/* Revenue / Cost / Profit Row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/30">
                  <p className="text-xs text-emerald-400/80">Revenue</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(trip.financials.revenue)}</p>
                  <p className="text-xs text-neutral-500">{formatCurrency(trip.financials.rpm)}/mi</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-950/30 border border-red-800/30">
                  <p className="text-xs text-red-400/80">Total Cost</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(trip.financials.costs.total)}</p>
                  <p className="text-xs text-neutral-500">{formatCurrency(trip.financials.cpm)}/mi</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${trip.financials.isProfitable ? 'bg-emerald-950/30 border-emerald-800/30' : 'bg-red-950/30 border-red-800/30'} border`}>
                  <p className="text-xs text-neutral-400">Profit</p>
                  <p className={`text-xl font-bold ${trip.financials.isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(trip.financials.profit)}
                  </p>
                  <p className={`text-xs ${marginColors[trip.financials.marginHealth]}`}>
                    {trip.financials.isProfitable ? '✓ Profitable' : '✗ Loss'}
                  </p>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 pt-3 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Cost Breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <CostLine label="Labor" value={trip.financials.costs.labor} />
                  <CostLine label="Fuel" value={trip.financials.costs.fuel} />
                  <CostLine label="Fixed (Truck/Ins)" value={trip.financials.costs.fixed} />
                  <CostLine label="Maintenance" value={trip.financials.costs.maintenance} />
                  {trip.financials.costs.events > 0 && (
                    <CostLine label="Events (Border/Stops)" value={trip.financials.costs.events} />
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* ─────────────────────────────────────────────────────────────────
              RIGHT COLUMN - Documents + Timing + Notes
          ───────────────────────────────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Documents */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-blue-400" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Documentation</span>
              </div>
              
              <div className="space-y-3">
                <DocStatus label="Bill of Lading (BOL)" uploaded={trip.documents.bolUploaded} />
                <DocStatus label="Proof of Delivery (POD)" uploaded={trip.documents.podUploaded} required={trip.documents.podRequired} />
              </div>
              
              {!trip.documents.canClose && trip.documents.podRequired && (
                <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  POD required to close trip
                </div>
              )}
            </Card>

            {/* On-Time Performance */}
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-purple-400" />
                <span className="text-xs uppercase tracking-wide text-neutral-500">Timing</span>
              </div>
              
              <div className="space-y-2">
                <TimingRow 
                  label="Pickup" 
                  onTime={trip.onTimePickup} 
                  scheduled={trip.stops[0]?.scheduledWindow.start}
                  actual={trip.actualStart}
                />
                <TimingRow 
                  label="Delivery" 
                  onTime={trip.onTimeDelivery} 
                  scheduled={trip.stops[1]?.scheduledWindow.start}
                  actual={trip.completedAt}
                />
              </div>
            </Card>

            {/* Notes */}
            {trip.notes && trip.notes.length > 0 && (
              <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="h-4 w-4 text-amber-400" />
                  <span className="text-xs uppercase tracking-wide text-neutral-500">Notes</span>
                </div>
                
                <div className="space-y-2">
                  {trip.notes.map((note) => (
                    <div key={note.id} className="p-2 rounded bg-neutral-800/50 text-sm">
                      <p className="text-neutral-200">{note.text}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {note.author} • {note.timestamp ? formatDateTime(note.timestamp) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════════════════

function StopCard({ stop, isLast }: { stop: TripStop; isLast: boolean }) {
  const stopColors: Record<string, string> = {
    Pickup: "bg-emerald-500",
    Delivery: "bg-blue-500",
    Deadhead: "bg-neutral-600",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    Completed: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    "In Progress": <Clock className="h-4 w-4 text-amber-400 animate-pulse" />,
    Pending: <Clock className="h-4 w-4 text-neutral-500" />,
  };

  return (
    <div className="relative">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-neutral-700" />
      )}
      
      <div className="flex gap-3">
        {/* Stop Marker */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${stopColors[stop.type] || stopColors.Deadhead}`}>
          {stop.sequence}
        </div>
        
        {/* Stop Details */}
        <div className="flex-1 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-100">{stop.type}</span>
              {statusIcons[stop.status]}
            </div>
            {stop.work.action && stop.work.action !== "Return to Base" && (
              <span className="text-xs text-neutral-500">{stop.work.action}</span>
            )}
          </div>
          
          <div className="flex items-start gap-1 text-sm text-neutral-300 mb-2">
            <MapPin className="h-3 w-3 mt-1 text-neutral-500 shrink-0" />
            <span>{stop.location}</span>
          </div>
          
          {/* Time Window */}
          {(stop.scheduledWindow.start || stop.scheduledWindow.end) && (
            <div className="text-xs text-neutral-500 mb-2">
              Window: {stop.scheduledWindow.start ? formatDateTime(stop.scheduledWindow.start) : "Open"} 
              {" → "} 
              {stop.scheduledWindow.end ? formatDateTime(stop.scheduledWindow.end) : "Open"}
            </div>
          )}
          
          {/* Cargo Info */}
          {stop.work.shipmentRef && (
            <div className="text-xs bg-neutral-800/50 rounded p-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Shipment</span>
                <span className="text-neutral-300">{stop.work.shipmentRef}</span>
              </div>
              {stop.work.commodity && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Commodity</span>
                  <span className="text-neutral-300">{stop.work.commodity}</span>
                </div>
              )}
              {stop.work.weight > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Weight</span>
                  <span className="text-neutral-300">{stop.work.weight.toLocaleString()} lbs</span>
                </div>
              )}
              {stop.work.pallets > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Pallets</span>
                  <span className="text-neutral-300">{stop.work.pallets}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CostLine({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-200">{formatCurrency(value)}</span>
    </div>
  );
}

function DocStatus({ label, uploaded, required }: { label: string; uploaded: boolean; required?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-300">{label}</span>
      <div className="flex items-center gap-2">
        {uploaded ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs">
            <FileCheck className="h-3 w-3" /> Uploaded
          </span>
        ) : (
          <span className={`flex items-center gap-1 text-xs ${required ? 'text-amber-400' : 'text-neutral-500'}`}>
            <FileX className="h-3 w-3" /> {required ? 'Required' : 'Pending'}
          </span>
        )}
      </div>
    </div>
  );
}

function TimingRow({ label, onTime, scheduled, actual }: { label: string; onTime: boolean | null | undefined; scheduled?: string | null; actual?: string | null }) {
  const icon = onTime === true ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  ) : onTime === false ? (
    <XCircle className="h-4 w-4 text-red-400" />
  ) : (
    <Clock className="h-4 w-4 text-neutral-500" />
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-neutral-300">{label}</span>
      </div>
      <span className={`text-xs ${onTime === true ? 'text-emerald-400' : onTime === false ? 'text-red-400' : 'text-neutral-500'}`}>
        {onTime === true ? "On Time" : onTime === false ? "Late" : "Pending"}
      </span>
    </div>
  );
}

function TripDetailSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-14 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
      <div className="grid gap-4 grid-cols-12">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="h-40 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-32 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-48 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="h-72 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-64 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="h-32 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-24 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
      </div>
    </div>
  );
}
