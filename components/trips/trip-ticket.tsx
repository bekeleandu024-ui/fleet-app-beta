import type { ReactNode } from "react";
import { Clock, DollarSign, Map as MapIcon, Route, Truck, User } from "lucide-react";
import type { TripDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatChip } from "@/components/stat-chip";
import { formatDateTime, formatDurationHours } from "@/lib/format";
import type { getTripInsights } from "@/lib/ai-service";

const statusVariant: Record<string, "default" | "warn" | "alert" | "ok"> = {
  planned: "default",
  assigned: "default",
  in_transit: "warn",
  completed: "ok",
};

type TripInsights = Awaited<ReturnType<typeof getTripInsights>>;

interface TripTicketProps {
  trip: TripDetail;
  aiInsights?: TripInsights | null;
}

function formatWindow(start?: string, end?: string) {
  if (!start && !end) return "—";
  if (start && end) {
    return `${formatDateTime(start)} – ${formatDateTime(end)}`;
  }
  return start ? formatDateTime(start) : formatDateTime(end ?? "");
}

function buildLane(pickup?: string, delivery?: string) {
  if (pickup && delivery) return `${pickup} → ${delivery}`;
  if (pickup) return `${pickup} → Destination TBD`;
  if (delivery) return `Origin TBD → ${delivery}`;
  return "Lane details coming soon";
}

function getStatusVariant(status: string) {
  const key = status.toLowerCase().replace(" ", "_");
  return statusVariant[key] ?? "default";
}

export function TripTicket({ trip, aiInsights }: TripTicketProps) {
  const shortId = trip.tripNumber ?? trip.id?.slice(-6);
  const laneLabel = buildLane(trip.pickup, trip.delivery);
  
  // ALWAYS use real calculated distance from database first (distance_miles column)
  // Only falls back to AI insights if database value is missing
  const distance = trip.metrics?.distanceMiles ?? aiInsights?.routeOptimization.distance;
  const durationHours =
    trip.metrics?.estDurationHours ?? 
    (typeof aiInsights?.routeOptimization.duration === "string"
      ? Number.parseFloat(aiInsights.routeOptimization.duration)
      : undefined);
  const margin = trip.metrics?.marginPct ?? aiInsights?.costAnalysis.margin;
  
  // Check if distance is from real calculation (has value and is reasonable)
  const hasRealDistance = distance != null && distance > 0;

  return (
    <Card className="p-6 border-neutral-800/80 bg-neutral-900/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold text-neutral-100">Trip {shortId}</h1>
            <StatChip label={trip.status.toUpperCase()} variant={getStatusVariant(trip.status)} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300">
            <Route className="h-4 w-4 text-neutral-500" />
            <span className="font-medium text-neutral-100">{laneLabel}</span>
          </div>
          <div className="grid gap-2 text-sm text-neutral-300 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <ClockBadge />
              <div>
                <p className="text-xs text-neutral-500">Pickup window</p>
                <p className="font-medium text-neutral-100">
                  {formatWindow(trip.pickupWindowStart, trip.pickupWindowEnd)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ClockBadge />
              <div>
                <p className="text-xs text-neutral-500">Delivery window</p>
                <p className="font-medium text-neutral-100">
                  {formatWindow(trip.deliveryWindowStart, trip.deliveryWindowEnd || trip.eta)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-emerald-400">
            {trip.onTimePickup && (
              <span className="rounded-full bg-emerald-500/10 px-3 py-1">On-time pickup</span>
            )}
            {trip.onTimeDelivery && (
              <span className="rounded-full bg-emerald-500/10 px-3 py-1">On-time delivery</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[280px]">
          <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/60 p-3 text-sm text-neutral-200">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
              <User className="h-4 w-4" /> Driver & Unit
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-neutral-500" />
                <span className="font-medium">{trip.driver}</span>
                {trip.driverType && (
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">{trip.driverType}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-neutral-500" />
                <span className="font-medium">{trip.unit}</span>
                {trip.unitType && (
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">{trip.unitType}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button size="sm" variant="subtle" onClick={() => {/* TODO: wire status update */}}>
              Update Status
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {/* TODO: view order */}}>
              View Order
            </Button>
            <Button size="sm" variant="primary" onClick={() => {/* TODO: view on map */}}>
              <MapIcon className="mr-2 h-4 w-4" /> View on Map
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-400">
        {distance && hasRealDistance ? (
          <Badge label={`~${Math.round(distance)} mi`} icon={<Route className="h-3.5 w-3.5" />} />
        ) : !hasRealDistance ? (
          <Badge 
            label="Distance pending" 
            icon={<Route className="h-3.5 w-3.5 text-amber-500" />} 
          />
        ) : null}
        {durationHours ? (
          <Badge label={formatDurationHours(durationHours)} icon={<ClockBadge />} />
        ) : null}
        {margin !== undefined ? <Badge label={`${margin}% margin`} icon={<DollarBadge />} /> : null}
      </div>
    </Card>
  );
}

function Badge({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1 text-xs font-medium text-neutral-200">
      {icon}
      {label}
    </span>
  );
}

function ClockBadge() {
  return <Clock className="h-3.5 w-3.5 text-neutral-500" />;
}

function DollarBadge() {
  return <DollarSign className="h-3.5 w-3.5 text-neutral-500" />;
}
