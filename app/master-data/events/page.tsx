"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { fetchEventsMasterData } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { MasterDataResponse } from "@/lib/types";

export default function EventsMasterDataPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.events,
    queryFn: fetchEventsMasterData,
  });

  if (isLoading && !data) {
    return <MasterDataSkeleton title="Event Log" />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Event Log" subtitle="Chronological, read-only telemetry feed." aria-live="polite">
        <p className="text-sm text-neutral-400">Events not available.</p>
      </SectionBanner>
    );
  }

  const columns: DataTableColumn<MasterDataResponse["data"][number]>[] = [
    { key: "id", header: "ID", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
    { key: "name", header: "Event", accessor: (row) => row.name, widthClass: "min-w-[200px]" },
    { key: "status", header: "Status", accessor: (row) => row.status },
    { key: "region", header: "Region", accessor: (row) => row.region },
    { key: "updated", header: "Timestamp", accessor: (row) => formatDateTime(row.updated), widthClass: "min-w-[200px]" },
  ];

  return (
    <SectionBanner title="Event Log" subtitle="Chronological, read-only telemetry feed." aria-live="polite">
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
