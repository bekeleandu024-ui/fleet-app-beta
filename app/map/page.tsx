"use client";

import { useQuery } from "@tanstack/react-query";
import { Compass, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchMapPlan } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export default function MapPlannerPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.map,
    queryFn: fetchMapPlan,
  });

  if (isLoading) {
    return <MapPlannerSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Map planner unavailable.
      </section>
    );
  }

  return (
    <section className="col-span-12 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-surface-1 px-4 py-4 shadow-soft">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)]">Map Planner</h1>
          <p className="text-xs text-muted">Build and evaluate multi-stop routes with network guardrails.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-xl border border-subtle bg-surface-2 text-xs uppercase tracking-wide text-[var(--text)]"
          >
            Reset
          </Button>
          <Button className="rounded-xl bg-[var(--brand)] text-xs uppercase tracking-wide text-black">Generate Route</Button>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="rounded-xl border border-subtle bg-surface-1 p-4 shadow-soft text-sm lg:basis-[35%] lg:flex-shrink">
          <h2 className="text-sm font-semibold text-[var(--text)]">Route Options</h2>
          <form className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">Vehicle Profile</span>
              <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]">
                {data.options.vehicleProfiles.map((profile) => (
                  <option key={profile}>{profile}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" className="size-3 accent-[var(--brand)]" /> Hazmat Enabled
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" className="size-3 accent-[var(--brand)]" /> Avoid Tolls
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" className="size-3 accent-[var(--brand)]" /> Avoid Low Bridges
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">Avoidances</span>
              <div className="grid gap-1">
                {data.options.avoidances.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <input type="checkbox" className="size-3 accent-[var(--brand)]" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </label>
          </form>
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Steps</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {data.steps.map((step) => (
                <li key={step.id} className="flex items-center gap-3 rounded-xl border border-subtle bg-surface-2 px-3 py-2">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-surface-3 text-xs text-muted">
                    {step.sequence}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text)]">{step.action}</p>
                    <p className="text-xs text-muted">{step.location}</p>
                    <p className="text-xs text-muted">ETA {new Date(step.eta).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex flex-1 flex-col rounded-xl border border-subtle bg-surface-1 shadow-soft lg:basis-[65%]">
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Map View</h2>
              <span className="flex items-center gap-2 text-xs text-muted">
                <Compass className="size-4" /> Optimized for compliance
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-subtle bg-surface-2 text-xs text-muted">
              Map viewport placeholder
            </div>
          </div>
          <footer className="flex items-center justify-between border-t border-subtle bg-surface-2 px-4 py-3 text-sm">
            <div className="flex items-center gap-3 text-muted">
              <MapPin className="size-4" /> {data.summary.distance} • {data.summary.eta}
            </div>
            <div className="text-xs text-muted">Cost band {data.summary.costBand}</div>
          </footer>
        </div>
      </div>
    </section>
  );
}

function MapPlannerSkeleton() {
  return (
    <section className="col-span-12 space-y-6">
      <div className="h-24 animate-pulse rounded-xl border border-subtle bg-surface-1" />
      <div className="h-[520px] animate-pulse rounded-xl border border-subtle bg-surface-1" />
    </section>
  );
}
