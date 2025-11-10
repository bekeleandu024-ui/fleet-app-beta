"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PageSection } from "@/components/page-section";
import { fetchUnitsMasterData } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { MasterDataResponse } from "@/lib/types";

export default function UnitsMasterDataPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.units,
    queryFn: fetchUnitsMasterData,
  });

  if (isLoading) {
    return <MasterDataSkeleton title="Units" />;
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageSection title="Units">
          <p className="text-sm text-[var(--muted)]">Units not available.</p>
        </PageSection>
      </div>
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
    <div className="space-y-6">
      <PageSection title="Unit Registry" description="Current assets and compliance state." contentClassName="px-0 pb-0">
        <div className="border-t border-[var(--border)]">
          <DataTable columns={columns} data={data.data} getRowId={(row) => row.id} />
        </div>
      </PageSection>
    </div>
  );
}

function MasterDataSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageSection title={title} hideHeader>
        <div className="h-[420px] animate-pulse rounded-md bg-[var(--surface-2)]" />
      </PageSection>
    </div>
  );
}
