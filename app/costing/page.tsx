"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Save } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchCostingDefaults } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export default function CostingPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.costing, queryFn: fetchCostingDefaults });

  if (isLoading && !data) {
    return <CostingSkeleton />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Costing Workbench" subtitle="Adjust assumptions before submitting pricing." aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Unable to load costing workbench.</p>
      </SectionBanner>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionBanner
        title="Costing Workbench"
        subtitle="Adjust assumptions and review full cost structure before committing."
        aria-live="polite"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="subtle">
              <Save className="size-4" /> Persist to Order
            </Button>
            <Button size="sm" variant="primary">
              <Download className="size-4" /> Export
            </Button>
          </div>
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Chip tone="brand">RPM {data.targets.recommendedRPM}</Chip>
            <Chip tone="ok">Target {data.targets.revenue}</Chip>
            <Chip tone="warn">Break-even {data.targets.breakEven}</Chip>
          </div>
        }
      >
        <form className="grid gap-4 text-sm md:grid-cols-2">
          <Field label="Miles">
            <Input type="number" defaultValue={data.form.miles} min={0} />
          </Field>
          <Field label="Revenue">
            <Input type="number" defaultValue={data.form.revenue ?? 0} min={0} />
          </Field>
          <Field label="Origin">
            <Input defaultValue={data.form.origin} />
          </Field>
          <Field label="Destination">
            <Input defaultValue={data.form.destination} />
          </Field>
          <Field label="Order Type">
            <Select defaultValue={data.form.orderType}>
              {data.orderTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 pt-6 text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
            <input type="checkbox" defaultChecked={data.form.roundTrip} className="size-4 accent-[var(--brand)]" /> Round trip
          </label>
          <Field label="Border Crossings">
            <Input type="number" defaultValue={data.form.borderCrossings} min={0} />
          </Field>
          <Field label="Deadhead Miles">
            <Input type="number" defaultValue={data.form.deadheadMiles} min={0} />
          </Field>
          <Field label="Pickups">
            <Input type="number" defaultValue={data.form.pickups} min={0} />
          </Field>
          <Field label="Deliveries">
            <Input type="number" defaultValue={data.form.deliveries} min={0} />
          </Field>
          <Field label="Driver">
            <Select defaultValue={data.form.driver}>
              {data.drivers.map((driver) => (
                <option key={driver}>{driver}</option>
              ))}
            </Select>
          </Field>
          <Field label="Unit">
            <Select defaultValue={data.form.unit}>
              {data.units.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </Select>
          </Field>
          <label className="md:col-span-2 grid gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Assumptions</span>
            <textarea
              rows={4}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-0"
              placeholder="Add pricing assumptions or notes"
            />
          </label>
        </form>
      </SectionBanner>

      <SectionBanner
        title="Breakdown"
        subtitle="Fixed, variable, and accessorial cost components."
        aria-live="polite"
      >
        <div className="space-y-4">
          {data.breakdown.sections.map((section) => (
            <section key={section.title} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]">
              <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
                  {section.title}
                </h3>
              </header>
              <ul className="divide-y divide-[var(--border)] text-sm">
                {section.items.map((item) => (
                  <li key={item.label} className="flex items-center justify-between px-4 py-2">
                    <span className="text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{item.label}</span>
                    <span className="font-semibold text-[var(--text)]">{item.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-sm">
            <span className="text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{data.breakdown.totalLabel}</span>
            <span className="text-base font-semibold text-[var(--text)]">{data.breakdown.totalValue}</span>
          </div>
          <div className="grid gap-3 px-4 py-3 text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)] md:grid-cols-3">
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
        </div>
      </SectionBanner>
    </div>
  );
}

function CostingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionBanner title="Costing Workbench" subtitle="Adjust assumptions before submitting pricing." aria-live="polite">
        <div className="h-96 animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
      </SectionBanner>
      <SectionBanner title="Breakdown" subtitle="Fixed, variable, and accessorial cost components." aria-live="polite">
        <div className="h-96 animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
      </SectionBanner>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{label}</span>
      {children}
    </label>
  );
}
