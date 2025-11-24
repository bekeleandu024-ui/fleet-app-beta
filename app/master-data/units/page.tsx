"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { fetchUnitsMasterData } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { MasterDataResponse } from "@/lib/types";

export default function UnitsMasterDataPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.units,
    queryFn: fetchUnitsMasterData,
  });

  if (isLoading && !data) {
    return <MasterDataSkeleton title="Unit Directory" />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Unit Directory" subtitle="Fleet asset inventory and readiness." aria-live="polite">
        <p className="text-sm text-zinc-400">Units not available.</p>
      </SectionBanner>
    );
  }

  const columns: DataTableColumn<MasterDataResponse["data"][number]>[] = [
    { key: "id", header: "ID", accessor: (row) => row.id, widthClass: "min-w-[140px]" },
    { key: "name", header: "Identifier", accessor: (row) => row.name, widthClass: "min-w-[180px]" },
    { key: "status", header: "Status", accessor: (row) => row.status },
    { key: "region", header: "Region", accessor: (row) => row.region },
    { key: "updated", header: "Updated", accessor: (row) => formatDateTime(row.updated), widthClass: "min-w-[200px]" },
  ];

  return (
    <SectionBanner title="Unit Directory" subtitle="Fleet asset inventory and readiness." aria-live="polite">
      <div className="-mx-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
        <DataTable columns={columns} data={data.data} getRowId={(row) => row.id} />
      </div>
    </SectionBanner>
  );
}

function MasterDataSkeleton({ title }: { title: string }) {
  return (
    <SectionBanner title={title} subtitle="Loading directory..." aria-live="polite">
      <div className="h-[420px] animate-pulse rounded-lg bg-zinc-900/50" />
    </SectionBanner>
  );
}

