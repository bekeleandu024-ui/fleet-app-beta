"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";
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
            <span className="text-xs text-[var(--muted)]">{row.reference}</span>
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
            <span className="text-xs text-[var(--muted)]">{row.delivery}</span>
          </div>
        ),
        widthClass: "min-w-[200px]",
      },
      { key: "window", header: "Window", accessor: (row) => row.window, widthClass: "min-w-[120px]" },
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

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <PageSection title="Orders">
          <p className="text-sm text-[var(--muted)]">Unable to load orders. Try refreshing the page.</p>
        </PageSection>
      </div>
    );
  }

  const stats = [
    { label: "Total", value: data.stats.total.toString() },
    { label: "New", value: data.stats.new.toString() },
    { label: "In Progress", value: data.stats.inProgress.toString() },
    { label: "Delayed", value: data.stats.delayed.toString() },
  ];

  return (
    <div className="space-y-6">
      <PageSection
        title="Orders Workspace"
        description="Review, price, and action the active order stack."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold uppercase tracking-wide text-[var(--text)]"
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button
              size="sm"
              className="rounded-md bg-[var(--brand)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black"
            >
              Create Order
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          {stats.map((stat) => (
            <span
              key={stat.label}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--muted)]"
            >
              <span className="text-base font-semibold text-[var(--text)]">{stat.value}</span>
              {stat.label}
            </span>
          ))}
        </div>
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <PageSection title="Filters" description="Target customer, service level, or lane." contentClassName="space-y-4">
          <form className="grid gap-4 text-sm">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Customer</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.customers.map((customer) => (
                  <option key={customer}>{customer}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Status</span>
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <div className="grid gap-2">
                  {data.filters.statuses.map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm text-[var(--text)]">
                      <input type="checkbox" className="size-3 accent-[var(--brand)]" defaultChecked={status !== "Delivered"} />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Date Range</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.dateRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">Lane</span>
              <select className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                {data.filters.lanes.map((lane) => (
                  <option key={lane}>{lane}</option>
                ))}
              </select>
            </label>
          </form>
        </PageSection>

        <PageSection
          title="Orders Ledger"
          description="Sortable view of live and planned orders."
          contentClassName="px-0 pb-0"
        >
          <div className="border-t border-[var(--border)]">
            <DataTable
              columns={columns}
              data={data.data}
              busy={isLoading}
              getRowId={(row) => row.id}
              onRowClick={(row) => router.push(`/orders/${row.id}`)}
              rowActions={(row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
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
        </PageSection>
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-6">
      <PageSection title="Orders Workspace" hideHeader>
        <div className="h-24 animate-pulse rounded-md bg-[var(--surface-2)]" />
      </PageSection>
      <PageSection title="Orders" hideHeader>
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="h-64 animate-pulse rounded-md bg-[var(--surface-2)]" />
          <div className="h-96 animate-pulse rounded-md bg-[var(--surface-2)]" />
        </div>
      </PageSection>
    </div>
  );
}
