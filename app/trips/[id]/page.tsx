"use client";

import { useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Edit,
  FileText,
  Info,
  MessageSquare,
  NotebookPen,
  Package,
  Sparkles,
} from "lucide-react";

import { TripTicket } from "@/components/trips/trip-ticket";
import { DriverCostComparison } from "@/components/trips/driver-cost-comparison";
import { CostingBreakdown } from "@/components/costing/costing-breakdown";
import AIInsights from "@/components/AIInsights";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatChip } from "@/components/stat-chip";
import { fetchTripDetail } from "@/lib/api";
import { getTripInsights } from "@/lib/ai-service";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import { calculateTripCost, type DriverType } from "@/lib/costing";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = params?.id ?? "";
  const [noteText, setNoteText] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.trip(tripId),
    queryFn: () => fetchTripDetail(tripId),
    enabled: Boolean(tripId),
    refetchInterval: 30000,
  });

  const { data: aiInsights, isLoading: aiLoading } = useQuery({
    queryKey: ["tripInsights", tripId],
    queryFn: () => getTripInsights(tripId),
    enabled: Boolean(tripId),
    staleTime: 5 * 60 * 1000,
  });

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    console.log("Adding note:", noteText);
    setNoteText("");
    // TODO: Implement note creation API call and invalidation
    // queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) });
  };

  if (isLoading) {
    return <TripDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-sm text-neutral-500">
        Unable to load trip detail.
      </section>
    );
  }

  const distanceMiles = data.metrics?.distanceMiles ?? aiInsights?.routeOptimization?.distance;
  const activeExceptions = data.exceptions.filter((e) => e.severity === "alert" || e.severity === "warn");

  // Calculate accurate costing if we have distance and driver type
  const driverTypeMap: Record<string, DriverType> = { COM: 'COM', RNR: 'RNR', OO: 'OO' };
  const driverType = driverTypeMap[data.driverType as string] || 'COM';
  const tripCost = distanceMiles 
    ? calculateTripCost(driverType, distanceMiles, data.pickup, data.delivery)
    : null;

  return (
    <div className="space-y-4">
      {/* Header with back button and actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="subtle" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-neutral-200">Trip {data.tripNumber}</h1>
            <p className="text-xs text-neutral-500">ID: {data.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatChip label={data.status} variant="default" />
          {activeExceptions.length > 0 && <StatChip label={`${activeExceptions.length} Exceptions`} variant="alert" />}
          <Button size="sm" variant="primary">
            <Edit className="mr-2 h-4 w-4" /> Update Status
          </Button>
        </div>
      </div>

      {/* Trip ticket spanning all columns */}
      <TripTicket trip={data} aiInsights={aiInsights} />

      {/* Main 3-column layout */}
      <div className="grid gap-4 grid-cols-12">
        {/* LEFT COLUMN - Trip Info + Assignment */}
        <Card className="col-span-12 lg:col-span-3 border-neutral-800/70 bg-neutral-900/60 p-4">
          <div className="space-y-4">
            <div className="border-b border-neutral-800 pb-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
                <Package className="h-4 w-4" /> Assignment
              </div>
              <div className="space-y-2 text-sm">
                <DetailRow label="Driver" value={data.driver} />
                <DetailRow label="Type" value={data.driverType ?? "—"} />
                <DetailRow label="Unit" value={data.unitNumber || data.unit} />
                <DetailRow label="Unit Type" value={data.unitType ?? "—"} />
                <DetailRow label="Order" value={data.tripNumber} />
                <DetailRow 
                  label="Distance" 
                  value={
                    data.metrics?.distanceMiles 
                      ? `${Math.round(data.metrics.distanceMiles)} mi` 
                      : distanceMiles 
                        ? `${Math.round(distanceMiles)} mi`
                        : "—"
                  } 
                />
                <div className="border-t border-neutral-800 pt-2 mt-2">
                  <DetailRow
                    label="Total Cost"
                    value={data.metrics?.totalCost ? formatCurrency(data.metrics.totalCost) : "—"}
                    emphasize
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
                <NotebookPen className="h-4 w-4" /> Insights
              </div>
              <div className="space-y-2 text-xs text-neutral-200">
                <InsightRow
                  icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  text={`${data.driver} offers good value for this freight.`}
                />
                <InsightRow
                  icon={<Info className="h-3.5 w-3.5 text-amber-400" />}
                  text="Cross-border trip; COM/RNR drivers keep margin healthy."
                />
                {typeof distanceMiles === "number" && distanceMiles > 300 && (
                  <InsightRow
                    icon={<AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                    text="Verify route distance – estimate appears high."
                  />
                )}
                {!distanceMiles && (
                  <InsightRow
                    icon={<Info className="h-3.5 w-3.5 text-neutral-400" />}
                    text="Distance calculation pending."
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* MIDDLE COLUMN - Cost Analysis + Network Context */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          {tripCost && distanceMiles && (
            <CostingBreakdown
              driverType={driverType}
              distance={distanceMiles}
              cost={tripCost}
              actualRevenue={data.metrics?.recommendedRevenue}
            />
          )}

          <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-neutral-100">Network Context</p>
                <p className="text-xs text-neutral-500">Exceptions and activity</p>
              </div>
              <Sparkles className="h-4 w-4 text-neutral-500" />
            </div>

            <div className="border-b border-neutral-800 pb-4">

              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Active Exceptions</p>
                  <div className="flex flex-wrap gap-2">
                    {activeExceptions.length === 0 && (
                      <span className="text-xs text-neutral-500">No active exceptions</span>
                    )}
                    {activeExceptions.map((exception) => (
                      <span
                        key={exception.id}
                        className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-semibold ${
                          exception.severity === "alert"
                            ? "border-red-500/40 bg-red-500/10 text-red-200"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                        }`}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {exception.type}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Recent Activity</p>
                  {data.timeline.length === 0 ? (
                    <p className="text-sm text-neutral-500">No timeline events yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.timeline.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between rounded-lg border border-neutral-800/80 bg-neutral-900/50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-neutral-500" />
                            <div>
                              <p className="text-sm text-neutral-200">{event.summary}</p>
                              <p className="text-xs text-neutral-500">{event.location || "Location TBD"}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-neutral-500">{formatDateTime(event.timestamp)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN - AI Insights */}
        <div className="col-span-12 lg:col-span-3">
          <AIInsights type="trip" id={tripId} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, emphasize }: { label: string; value: string | null; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className={`text-right ${emphasize ? "text-neutral-100 font-semibold" : "text-neutral-200"}`}>{value ?? "—"}</span>
    </div>
  );
}

function InsightRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-800/70 bg-neutral-900/50 p-3">
      {icon}
      <p className="text-neutral-200">{text}</p>
    </div>
  );
}

function DollarChip() {
  return (
    <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
      Cost
    </div>
  );
}

function TripDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
      <div className="h-[160px] animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="h-72 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        <div className="h-72 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
      </div>
      <div className="h-[360px] animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
    </div>
  );
}
