"use client";

import { useQuery } from "@tanstack/react-query";
import { Compass, MapPin } from "lucide-react";

import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
      <div className="space-y-6">
        <PageSection title="Map Planner">
          <p className="text-sm text-[var(--muted)]">Map planner unavailable.</p>
        </PageSection>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageSection
        title="Route Planning Console"
        description="Build and evaluate multi-stop routes with network guardrails."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="text-xs uppercase tracking-wide text-[var(--text)]">
              Reset
            </Button>
            <Button className="text-xs font-semibold uppercase tracking-wide">
              Generate Route
            </Button>
          </div>
        }
        contentClassName="p-0"
      >
        <div className="grid gap-0 border-t border-[var(--border)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5 border-b border-[var(--border)] px-6 py-6 lg:border-b-0 lg:border-r">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text)]">Route Options</h3>
              <form className="grid gap-4 text-sm">
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Vehicle Profile</span>
                  <Select>
                    {data.options.vehicleProfiles.map((profile) => (
                      <option key={profile}>{profile}</option>
                    ))}
                  </Select>
                </label>
                <div className="grid gap-2 text-xs text-[var(--muted)]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="size-3 accent-[var(--accent)]" /> Hazmat Enabled
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="size-3 accent-[var(--accent)]" /> Avoid Tolls
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="size-3 accent-[var(--accent)]" /> Avoid Low Bridges
                  </label>
                </div>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Avoidances</span>
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <div className="grid gap-2">
                      {data.options.avoidances.map((item) => (
                        <label key={item} className="flex items-center gap-2 text-sm text-[var(--text)]">
                          <input type="checkbox" className="size-3 accent-[var(--accent)]" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </label>
              </form>
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Steps</h3>
              <ul className="space-y-2 text-sm">
                {data.steps.map((step) => (
                  <li key={step.id} className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-[var(--surface-3)] text-xs text-[var(--muted)]">
                      {step.sequence}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--text)]">{step.action}</p>
                      <p className="text-xs text-[var(--muted)]">{step.location}</p>
                      <p className="text-xs text-[var(--muted)]">ETA {new Date(step.eta).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="space-y-4 px-6 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text)]">Map View</h3>
              <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Compass className="size-4" /> Optimized for compliance
              </span>
            </div>
            <div className="flex h-[420px] items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--muted)]">
              Map viewport placeholder
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-2)] px-6 py-4 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <MapPin className="size-4" /> {data.summary.distance}
          </div>
          <div>{data.summary.eta}</div>
          <div>Cost band {data.summary.costBand}</div>
        </div>
      </PageSection>
    </div>
  );
}

function MapPlannerSkeleton() {
  return (
    <div className="space-y-6">
      <PageSection title="Route Planning Console" hideHeader>
        <div className="h-[520px] animate-pulse rounded-md bg-[var(--surface-2)]" />
      </PageSection>
    </div>
  );
}
