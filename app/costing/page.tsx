"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Save } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { fetchCostingDefaults } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export default function CostingPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.costing,
    queryFn: fetchCostingDefaults,
  });

  if (isLoading) {
    return <CostingSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <SectionBanner>
          <SectionBanner.Header title="Costing Workbench" />
          <SectionBanner.Content>
            <p className="text-sm text-[var(--muted)]">Unable to load costing workbench.</p>
          </SectionBanner.Content>
        </SectionBanner>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SectionBanner>
          <SectionBanner.Header
            title="Costing Workbench"
            description="Adjust assumptions and review full cost structure before committing."
          />
          <SectionBanner.Content>
            <form className="grid gap-4 text-sm md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Miles</span>
              <input
                type="number"
                defaultValue={data.form.miles}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Revenue</span>
              <input
                type="number"
                defaultValue={data.form.revenue ?? 0}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Origin</span>
              <input
                defaultValue={data.form.origin}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Destination</span>
              <input
                defaultValue={data.form.destination}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Order Type</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2" defaultValue={data.form.orderType}>
                {data.orderTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-xs text-[var(--muted)]">
              <input type="checkbox" defaultChecked={data.form.roundTrip} className="size-3 accent-[var(--accent)]" /> Round trip
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Border Crossings</span>
              <input
                type="number"
                defaultValue={data.form.borderCrossings}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Deadhead Miles</span>
              <input
                type="number"
                defaultValue={data.form.deadheadMiles}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Pickups</span>
              <input
                type="number"
                defaultValue={data.form.pickups}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Deliveries</span>
              <input
                type="number"
                defaultValue={data.form.deliveries}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Driver</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2" defaultValue={data.form.driver}>
                {data.drivers.map((driver) => (
                  <option key={driver}>{driver}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Unit</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2" defaultValue={data.form.unit}>
                {data.units.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Assumptions</span>
              <textarea
                rows={4}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                placeholder="Add pricing assumptions or notes"
              />
            </label>
            </form>
          </SectionBanner.Content>
        </SectionBanner>

        <SectionBanner>
          <SectionBanner.Header
            title="Breakdown"
            description="Fixed, variable, and accessorial cost components."
          />
          <SectionBanner.Content className="space-y-5">
            <div className="space-y-4">
            {data.breakdown.sections.map((section) => (
              <section key={section.title} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
                <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{section.title}</h3>
                </header>
                <ul className="divide-y divide-[var(--border)] text-sm">
                  {section.items.map((item) => (
                    <li key={item.label} className="flex items-center justify-between px-4 py-2">
                      <span className="text-[var(--muted)]">{item.label}</span>
                      <span className="font-semibold text-[var(--text)]">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-sm">
              <span className="text-[var(--muted)]">{data.breakdown.totalLabel}</span>
              <span className="text-base font-semibold text-[var(--text)]">{data.breakdown.totalValue}</span>
            </div>
            <div className="grid gap-2 px-4 py-3 text-xs text-[var(--muted)] md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span>Recommended RPM</span>
                <span className="text-sm font-semibold text-[var(--text)]">{data.targets.recommendedRPM}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span>Target Revenue</span>
                <span className="text-sm font-semibold text-[var(--text)]">{data.targets.revenue}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span>Break-even RPM</span>
                <span className="text-sm font-semibold text-[var(--text)]">{data.targets.breakEven}</span>
              </div>
            </div>
          </SectionBanner.Content>
        </SectionBanner>
      </div>

      <div className="sticky bottom-4 z-10">
        <div className="flex flex-wrap items-center justify-end gap-2 rounded-md border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-1)_96%,transparent)] px-4 py-3 shadow-sm backdrop-blur">
          <Button
            variant="ghost"
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--text)]"
          >
            <Save className="size-4" /> Persist to Order
          </Button>
          <Button className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black">
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>
    </div>
  );
}

function CostingSkeleton() {
  return (
    <div className="space-y-6">
      <SectionBanner>
        <SectionBanner.Content>
          <div className="h-[520px] animate-pulse rounded-md bg-[var(--surface-2)]" />
        </SectionBanner.Content>
      </SectionBanner>
    </div>
  );
}
