"use client";

import { useQuery } from "@tanstack/react-query";
import { Compass, MapPin } from "lucide-react";

import { PageSection } from "@/components/page-section";
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
            <Button variant="ghost" className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--text)]">
              Reset
            </Button>
            <Button className="rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black">
              Generate Route
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface-2)] px-6 py-4 text-sm text-[var(--muted)]">
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
