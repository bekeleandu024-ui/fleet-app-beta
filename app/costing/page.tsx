"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Save } from "lucide-react";

import { CostBreakdownPanel } from "@/components/cost-breakdown-panel";
import { StatChip } from "@/components/stat-chip";
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
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Unable to load costing workbench.
      </section>
    );
  }

  return (
    <section className="col-span-12 grid gap-6 lg:grid-cols-12">
      <form className="grid gap-4 rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft text-sm lg:col-span-6">
        <header>
          <h1 className="text-lg font-semibold text-[var(--text)]">Costing Workbench</h1>
          <p className="text-xs text-muted">Adjust assumptions and review full cost structure before committing.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Miles</span>
            <input
              type="number"
              defaultValue={data.form.miles}
              className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Revenue</span>
            <input
              type="number"
              defaultValue={data.form.revenue}
              className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Origin</span>
            <input
              defaultValue={data.form.origin}
              className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Destination</span>
            <input
              defaultValue={data.form.destination}
              className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Order Type</span>
            <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]" defaultValue={data.form.orderType}>
              {data.orderTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6 text-xs text-muted">
            <input type="checkbox" defaultChecked={data.form.roundTrip} className="size-3 accent-[var(--brand)]" /> Round trip
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Border Crossings</span>
            <input
              type="number"
              defaultValue={data.form.borderCrossings}
              className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Deadhead Miles</span>
            <input
              type="number"
              defaultValue={data.form.deadheadMiles}
              className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Pickups</span>
            <input
              type="number"
              defaultValue={data.form.pickups}
              className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Deliveries</span>
            <input
              type="number"
              defaultValue={data.form.deliveries}
              className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Driver</span>
            <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]" defaultValue={data.form.driver}>
              {data.drivers.map((driver) => (
                <option key={driver}>{driver}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">Unit</span>
            <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]" defaultValue={data.form.unit}>
              {data.units.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Assumptions</span>
          <textarea
            rows={4}
            className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]"
            placeholder="Add pricing assumptions or notes"
          />
        </label>
      </form>

      <div className="flex flex-col gap-4 lg:col-span-6">
        <CostBreakdownPanel
          sections={data.breakdown.sections}
          totalLabel={data.breakdown.totalLabel}
          totalValue={data.breakdown.totalValue}
        />
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-subtle bg-surface-1 px-4 py-3 shadow-soft">
          <StatChip label="Recommended RPM" value={data.targets.recommendedRPM} variant="ok" />
          <StatChip label="Target Revenue" value={data.targets.revenue} />
          <StatChip label="Break-even RPM" value={data.targets.breakEven} variant="warn" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            className="rounded-xl border border-subtle bg-surface-2 text-xs uppercase tracking-wide text-[var(--text)]"
          >
            <Save className="mr-2 size-4" /> Persist to Order
          </Button>
          <Button className="rounded-xl bg-[var(--brand)] text-xs uppercase tracking-wide text-black">
            <Download className="mr-2 size-4" /> Export
          </Button>
        </div>
      </div>
    </section>
  );
}

function CostingSkeleton() {
  return (
    <section className="col-span-12 grid gap-6 lg:grid-cols-12">
      <div className="h-[520px] animate-pulse rounded-xl border border-subtle bg-surface-1 lg:col-span-6" />
      <div className="h-[520px] animate-pulse rounded-xl border border-subtle bg-surface-1 lg:col-span-6" />
    </section>
  );
}
