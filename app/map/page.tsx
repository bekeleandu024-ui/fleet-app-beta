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
        <p className="text-sm text-zinc-400">Map planner unavailable.</p>
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
            <span className="text-xs uppercase tracking-wide text-zinc-500">Vehicle profile</span>
            <Select defaultValue={data.options.vehicleProfiles[0] ?? ""}>
              {data.options.vehicleProfiles.map((profile) => (
                <option key={profile}>{profile}</option>
              ))}
            </Select>
          </label>
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wide text-zinc-500">Avoidances</span>
            <div className="flex flex-wrap gap-2">
              {data.options.avoidances.map((item) => (
                <Chip key={item} className="text-xs">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2 text-sm text-zinc-200">
              <Compass className="size-4 text-blue-400" /> Guidance
            </div>
            <p className="mt-2">
              Optimized for compliance; adjust avoidances to enforce hazmat or low bridge restrictions.
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400">
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
      <div className="h-[420px] animate-pulse rounded-lg bg-zinc-900/50" />
    </SectionBanner>
  );
}

