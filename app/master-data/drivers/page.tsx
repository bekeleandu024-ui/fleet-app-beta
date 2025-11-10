"use client";

import { useQuery } from "@tanstack/react-query";

import { DrawerFilter } from "@/components/drawer-filter";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Toolbar } from "@/components/toolbar";
import { fetchDriversMasterData } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { MasterDataResponse } from "@/lib/types";

export default function DriversMasterDataPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.drivers,
    queryFn: fetchDriversMasterData,
  });

  if (isLoading) {
    return <MasterDataSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Drivers not available.
      </section>
    );
  }

  const columns: DataTableColumn<MasterDataResponse["data"][number]>[] = [
    { key: "id", header: "ID", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
    { key: "name", header: "Name", accessor: (row) => row.name, widthClass: "min-w-[180px]" },
    { key: "status", header: "Status", accessor: (row) => row.status },
    { key: "region", header: "Region", accessor: (row) => row.region },
    { key: "updated", header: "Updated", accessor: (row) => formatDateTime(row.updated), widthClass: "min-w-[200px]" },
  ];

  return (
    <>
      <DrawerFilter
        title="Filters"
        sections={[
          {
            title: "Region",
            fields: (
              <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]">
                {data.filters.regions.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            ),
          },
          {
            title: "Status",
            fields: (
              <div className="grid gap-2">
                {data.filters.statuses.map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <input type="checkbox" className="size-3 accent-[var(--brand)]" defaultChecked={status === "Ready"} />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            ),
          },
        ]}
        onClear={() => void 0}
        onApply={() => void 0}
      />
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-9">
        <Toolbar
          title="Drivers"
          description="Reference list of all drivers. Editing is disabled."
        />
        <DataTable columns={columns} data={data.data} getRowId={(row) => row.id} />
      </div>
    </>
  );
}

function MasterDataSkeleton() {
  return (
    <>
      <div className="col-span-12 lg:col-span-3">
        <div className="h-64 animate-pulse rounded-xl border border-subtle bg-surface-1" />
      </div>
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-9">
        <div className="h-20 animate-pulse rounded-xl border border-subtle bg-surface-1" />
        <div className="h-[420px] animate-pulse rounded-xl border border-subtle bg-surface-1" />
      </div>
    </>
  );
}
