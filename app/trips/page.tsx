"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/select";
import { fetchTrips } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { TripListItem } from "@/lib/types";


export default function TripsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.trips(), queryFn: fetchTrips });

  const columns: DataTableColumn<TripListItem>[] = useMemo(
    () => [
      {
        key: "trip",
        header: "Trip",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-100">{row.tripNumber}</span>
            <span className="text-xs text-slate-500">{row.status}</span>
          </div>
        ),
        widthClass: "min-w-[160px]",
      },
      { key: "driver", header: "Driver", accessor: (row) => row.driver },
      { key: "unit", header: "Unit", accessor: (row) => row.unit },
      {
        key: "lane",
        header: "PU→DEL",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="text-slate-200">{row.pickup}</span>
            <span className="text-xs text-slate-500">{row.delivery}</span>
          </div>
        ),
        widthClass: "min-w-[200px]",
      },
      { key: "eta", header: "ETA", accessor: (row) => formatDateTime(row.eta), widthClass: "min-w-[200px]" },
      {
        key: "exceptions",
        header: "Exceptions",
        cell: (row) => (
          <Chip tone={row.exceptions > 0 ? "warn" : "default"} className="text-xs">
            {row.exceptions}
          </Chip>
        ),
        align: "center",
      },
      { key: "lastPing", header: "Last Ping", accessor: (row) => formatDateTime(row.lastPing), widthClass: "min-w-[200px]" },
    ],
    []
  );

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
          <Select defaultValue={data.filters.statuses[0] ?? ""}>
            {data.filters.statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </Filter>
        <Filter label="Exception">
          <Select defaultValue={data.filters.exceptions[0] ?? ""}>
            {data.filters.exceptions.map((exception) => (
              <option key={exception}>{exception}</option>
            ))}
          </Select>
        </Filter>
        <Filter label="Date Range">
          <Select defaultValue={data.filters.dateRanges[0] ?? ""}>
            {data.filters.dateRanges.map((range) => (
              <option key={range}>{range}</option>
            ))}
          </Select>
        </Filter>
      </div>
      <div className="-mx-6 mt-4 overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/70 shadow-lg shadow-black/40">
        <DataTable
          columns={columns}
          data={data.data}
          busy={isLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/trips/${row.id}`)}
          rowActions={(row) => (
            <Button
              size="sm"
              variant="plain"
              className="text-xs text-slate-400 hover:text-slate-200"
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/trips/${row.id}`);
              }}
            >
              View
            </Button>
          )}
        />
      </div>
    </SectionBanner>
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
      <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</span>
      {children}
    </label>
  );
}

