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
  New: "text-emerald-400",
  Planning: "text-neutral-200",
  "In Transit": "text-emerald-400",
  "At Risk": "text-amber-400",
  Delivered: "text-neutral-500",
  Exception: "text-rose-400",
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
            <span className="font-semibold text-neutral-200">{row.id}</span>
            <span className="text-xs text-neutral-500">{row.reference}</span>
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
            <span className="text-xs text-neutral-500">{row.delivery}</span>
          </div>
        ),
        widthClass: "min-w-[200px]",
      },
      { key: "window", header: "Window", accessor: (row) => row.window, widthClass: "min-w-[160px]" },
      {
        key: "status",
        header: "Status",
        cell: (row) => (
          <span className={`text-sm font-semibold ${statusTone[row.status] ?? "text-neutral-200"}`}>{row.status}</span>
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
        <p className="text-sm text-neutral-400">Unable to load orders. Refresh the page.</p>
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
            className="text-neutral-500 hover:text-neutral-200"
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
            <span className="text-base font-semibold text-neutral-200">{stat.value}</span>
            <span className="text-xs uppercase tracking-wide text-neutral-500">
              {stat.label}
            </span>
          </Chip>
        ))}
      </div>
      <div className="-mx-6 mt-4 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/60">
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
              className="text-xs text-neutral-500 hover:text-neutral-200"
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
            className="h-10 animate-pulse rounded-lg bg-neutral-900/50"
          />
        ))}
      </div>
      <div className="mt-6 h-64 w-full animate-pulse rounded-lg bg-neutral-900/50" />
    </SectionBanner>
  );
}
