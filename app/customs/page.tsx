"use client";

import { useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { CustomsClearanceListItem, CustomsResponse } from "@/lib/types";

async function fetchCustomsClearances(): Promise<CustomsResponse> {
  const response = await fetch("/api/customs", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch customs clearances");
  }
  return response.json();
}

const directionLabel = (direction: string) =>
  direction.replace("_TO_", " → ").replace(/_/g, " ");

export default function CustomsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.customs(),
    queryFn: fetchCustomsClearances,
    refetchInterval: 30000,
  });

  const columns: DataTableColumn<CustomsClearanceListItem>[] = useMemo(
    () => [
      {
        key: "trip",
        header: "Trip",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-200">{row.tripNumber}</span>
            <span className="text-xs text-zinc-500">{row.driverName}</span>
          </div>
        ),
        widthClass: "min-w-[160px]",
      },
      { key: "unit", header: "Unit", accessor: (row) => row.unitNumber },
      {
        key: "status",
        header: "Status",
        cell: (row) => {
          const toneMap = {
            PENDING_DOCS: "warn" as const,
            DOCS_SUBMITTED: "default" as const,
            UNDER_REVIEW: "default" as const,
            APPROVED: "ok" as const,
            REJECTED: "alert" as const,
            CLEARED: "ok" as const,
          };
          return (
            <Chip tone={toneMap[row.status] ?? "default"} className="text-xs">
              {row.status.replace(/_/g, " ")}
            </Chip>
          );
        },
      },
      {
        key: "priority",
        header: "Priority",
        cell: (row) => {
          const toneMap = {
            URGENT: "alert" as const,
            HIGH: "warn" as const,
            NORMAL: "default" as const,
            LOW: "default" as const,
          };
          return (
            <Chip tone={toneMap[row.priority] ?? "default"} className="text-xs">
              {row.priority}
            </Chip>
          );
        },
      },
      {
        key: "border",
        header: "Border Crossing",
        cell: (row) => (
          <div className="flex flex-col">
            <span>{row.borderCrossingPoint}</span>
            <span className="text-xs text-zinc-500">{directionLabel(row.crossingDirection)}</span>
          </div>
        ),
        widthClass: "min-w-[220px]",
      },
      {
        key: "documents",
        header: "Documents",
        cell: (row) => (
          <div className="text-sm">
            <span
              className={
                row.submittedDocsCount >= row.requiredDocsCount
                  ? "text-blue-400"
                  : "text-amber-400"
              }
            >
              {row.submittedDocsCount}
            </span>
            <span className="text-zinc-500"> / {row.requiredDocsCount}</span>
          </div>
        ),
        align: "center",
      },
      {
        key: "agent",
        header: "Agent",
        accessor: (row) => row.assignedAgent || "—",
        widthClass: "min-w-[160px]",
      },
      {
        key: "eta",
        header: "Est. Crossing",
        accessor: (row) =>
          row.estimatedCrossingTime
            ? formatDateTime(row.estimatedCrossingTime)
            : "TBD",
        widthClass: "min-w-[200px]",
      },
    ],
    []
  );

  if (isLoading && !data) {
    return <CustomsSkeleton />;
  }

  if (isError || !data) {
    return (
      <SectionBanner
        title="Customs Clearance"
        subtitle="Manage border crossing documentation and approvals"
        aria-live="polite"
      >
        <p className="text-sm text-zinc-400">Customs data unavailable.</p>
      </SectionBanner>
    );
  }

  const stats = [
    { label: "Pending Docs", value: data.stats.pendingDocs.toString(), tone: "warn" as const },
    { label: "Under Review", value: data.stats.underReview.toString(), tone: "default" as const },
    { label: "Approved", value: data.stats.approved.toString(), tone: "ok" as const },
    { label: "Urgent", value: data.stats.urgent.toString(), tone: "alert" as const },
  ];

  return (
    <SectionBanner
      title="Customs Clearance"
      subtitle="Manage border crossing documentation and approvals (Buckland/Livingston)"
      aria-live="polite"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {stats.map((stat) => (
            <Chip key={stat.label} tone={stat.tone} className="gap-2 text-xs">
              <span className="text-base font-semibold text-zinc-200">{stat.value}</span>
              <span className="uppercase tracking-wide">{stat.label}</span>
            </Chip>
          ))}
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Filter label="Status">
          <Select defaultValue="all">
            <option value="all">All Statuses</option>
            {data.filters.statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Filter>
        <Filter label="Priority">
          <Select defaultValue="all">
            <option value="all">All Priorities</option>
            {data.filters.priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </Filter>
        <Filter label="Border Crossing">
          <Select defaultValue="all">
            <option value="all">All Borders</option>
            {data.filters.crossingPoints.map((point) => (
              <option key={point} value={point}>
                {point}
              </option>
            ))}
          </Select>
        </Filter>
        <Filter label="Agent">
          <Select defaultValue="all">
            <option value="all">All Agents</option>
            {data.filters.agents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </Select>
        </Filter>
      </div>
      <div className="-mx-6 mt-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
        <DataTable
          columns={columns}
          data={data.data}
          busy={isLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/customs/${row.id}`)}
          rowActions={(row) => (
            <Button
              size="sm"
              variant="plain"
              className="text-xs text-zinc-500 hover:text-zinc-200"
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/customs/${row.id}`);
              }}
            >
              Review
            </Button>
          )}
        />
      </div>
    </SectionBanner>
  );
}

function CustomsSkeleton() {
  return (
    <SectionBanner
      title="Customs Clearance"
      subtitle="Manage border crossing documentation and approvals"
      aria-live="polite"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-11 animate-pulse rounded-lg bg-zinc-900/50" />
        ))}
      </div>
      <div className="mt-6 h-64 w-full animate-pulse rounded-lg bg-zinc-900/50" />
    </SectionBanner>
  );
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

