"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { fetchDriversMasterData } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { MasterDataResponse } from "@/lib/types";

export default function DriversMasterDataPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.drivers,
    queryFn: fetchDriversMasterData,
  });

  if (isLoading && !data) {
    return <MasterDataSkeleton title="Driver Directory" />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Driver Directory" subtitle="Read-only roster for dispatch and planning teams." aria-live="polite">
        <p className="text-sm text-neutral-400">Drivers not available.</p>
      </SectionBanner>
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
    <SectionBanner
      title="Driver Directory"
      subtitle="Read-only roster for dispatch and planning teams."
      aria-live="polite"
    >
      <div className="-mx-6 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60">
        <DataTable columns={columns} data={data.data} getRowId={(row) => row.id} />
      </div>
    </SectionBanner>
  );
}

function MasterDataSkeleton({ title }: { title: string }) {
  return (
    <SectionBanner title={title} subtitle="Loading directory..." aria-live="polite">
      <div className="h-[420px] animate-pulse rounded-lg bg-neutral-900/50" />
    </SectionBanner>
  );
}
