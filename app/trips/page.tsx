"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { DrawerFilter } from "@/components/drawer-filter";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatChip } from "@/components/stat-chip";
import { Toolbar } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
    <>
      <DrawerFilter
        title="Filters"
        sections={[
          {
            title: "Status",
            fields: (
              <Select>
                {data.filters.statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            ),
          },
          {
            title: "Exception",
            fields: (
              <div className="grid gap-2">
                {data.filters.exceptions.map((ex) => (
                  <label key={ex} className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <input type="checkbox" className="size-3 accent-[var(--brand)]" />
                    <span>{ex}</span>
                  </label>
                ))}
              </div>
            ),
          },
          {
            title: "Date Range",
            fields: (
              <Select>
                {data.filters.dateRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </Select>
            ),
          },
        ]}
        onClear={() => void 0}
        onApply={() => void 0}
      />
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-9">
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
            <Button
              type="button"
              variant="link"
              className="text-xs"
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
    </>
  );
}

function TripsSkeleton() {
  return (
    <>
      <div className="col-span-12 lg:col-span-3">
        <div className="h-96 animate-pulse rounded-xl border border-subtle bg-surface-1" />
      </div>
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-9">
        <div className="h-24 animate-pulse rounded-xl border border-subtle bg-surface-1" />
        <div className="h-[480px] animate-pulse rounded-xl border border-subtle bg-surface-1" />
      </div>
    </>
  );
}
