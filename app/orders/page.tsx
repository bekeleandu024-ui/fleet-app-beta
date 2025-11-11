"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SectionBanner } from "@/components/section-banner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { fetchOrders } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { OrderListItem } from "@/lib/types";

const statusTone: Record<string, string> = {
  New: "text-[var(--brand)]",
  Planning: "text-[var(--text)]",
  "In Transit": "text-[var(--ok)]",
  "At Risk": "text-[var(--warn)]",
  Delivered: "text-[var(--muted)]",
  Exception: "text-[var(--alert)]",
};

export default function OrdersPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
  });

  const columns: DataTableColumn<OrderListItem>[] = useMemo(
    () => [
      {
        key: "order",
        header: "Order",
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-[var(--text)]">{row.id}</span>
            <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{row.reference}</span>
          </div>
        ),
        widthClass: "min-w-[160px]",
      },
      { key: "customer", header: "Customer", accessor: (row) => row.customer, widthClass: "min-w-[160px]" },
      {
        key: "lane",
        header: "PU→DEL",
        cell: (row) => (
          <div className="flex flex-col text-sm">
            <span>{row.pickup}</span>
            <span className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">{row.delivery}</span>
          </div>
        ),
        widthClass: "min-w-[200px]",
      },
      { key: "window", header: "Window", accessor: (row) => row.window, widthClass: "min-w-[160px]" },
      {
        key: "status",
        header: "Status",
        cell: (row) => (
          <span className={`text-sm font-semibold ${statusTone[row.status] ?? "text-[var(--text)]"}`}>{row.status}</span>
        ),
      },
      { key: "age", header: "Age", accessor: (row) => `${row.ageHours}h`, align: "right" },
      {
        key: "cost",
        header: "Cost",
        cell: (row) => (row.cost !== undefined ? formatCurrency(row.cost) : "—"),
        align: "right",
      },
    ],
    []
  );

  if (isLoading && !data) {
    return <OrdersSkeleton />;
  }

  if (isError || !data) {
    return (
      <SectionBanner title="Orders Workspace" subtitle="Review, price, and action the active order stack." aria-live="polite">
        <p className="text-sm text-[color-mix(in_srgb,var(--muted)_90%,transparent)]">Unable to load orders. Refresh the page.</p>
      </SectionBanner>
    );
  }

  const stats = [
    { label: "Total", value: data.stats.total.toString() },
    { label: "New", value: data.stats.new.toString() },
    { label: "In Progress", value: data.stats.inProgress.toString() },
    { label: "Delayed", value: data.stats.delayed.toString() },
  ];

  return (
    <SectionBanner
      title="Orders Workspace"
      subtitle="Review, price, and action the active order stack."
      aria-live="polite"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="plain"
            className="text-[color-mix(in_srgb,var(--muted)_85%,transparent)] hover:text-[var(--text)]"
            onClick={() => {
              void refetch();
            }}
          >
            <RefreshCw className="size-4" /> Refresh
          </Button>
          <Button size="sm" variant="primary">
            Create Order
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {stats.map((stat) => (
          <Chip key={stat.label} className="gap-3 text-sm">
            <span className="text-base font-semibold text-[var(--text)]">{stat.value}</span>
            <span className="text-xs uppercase tracking-wide text-[color-mix(in_srgb,var(--muted)_85%,transparent)]">
              {stat.label}
            </span>
          </Chip>
        ))}
      </div>
      <div className="-mx-6 mt-4 overflow-hidden rounded-[calc(var(--radius)-2px)] border border-[var(--border)] bg-[var(--surface-2)]">
        <DataTable
          columns={columns}
          data={data.data}
          busy={isLoading}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/orders/${row.id}`)}
          rowActions={(row) => (
            <Button
              size="sm"
              variant="plain"
              className="text-xs text-[color-mix(in_srgb,var(--muted)_85%,transparent)] hover:text-[var(--text)]"
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/orders/${row.id}`);
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

function OrdersSkeleton() {
  return (
    <SectionBanner title="Orders Workspace" subtitle="Review, price, and action the active order stack." aria-live="polite">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]"
          />
        ))}
      </div>
      <div className="mt-6 h-64 w-full animate-pulse rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_70%,transparent)]" />
    </SectionBanner>
  );
}
