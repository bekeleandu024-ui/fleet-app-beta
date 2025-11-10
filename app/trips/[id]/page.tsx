"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Activity, FileText, Map as MapIcon } from "lucide-react";

import { StatChip } from "@/components/stat-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchTripDetail } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";

const severityTone: Record<string, "default" | "warn" | "alert"> = {
  info: "default",
  warn: "warn",
  alert: "alert",
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const tripId = params?.id ?? "";
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.trip(tripId),
    queryFn: () => fetchTripDetail(tripId),
    enabled: Boolean(tripId),
  });

  if (isLoading) {
    return <TripDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Unable to load trip detail.
      </section>
    );
  }

  const headerChips = [
    { label: data.status, variant: data.status === "On Time" ? "ok" : data.status === "Running Late" ? "warn" : "alert" },
    { label: data.driver },
    { label: data.unit },
  ];

  return (
    <section className="col-span-12 grid gap-6 lg:grid-cols-12">
      <article className="space-y-6 rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft lg:col-span-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text)]">Trip {data.tripNumber}</h1>
            <p className="text-xs text-muted">ETA {formatDateTime(data.eta)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerChips.map((chip) => (
              <StatChip key={chip.label} label={chip.label} variant={(chip.variant ?? "default") as any} />
            ))}
          </div>
        </header>

        <Tabs defaultValue="timeline" className="grid gap-4">
          <TabsList className="bg-surface-2 text-muted">
            <TabsTrigger value="timeline">
              <Activity className="size-4" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="exceptions">
              <FileText className="size-4" /> Exceptions
            </TabsTrigger>
            <TabsTrigger value="telemetry">
              <MapIcon className="size-4" /> Telemetry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="rounded-xl border border-subtle bg-surface-2 p-4">
            <ul className="space-y-3 text-sm">
              {data.timeline.map((event) => (
                <li key={event.id} className="rounded-xl border border-subtle bg-surface-1 p-3">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{formatDateTime(event.timestamp)}</span>
                    <span>{event.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{event.summary}</p>
                  <p className="text-xs text-muted">{event.location}</p>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="exceptions" className="rounded-xl border border-subtle bg-surface-2 p-4">
            {data.exceptions.length === 0 ? (
              <p className="text-sm text-muted">No active exceptions.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {data.exceptions.map((exception) => (
                  <li key={exception.id} className="rounded-xl border border-subtle bg-surface-1 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text)]">{exception.type}</p>
                        <p className="text-xs text-muted">Opened {formatDateTime(exception.opened)} • {exception.owner}</p>
                      </div>
                      <StatChip label={exception.severity.toUpperCase()} variant={severityTone[exception.severity]} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--text)]">{exception.notes}</p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="telemetry" className="rounded-xl border border-subtle bg-surface-2 p-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-subtle bg-surface-1 px-3 py-2 text-xs text-muted">
                <span>Last ping</span>
                <span>{formatDateTime(data.telemetry.lastPing)}</span>
              </div>
              <div className="rounded-xl border border-dashed border-subtle bg-surface-1 p-6 text-center text-xs text-muted">
                Telemetry map placeholder
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Breadcrumb</h3>
                <ul className="mt-2 space-y-2 text-xs text-muted">
                  {data.telemetry.breadcrumb.map((point) => (
                    <li key={point.id} className="flex items-center justify-between rounded-xl border border-subtle bg-surface-1 px-3 py-2">
                      <span>{formatDateTime(point.timestamp)}</span>
                      <span>{point.location} • {point.speed} mph</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </article>

      <aside className="space-y-6 rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft lg:col-span-4">
        <section>
          <h2 className="text-sm font-semibold text-[var(--text)]">Notes</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {data.notes.map((note) => (
              <li key={note.id} className="rounded-xl border border-subtle bg-surface-2 p-3">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{note.author}</span>
                  <span>{formatDateTime(note.timestamp)}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--text)]">{note.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-[var(--text)]">Attachments</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.attachments.map((file) => (
              <li key={file.id} className="flex items-center justify-between rounded-xl border border-subtle bg-surface-2 px-3 py-2">
                <span>{file.name}</span>
                <span className="text-xs text-muted">{file.size}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </section>
  );
}

function TripDetailSkeleton() {
  return (
    <section className="col-span-12 grid gap-6 lg:grid-cols-12">
      <div className="h-[520px] animate-pulse rounded-xl border border-subtle bg-surface-1 lg:col-span-8" />
      <div className="h-[520px] animate-pulse rounded-xl border border-subtle bg-surface-1 lg:col-span-4" />
    </section>
  );
}
