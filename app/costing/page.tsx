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
        <p className="text-sm text-neutral-400">Unable to load costing workbench.</p>
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
          <label className="flex items-center gap-2 pt-6 text-xs text-neutral-500">
            <input type="checkbox" defaultChecked={data.form.roundTrip} className="size-4 accent-emerald-500" /> Round trip
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
            <span className="text-xs uppercase tracking-wide text-neutral-500">Assumptions</span>
            <textarea
              rows={4}
              className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
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
            <section key={section.title} className="rounded-lg border border-neutral-800 bg-neutral-900/60">
              <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {section.title}
                </h3>
              </header>
              <ul className="divide-y divide-neutral-800 text-sm">
                {section.items.map((item) => (
                  <li key={item.label} className="flex items-center justify-between px-4 py-2">
                    <span className="text-neutral-500">{item.label}</span>
                    <span className="font-semibold text-neutral-200">{item.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3 text-sm">
            <span className="text-neutral-500">{data.breakdown.totalLabel}</span>
            <span className="text-base font-semibold text-neutral-200">{data.breakdown.totalValue}</span>
          </div>
          <div className="grid gap-3 px-4 py-3 text-xs text-neutral-500 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span>Recommended RPM</span>
              <span className="text-sm font-semibold text-neutral-200">{data.targets.recommendedRPM}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Target Revenue</span>
              <span className="text-sm font-semibold text-neutral-200">{data.targets.revenue}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Break-even RPM</span>
              <span className="text-sm font-semibold text-neutral-200">{data.targets.breakEven}</span>
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
        <div className="h-96 animate-pulse rounded-lg bg-neutral-900/50" />
      </SectionBanner>
      <SectionBanner title="Breakdown" subtitle="Fixed, variable, and accessorial cost components." aria-live="polite">
        <div className="h-96 animate-pulse rounded-lg bg-neutral-900/50" />
      </SectionBanner>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
