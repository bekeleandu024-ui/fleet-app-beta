"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";

import { RecommendationCallout } from "@/components/recommendation-callout";
import { HealthDot } from "@/components/health-dot";
import { StatChip } from "@/components/stat-chip";
import { Button } from "@/components/ui/button";
import { fetchDispatch } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export default function DispatchPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.dispatch,
    queryFn: fetchDispatch,
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const activeOrder = useMemo(() => {
    if (!data) return null;
    const order = data.qualifiedOrders.find((item) => item.id === selectedOrderId);
    return order ?? data.qualifiedOrders[0] ?? null;
  }, [data, selectedOrderId]);

  if (isLoading) {
    return <DispatchSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Dispatch data unavailable.
      </section>
    );
  }

  const orders = data.qualifiedOrders;

  return (
    <>
      <section className="col-span-12 grid gap-6 xl:grid-cols-12">
        <article className="xl:col-span-4 flex h-full flex-col gap-4 rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text)]">Qualified Orders</h2>
            <div className="flex gap-2 text-xs text-muted">
              {data.filters.priorities.map((priority) => (
                <span key={priority} className="rounded-lg border border-subtle bg-surface-2 px-2 py-1">
                  {priority}
                </span>
              ))}
            </div>
          </header>
          <div className="flex flex-col gap-3 overflow-y-auto pr-1">
            {orders.map((order) => {
              const isActive = activeOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                    isActive
                      ? "border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_12%,transparent)]"
                      : "border-subtle bg-surface-2 hover:bg-surface-3"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{order.priority}</span>
                    <span>{order.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{order.reference}</p>
                  <p className="text-xs text-muted">{order.customer}</p>
                  <p className="mt-2 text-xs text-muted">{order.lane}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <StatChip label="Miles" value={order.miles.toString()} />
                    <StatChip label="Window" value={`${order.pickupWindow} → ${order.deliveryWindow}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <article className="xl:col-span-4 flex h-full flex-col gap-4 rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft">
          <RecommendationCallout
            title={data.recommendation.title}
            description={data.recommendation.description}
            bullets={data.recommendation.bullets}
          />
          <form className="grid flex-1 grid-cols-1 gap-4 text-sm">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">Driver</span>
              <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]">
                {data.crew.drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} • {driver.status} ({driver.hoursAvailable}h)
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">Unit</span>
              <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]">
                {data.crew.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.id} • {unit.type} ({unit.status})
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-muted">Trip Type</span>
                <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]">
                  {data.tripForm.tripTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-muted">Rate</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={activeOrder?.miles ? Math.round(activeOrder.miles * 3.9) : 0}
                    className="focus-ring-brand w-full rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
                  />
                  <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-2 py-2 text-sm text-[var(--text)]">
                    {data.tripForm.rateUnits.map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">Projected Miles</span>
              <input
                type="number"
                defaultValue={activeOrder?.miles ?? 0}
                className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
              />
            </label>
            <label className="grid h-full gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">Notes</span>
              <textarea
                rows={4}
                className="focus-ring-brand h-full rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
                placeholder="Add assignment notes or guardrails"
              />
            </label>
          </form>
        </article>

        <article className="xl:col-span-4 flex h-full flex-col gap-4 rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text)]">Crew & Assets</h2>
            <span className="flex items-center gap-2 text-xs text-muted">
              <Info className="size-4" /> Live availability
            </span>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Drivers</h3>
              <ul className="space-y-2 text-sm">
                {data.crew.drivers.map((driver) => (
                  <li key={driver.id} className="flex items-center justify-between rounded-xl border border-subtle bg-surface-2 px-3 py-2">
                    <div>
                      <p className="font-medium text-[var(--text)]">{driver.name}</p>
                      <p className="text-xs text-muted">{driver.hoursAvailable} hrs available</p>
                    </div>
                    <HealthDot status={driver.status === "Ready" ? "ok" : driver.status === "Off Duty" ? "warn" : "alert"} />
                  </li>
                ))}
              </ul>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Units</h3>
              <ul className="space-y-2 text-sm">
                {data.crew.units.map((unit) => (
                  <li key={unit.id} className="flex items-center justify-between rounded-xl border border-subtle bg-surface-2 px-3 py-2">
                    <div>
                      <p className="font-medium text-[var(--text)]">{unit.id}</p>
                      <p className="text-xs text-muted">{unit.type} • {unit.location}</p>
                    </div>
                    <HealthDot status={unit.status === "Available" ? "ok" : unit.status === "Maintenance" ? "alert" : "warn"} />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </section>

      <footer className="col-span-12 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-1 px-4 py-3 shadow-soft">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Info className="size-4" /> Ensure guardrails satisfied before launch.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-xl border border-subtle bg-surface-2 text-xs uppercase tracking-wide text-[var(--text)]"
          >
            Save Draft
          </Button>
          <Button className="rounded-xl bg-[var(--brand)] text-xs uppercase tracking-wide text-black">
            Launch Trip
          </Button>
        </div>
      </footer>
    </>
  );
}

function DispatchSkeleton() {
  return (
    <section className="col-span-12 grid gap-6 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-[520px] animate-pulse rounded-xl border border-subtle bg-surface-1" />
      ))}
    </section>
  );
}
