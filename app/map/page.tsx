"use client";

import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";

import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/select";
import { fetchMapPlan } from "@/lib/api";
import { queryKeys } from "@/lib/query";

export default function MapPlannerPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.map, queryFn: fetchMapPlan });

  if (isLoading && !data) {
    return <MapPlannerSkeleton />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Route Planning" subtitle="Build and evaluate multi-stop routes." aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Map planner unavailable.</p>
      </SectionBanner>
    );
  }

  return (
    <SectionBanner
      title="Route Planning"
      subtitle="Build and evaluate multi-stop routes with network guardrails."
      aria-live="polite"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="subtle">
            Reset
          </Button>
          <Button size="sm" variant="primary">
            Generate Route
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <label className="grid gap-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Vehicle profile</span>
            <Select defaultValue={data.options.vehicleProfiles[0] ?? ""}>
              {data.options.vehicleProfiles.map((profile) => (
                <option key={profile}>{profile}</option>
              ))}
            </Select>
          </label>
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">Avoidances</span>
            <div className="flex flex-wrap gap-2">
              {data.options.avoidances.map((item) => (
                <Chip key={item} className="text-xs">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
            <div className="flex items-center gap-2 text-sm text-[var(--text)]">
              <Compass className="size-4 text-[var(--brand)]" /> Guidance
            </div>
            <p className="mt-2">
              Optimized for compliance; adjust avoidances to enforce hazmat or low bridge restrictions.
            </p>
          </div>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex h-[420px] items-center justify-center rounded-[calc(var(--radius)-2px)] border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)] text-sm text-[color-mix(in_srgb,var(--muted)_88%,transparent)]">
            Map viewport placeholder
          </div>
        </div>
      </div>
    </SectionBanner>
  );
}

function MapPlannerSkeleton() {
  return (
    <SectionBanner title="Route Planning" subtitle="Build and evaluate multi-stop routes." aria-live="polite">
      <div className="h-[420px] animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
    </SectionBanner>
  );
}
