"use client";

import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PageSection } from "@/components/page-section";
import { fetchRulesMasterData } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { MasterDataResponse } from "@/lib/types";

export default function RulesMasterDataPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.masterData.rules,
    queryFn: fetchRulesMasterData,
  });

  if (isLoading) {
    return <MasterDataSkeleton title="Rules" />;
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageSection title="Rules">
          <p className="text-sm text-[var(--muted)]">Rules not available.</p>
        </PageSection>
      </div>
    );
  }

  const columns: DataTableColumn<MasterDataResponse["data"][number]>[] = [
    { key: "id", header: "ID", accessor: (row) => row.id, widthClass: "min-w-[120px]" },
    { key: "name", header: "Name", accessor: (row) => row.name, widthClass: "min-w-[200px]" },
    { key: "status", header: "Status", accessor: (row) => row.status },
    { key: "region", header: "Region", accessor: (row) => row.region },
    { key: "updated", header: "Updated", accessor: (row) => formatDateTime(row.updated), widthClass: "min-w-[200px]" },
  ];

  return (
    <div className="space-y-6">
      <PageSection title="Rule Filters" description="Segment policies by region and activation." contentClassName="space-y-4">
        <form className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Region</span>
            <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
              {data.filters.regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Status</span>
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="grid gap-2">
                {data.filters.statuses.map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm text-[var(--text)]">
                    <input type="checkbox" className="size-3 accent-[var(--accent)]" defaultChecked={status === "Active"} />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </label>
        </form>
      </PageSection>

      <PageSection title="Rule Catalog" description="Read-only network policy matrix." contentClassName="px-0 pb-0">
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
