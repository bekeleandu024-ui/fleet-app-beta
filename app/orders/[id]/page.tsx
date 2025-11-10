"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Gauge } from "lucide-react";

import { RecommendationCallout } from "@/components/recommendation-callout";
import { StatChip } from "@/components/stat-chip";
import { Button } from "@/components/ui/button";
import { fetchOrderDetail } from "@/lib/api";
import { formatDateTime, formatDurationHours } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { OrderDetail } from "@/lib/types";

const statusVariant: Record<string, "default" | "ok" | "warn" | "alert"> = {
  "In Transit": "ok",
  "Delivered": "default",
  "Planning": "default",
  "New": "default",
  "Exception": "alert",
  "At Risk": "warn",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: Boolean(orderId),
  });

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Unable to load order.
      </section>
    );
  }

  const headerChips = [
    { label: data.status, variant: statusVariant[data.status] ?? "default" },
    { label: `${formatDurationHours(data.ageHours)} old` },
    { label: `${data.laneMiles} lane mi` },
  ];

  return (
    <>
      <header className="col-span-12 rounded-xl border border-subtle bg-surface-1 px-4 py-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[var(--text)]">Order {data.id}</h1>
            <p className="text-xs text-muted">{data.lane}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerChips.map((chip) => (
              <StatChip key={chip.label} label={chip.label} variant={chip.variant ?? "default"} />
            ))}
          </div>
        </div>
      </header>

      <section className="col-span-12 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <article className="rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Order Snapshot</h2>
              <span className="flex items-center gap-2 text-xs text-muted">
                <CalendarClock className="size-4" />
                Updated {formatDateTime(data.snapshot.stops[0]?.windowStart ?? new Date().toISOString())}
              </span>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <p className="text-muted">Customer</p>
                <p className="font-semibold text-[var(--text)]">{data.customer}</p>
                <p className="text-muted">Service Level</p>
                <p className="font-semibold text-[var(--text)]">{data.serviceLevel}</p>
                <p className="text-muted">Commodity</p>
                <p className="font-semibold text-[var(--text)]">{data.snapshot.commodity}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted">Windows</p>
                <ul className="space-y-1 text-[var(--text)]">
                  {data.snapshot.windows.map((window) => (
                    <li key={window.label} className="flex items-center justify-between">
                      <span>{window.label}</span>
                      <span className="text-xs text-muted">{window.value}</span>
                    </li>
                  ))}
                </ul>
                {data.snapshot.notes ? (
                  <p className="mt-2 text-xs text-muted">{data.snapshot.notes}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Stops</h3>
              <ul className="space-y-2">
                {data.snapshot.stops.map((stop) => (
                  <li key={stop.id} className="rounded-xl border border-subtle bg-surface-2 p-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
                      <span>{stop.type}</span>
                      <span>
                        {new Date(stop.windowStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
                        {" "}
                        {new Date(stop.windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text)]">{stop.location}</p>
                    {stop.instructions ? (
                      <p className="mt-1 text-xs text-muted">{stop.instructions}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Pricing & Cost</h2>
              <span className="flex items-center gap-2 text-xs text-muted">
                <Gauge className="size-4" /> Pricing engine synced
              </span>
            </header>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              {data.pricing.items.map((item) => (
                <div key={item.label} className="rounded-xl border border-subtle bg-surface-2 p-3">
                  <dt className="text-xs uppercase tracking-wide text-muted">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-[var(--text)]">{item.value}</dd>
                  {item.helper ? <p className="text-xs text-muted">{item.helper}</p> : null}
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-subtle bg-surface-2 px-4 py-3 text-sm font-semibold text-[var(--text)]">
              <span>{data.pricing.totals.label}</span>
              <span>{data.pricing.totals.value}</span>
            </div>
            {data.pricing.totals.helper ? (
              <p className="mt-2 text-xs text-muted">{data.pricing.totals.helper}</p>
            ) : null}
          </article>
        </div>

        <aside className="lg:col-span-5 space-y-6">
          <RecommendationCallout
            title="Guardrail summary"
            description="Key constraints enforced before booking."
            bullets={data.booking.guardrails}
          />
          <article className="rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft">
            <header className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text)]">Booking Console</h2>
              <p className="text-xs text-muted">Pair qualified driver and equipment, then commit.</p>
            </header>
            <form className="grid gap-4 text-sm">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-muted">Driver</span>
                <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]" defaultValue={data.booking.recommendedDriverId}>
                  {data.booking.driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} • {driver.status} ({driver.hoursAvailable}h)
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-muted">Unit</span>
                <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]" defaultValue={data.booking.recommendedUnitId}>
                  {data.booking.unitOptions.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.id} • {unit.type} ({unit.status})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-muted">Update Status</span>
                <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]" defaultValue={data.status}>
                  {data.booking.statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-muted">Notes</span>
                <textarea
                  rows={3}
                  className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
                  placeholder="Add dispatcher notes"
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl border border-subtle bg-surface-2 text-xs uppercase tracking-wide text-[var(--text)]"
                >
                  Calculate Cost
                </Button>
                <Button type="button" className="rounded-xl bg-[var(--brand)] text-xs uppercase tracking-wide text-black">
                  Book Trip
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl border border-subtle bg-surface-2 text-xs uppercase tracking-wide text-[var(--text)]"
                >
                  Update Status
                </Button>
              </div>
            </form>
          </article>
        </aside>
      </section>
    </>
  );
}

function OrderDetailSkeleton() {
  return (
    <>
      <header className="col-span-12 h-24 animate-pulse rounded-xl border border-subtle bg-surface-1" />
      <section className="col-span-12 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="h-64 animate-pulse rounded-xl border border-subtle bg-surface-1" />
          <div className="h-56 animate-pulse rounded-xl border border-subtle bg-surface-1" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="h-28 animate-pulse rounded-xl border border-subtle bg-surface-1" />
          <div className="h-72 animate-pulse rounded-xl border border-subtle bg-surface-1" />
        </div>
      </section>
    </>
  );
}
