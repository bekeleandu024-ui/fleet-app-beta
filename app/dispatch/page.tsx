"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";

import { PageSection } from "@/components/page-section";
import { RecommendationCallout } from "@/components/recommendation-callout";
import { HealthDot } from "@/components/health-dot";
import { StatChip } from "@/components/stat-chip";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
      <div className="space-y-6">
        <PageSection title="Dispatch Console">
          <p className="text-sm text-[var(--muted)]">Dispatch data unavailable.</p>
        </PageSection>
      </div>
    );
  }

  const orders = data.qualifiedOrders;

  return (
    <div className="space-y-6">
      <PageSection
        title="Dispatch Control Center"
        description="Stage qualified orders, apply guardrails, and confirm launch-ready crews."
        contentClassName="p-0"
      >
        <div className="grid gap-0 border-t border-[var(--border)] lg:grid-cols-3">
          <div className="space-y-5 border-b border-[var(--border)] px-6 py-6 lg:border-b-0 lg:border-r">
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text)]">Qualified Orders</h3>
              <div className="flex gap-2 text-xs text-[var(--muted)]">
                {data.filters.priorities.map((priority) => (
                  <Chip key={priority} className="normal-case px-2 py-1 text-[var(--muted)]">
                    {priority}
                  </Chip>
                ))}
              </div>
            </header>
            <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-2">
              {orders.map((order) => {
                const isActive = activeOrder?.id === order.id;
                return (
                  <Button
                    key={order.id}
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={cn(
                      "w-full items-start justify-start px-3 py-3 text-left font-normal",
                      isActive
                        ? "border-[color:var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]"
                        : "hover:bg-[color-mix(in_srgb,var(--surface-2)_82%,white_18%)]"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>{order.priority}</span>
                      <span>{order.status}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--text)]">{order.reference}</p>
                    <p className="text-xs text-[var(--muted)]">{order.customer}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">{order.lane}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <StatChip label="Miles" value={order.miles.toString()} />
                      <StatChip label="Window" value={`${order.pickupWindow} → ${order.deliveryWindow}`} />
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5 border-b border-[var(--border)] px-6 py-6 lg:border-b-0 lg:border-r">
            <h3 className="text-sm font-semibold text-[var(--text)]">Assignment & Guardrails</h3>
            <RecommendationCallout
              title={data.recommendation.title}
              description={data.recommendation.description}
              bullets={data.recommendation.bullets}
            />
            <form className="grid gap-4 text-sm">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Driver</span>
                <Select>
                  {data.crew.drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} • {driver.status} ({driver.hoursAvailable}h)
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Unit</span>
                <Select>
                  {data.crew.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.id} • {unit.type} ({unit.status})
                    </option>
                  ))}
                </Select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Trip Type</span>
                  <Select>
                    {data.tripForm.tripTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Rate</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      defaultValue={activeOrder?.miles ? Math.round(activeOrder.miles * 3.9) : 0}
                      className="w-full"
                    />
                    <Select className="w-24 px-2">
                      {data.tripForm.rateUnits.map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </Select>
                  </div>
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Projected Miles</span>
                <Input
                  type="number"
                  defaultValue={activeOrder?.miles ?? 0}
                  className="w-full"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Notes</span>
                <textarea
                  rows={4}
                  className="min-h-[120px] rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                  placeholder="Add assignment notes or guardrails"
                />
              </label>
            </form>
          </div>

          <div className="space-y-5 px-6 py-6">
            <h3 className="text-sm font-semibold text-[var(--text)]">Crew & Assets</h3>
            <div className="grid gap-4 lg:grid-cols-1 xl:grid-cols-2">
              <section className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Drivers</h4>
                  <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <Info className="size-4" /> Live availability
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  {data.crew.drivers.map((driver) => (
                    <li key={driver.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                      <div>
                        <p className="font-medium text-[var(--text)]">{driver.name}</p>
                        <p className="text-xs text-[var(--muted)]">{driver.hoursAvailable} hrs available</p>
                      </div>
                      <HealthDot status={driver.status === "Ready" ? "ok" : driver.status === "Off Duty" ? "warn" : "alert"} />
                    </li>
                  ))}
                </ul>
              </section>
              <section className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Units</h4>
                <ul className="space-y-2 text-sm">
                  {data.crew.units.map((unit) => (
                    <li key={unit.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface-3)] px-3 py-2">
                      <div>
                        <p className="font-medium text-[var(--text)]">{unit.id}</p>
                        <p className="text-xs text-[var(--muted)]">{unit.type} • {unit.location}</p>
                      </div>
                      <HealthDot status={unit.status === "Available" ? "ok" : unit.status === "Maintenance" ? "alert" : "warn"} />
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-2)] px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Info className="size-4" /> Ensure guardrails satisfied before launch.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" className="rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-xs uppercase tracking-wide text-[var(--text)]">
              Save Draft
            </Button>
            <Button className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black">
              Launch Trip
            </Button>
          </div>
        </div>
      </PageSection>
    </div>
  );
}

function DispatchSkeleton() {
  return (
    <div className="space-y-6">
      <PageSection title="Dispatch Control Center" hideHeader>
        <div className="h-[520px] animate-pulse rounded-md bg-[var(--surface-2)]" />
      </PageSection>
    </div>
  );
}
