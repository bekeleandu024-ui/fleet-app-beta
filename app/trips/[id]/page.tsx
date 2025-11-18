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
import { AiTripInsightPanel } from "@/components/trips/ai-trip-insight-panel";
import { DriverCostComparison } from "@/components/trips/driver-cost-comparison";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatChip } from "@/components/stat-chip";
import { fetchTripDetail } from "@/lib/api";
import { getTripInsights } from "@/lib/ai-service";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";

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

  const distanceMiles = aiInsights?.routeOptimization.distance ?? data.metrics?.distanceMiles ?? 120;
  const activeExceptions = data.exceptions.filter((e) => e.severity === "alert" || e.severity === "warn");

  return (
    <div className="space-y-6">
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

      <TripTicket trip={data} aiInsights={aiInsights} />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <AiTripInsightPanel trip={data} aiInsights={aiInsights} loading={aiLoading} />

        <Card className="flex h-full flex-col gap-4 border-neutral-800/70 bg-neutral-900/60 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-100">Network Context</p>
              <p className="text-xs text-neutral-500">Exceptions and recent movement</p>
            </div>
            <Sparkles className="h-4 w-4 text-neutral-500" />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Active Exceptions</p>
            <div className="flex flex-wrap gap-2">
              {activeExceptions.length === 0 && (
                <span className="text-xs text-neutral-500">No active exceptions</span>
              )}
              {activeExceptions.map((exception) => (
                <span
                  key={exception.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                    exception.severity === "alert"
                      ? "border-red-500/40 bg-red-500/10 text-red-200"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {exception.type}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Recent Activity</p>
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
        </Card>
      </div>

      <div className="space-y-4">
        <DriverCostComparison distanceMiles={typeof distanceMiles === "number" ? distanceMiles : Number(distanceMiles)} />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-neutral-800/70 bg-neutral-900/60 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500">
              <NotebookPen className="h-4 w-4" /> Key Insights
            </div>
            <div className="space-y-3 text-sm text-neutral-200">
              <InsightRow
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                text={`${data.driver} is assigned and offers good value for standard freight.`}
              />
              <InsightRow
                icon={<Info className="h-4 w-4 text-amber-400" />}
                text="Short cross-border trip; COM or RNR drivers keep margin healthy."
              />
              {typeof distanceMiles === "number" && distanceMiles > 300 && (
                <InsightRow
                  icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
                  text="Verify route distance – estimate appears high for this lane."
                />
              )}
              {typeof (aiInsights?.costAnalysis.margin ?? data.metrics?.marginPct) === "number" && (
                <InsightRow
                  icon={<Sparkles className="h-4 w-4 text-blue-400" />}
                  text={`Current margin of ${aiInsights?.costAnalysis.margin ?? data.metrics?.marginPct}% is tracking well for this route type.`}
                />
              )}
            </div>
          </Card>

          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-100">Current Assignment</p>
                  <p className="text-xs text-neutral-500">Driver and unit on the load</p>
                </div>
                <Package className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="space-y-2 text-sm text-neutral-200">
                <DetailRow label="Driver" value={aiInsights?.currentAssignment.driver ?? data.driver} />
                <DetailRow label="Driver Type" value={aiInsights?.currentAssignment.driverType ?? data.driverType ?? "—"} />
                <DetailRow label="Unit" value={aiInsights?.currentAssignment.unit ?? data.unit} />
                <DetailRow
                  label="Effective Rate"
                  value={aiInsights?.currentAssignment.effectiveRate ? `${aiInsights.currentAssignment.effectiveRate}/mile` : "—"}
                />
                <DetailRow
                  label="Estimated Driver Cost"
                  value={
                    aiInsights?.currentAssignment.estimatedCost
                      ? formatCurrency(aiInsights.currentAssignment.estimatedCost)
                      : data.metrics?.totalCost
                        ? formatCurrency(data.metrics.totalCost)
                        : "—"
                  }
                />
              </div>
            </Card>

            <Card className="border-neutral-800/70 bg-neutral-900/60 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-100">Cost Analysis</p>
                  <p className="text-xs text-neutral-500">Trip-level costs and recommended revenue</p>
                </div>
                <DollarChip />
              </div>
              <div className="space-y-2 text-sm text-neutral-200">
                <DetailRow
                  label="Linehaul Cost"
                  value={formatCurrency(aiInsights?.costAnalysis.linehaulCost ?? data.metrics?.linehaul ?? null)}
                />
                <DetailRow
                  label="Fuel Cost"
                  value={formatCurrency(aiInsights?.costAnalysis.fuelCost ?? data.metrics?.fuel ?? null)}
                />
                <DetailRow
                  label="Driver Cost"
                  value={formatCurrency(aiInsights?.costAnalysis.driverCost ?? null)}
                />
                <div className="border-t border-neutral-800 pt-2">
                  <DetailRow
                    label="Total Cost"
                    value={formatCurrency(aiInsights?.costAnalysis.totalCost ?? data.metrics?.totalCost ?? null)}
                    emphasize
                  />
                </div>
                <DetailRow
                  label="Recommended Revenue"
                  value={formatCurrency(aiInsights?.costAnalysis.recommendedRevenue ?? data.metrics?.recommendedRevenue ?? null)}
                />
                <DetailRow
                  label="Margin"
                  value={
                    aiInsights?.costAnalysis.margin !== undefined
                      ? `${aiInsights.costAnalysis.margin}%`
                      : data.metrics?.marginPct !== undefined
                        ? `${data.metrics.marginPct}%`
                        : "—"
                  }
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-neutral-800/70 bg-neutral-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-100">Notes</p>
            <MessageSquare className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="space-y-3">
            <textarea
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500"
              rows={3}
              placeholder="Add a note about this trip..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button size="sm" variant="primary" className="w-full" disabled={!noteText.trim()} onClick={handleAddNote}>
              <MessageSquare className="mr-2 h-4 w-4" /> Add Note
            </Button>
            <div className="space-y-2">
              {data.notes.length === 0 ? (
                <p className="text-xs text-neutral-500">No notes yet</p>
              ) : (
                data.notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-neutral-800/70 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-200"
                  >
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="font-medium">{note.author}</span>
                      <span>{formatDateTime(note.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-neutral-200">{note.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="border-neutral-800/70 bg-neutral-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-100">Attachments</p>
            <FileText className="h-4 w-4 text-neutral-500" />
          </div>
          {data.attachments.length === 0 ? (
            <div className="text-center">
              <p className="text-sm text-neutral-500">No attachments</p>
              <Button size="sm" variant="subtle" className="mt-2">
                Upload File
              </Button>
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.attachments.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-800/70 bg-neutral-900/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-neutral-500" />
                    <span className="text-neutral-200">{file.name}</span>
                  </div>
                  <span className="text-xs text-neutral-500">{file.size}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
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
