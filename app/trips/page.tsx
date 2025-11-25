"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { TripTicketCard } from "@/components/trip-ticket-card";
import { SectionBanner } from "@/components/section-banner";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/select";
import { fetchTrips } from "@/lib/api";
import { queryKeys } from "@/lib/query";


export default function TripsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.trips(), queryFn: fetchTrips });

  if (isLoading && !data) {
    return <TripsSkeleton />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Trips & Tracking" subtitle="Monitor live trips, exceptions, and telemetry pings." aria-live="polite">
        <p className="text-sm text-slate-400">Trips unavailable.</p>
      </SectionBanner>
    );
  }

  const stats = [
    { label: "Active", value: data.stats.active.toString(), tone: "ok" as const },
    { label: "Late", value: data.stats.late.toString(), tone: "warn" as const },
    { label: "Exceptions", value: data.stats.exception.toString(), tone: "alert" as const },
  ];

  return (
    <>
    <SectionBanner
      title="Trips & Tracking"
      subtitle="Monitor live trips, exceptions, and telemetry pings."
      aria-live="polite"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {stats.map((stat) => (
            <Chip key={stat.label} tone={stat.tone} className="gap-2 text-xs">
              <span className="text-base font-bold text-white">{stat.value}</span>
              <span className="uppercase tracking-wide">{stat.label}</span>
            </Chip>
          ))}
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Filter label="Status">
          <Select defaultValue={data.filters.statuses[0] ?? ""} className="bg-black/40 border-zinc-800 text-zinc-200 focus:border-blue-900/50">
            {data.filters.statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </Filter>
        <Filter label="Exception">
          <Select defaultValue={data.filters.exceptions[0] ?? ""} className="bg-black/40 border-zinc-800 text-zinc-200 focus:border-blue-900/50">
            {data.filters.exceptions.map((exception) => (
              <option key={exception}>{exception}</option>
            ))}
          </Select>
        </Filter>
        <Filter label="Date Range">
          <Select defaultValue={data.filters.dateRanges[0] ?? ""} className="bg-black/40 border-zinc-800 text-zinc-200 focus:border-blue-900/50">
            {data.filters.dateRanges.map((range) => (
              <option key={range}>{range}</option>
            ))}
          </Select>
        </Filter>
      </div>
      
      <div className="mt-6 space-y-4">
        {data.data.map((trip) => (
          <TripTicketCard 
            key={trip.id} 
            trip={trip} 
            onClick={() => router.push(`/trips/${trip.id}`)}
          />
        ))}
        {data.data.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
            <p className="text-sm text-zinc-400">No trips found matching your filters.</p>
          </div>
        )}
      </div>
    </SectionBanner>
    </>
  );
}

function TripsSkeleton() {
  return (
    <SectionBanner title="Trips & Tracking" subtitle="Monitor live trips, exceptions, and telemetry pings." aria-live="polite">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-11 animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
      <div className="mt-6 h-64 w-full animate-pulse rounded-xl bg-slate-800/50" />
    </SectionBanner>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">{label}</span>
      {children}
    </label>
  );
}

