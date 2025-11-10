"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatChip } from "@/components/stat-chip";
import { Toolbar } from "@/components/toolbar";
import { fetchTrips } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { TripListItem } from "@/lib/types";

const statusTone: Record<string, "default" | "ok" | "warn" | "alert"> = {
  "On Time": "ok",
  "Running Late": "warn",
  "Exception": "alert",
};

export default function TripsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.trips(),
    queryFn: fetchTrips,
  });

  if (isLoading) {
    return <TripsSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Trips unavailable.
      </section>
    );
  }

  const columns: DataTableColumn<TripListItem>[] = [
    {
      key: "trip",
      header: "Trip",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[var(--text)]">{row.tripNumber}</span>
          <span className="text-xs text-muted">{row.status}</span>
        </div>
      ),
      widthClass: "min-w-[160px]",
    },
    {
      key: "driver",
      header: "Driver",
      accessor: (row) => row.driver,
    },
    {
      key: "unit",
      header: "Unit",
      accessor: (row) => row.unit,
    },
    {
      key: "lane",
      header: "PU→DEL",
      cell: (row) => (
        <div className="flex flex-col">
          <span>{row.pickup}</span>
          <span className="text-xs text-muted">{row.delivery}</span>
        </div>
      ),
      widthClass: "min-w-[200px]",
    },
    {
      key: "eta",
      header: "ETA",
      accessor: (row) => formatDateTime(row.eta),
      widthClass: "min-w-[200px]",
    },
    {
      key: "exceptions",
      header: "Exceptions",
      cell: (row) => <StatChip label={row.exceptions > 0 ? `${row.exceptions}` : "0"} variant={row.exceptions > 0 ? "warn" : "default"} />,
      align: "center",
    },
    {
      key: "lastPing",
      header: "Last Ping",
      accessor: (row) => formatDateTime(row.lastPing),
      widthClass: "min-w-[200px]",
    },
  ];

  const stats = [
    { label: "Active", value: data.stats.active.toString(), variant: "ok" as const },
    { label: "Late", value: data.stats.late.toString(), variant: "warn" as const },
    { label: "Exceptions", value: data.stats.exception.toString(), variant: "alert" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Toolbar
        title="Trips & Tracking"
        description="Monitor live trips, exceptions, and telemetry pings."
        stats={stats.map((stat) => ({ ...stat, id: stat.label }))}
      />
      <DataTable
        columns={columns}
        data={data.data}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(`/trips/${row.id}`)}
        rowActions={(row) => (
          <button
            type="button"
            className="text-xs text-muted hover:text-[var(--text)]"
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/trips/${row.id}`);
            }}
          >
            View
          </button>
        )}
      />
    </div>
  );
}

function TripsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-24 animate-pulse rounded-xl border border-subtle bg-surface-1" />
      <div className="h-[480px] animate-pulse rounded-xl border border-subtle bg-surface-1" />
    </div>
  );
}
