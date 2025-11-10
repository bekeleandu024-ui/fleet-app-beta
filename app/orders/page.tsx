"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { DrawerFilter } from "@/components/drawer-filter";
import { Toolbar } from "@/components/toolbar";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { fetchOrders } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { OrderListItem } from "@/lib/types";

const statusTone: Record<string, string> = {
  "New": "text-[var(--brand)]",
  "Planning": "text-[var(--text)]",
  "In Transit": "text-[var(--ok)]",
  "At Risk": "text-[var(--warn)]",
  "Delivered": "text-muted",
  "Exception": "text-[var(--alert)]",
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
            <span className="text-xs text-muted">{row.reference}</span>
          </div>
        ),
        widthClass: "min-w-[160px]",
      },
      {
        key: "customer",
        header: "Customer",
        accessor: (row) => row.customer,
        widthClass: "min-w-[160px]",
      },
      {
        key: "lane",
        header: "PU→DEL",
        cell: (row) => (
          <div className="flex flex-col text-sm">
            <span>{row.pickup}</span>
            <span className="text-xs text-muted">{row.delivery}</span>
          </div>
        ),
        widthClass: "min-w-[200px]",
      },
      {
        key: "window",
        header: "Window",
        accessor: (row) => row.window,
        widthClass: "min-w-[120px]",
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => (
          <span className={`text-sm font-semibold ${statusTone[row.status] ?? "text-[var(--text)]"}`}>{row.status}</span>
        ),
      },
      {
        key: "age",
        header: "Age",
        accessor: (row) => `${row.ageHours}h`,
        align: "right",
      },
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
      <section className="col-span-12 rounded-xl border border-subtle bg-surface-1 p-6 text-sm text-muted">
        Unable to load orders. Try refreshing the page.
      </section>
    );
  }

  const stats = [
    { label: "Total", value: data.stats.total.toString() },
    { label: "New", value: data.stats.new.toString(), variant: "ok" as const },
    { label: "In Progress", value: data.stats.inProgress.toString() },
    { label: "Delayed", value: data.stats.delayed.toString(), variant: "warn" as const },
  ];

  return (
    <>
      <DrawerFilter
        title="Filters"
        sections={[
          {
            title: "Customer",
            fields: (
              <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]">
                {data.filters.customers.map((customer) => (
                  <option key={customer}>{customer}</option>
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
                    <input type="checkbox" className="size-3 accent-[var(--brand)]" defaultChecked={status !== "Delivered"} />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            ),
          },
          {
            title: "Date Range",
            fields: (
              <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]">
                {data.filters.dateRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>
            ),
          },
          {
            title: "Lane",
            fields: (
              <select className="focus-ring-brand rounded-xl border border-subtle bg-surface-2 px-3 py-2 text-sm text-[var(--text)]">
                {data.filters.lanes.map((lane) => (
                  <option key={lane}>{lane}</option>
                ))}
              </select>
            ),
          },
        ]}
        onClear={() => void 0}
        onApply={() => void 0}
      />

      <div className="col-span-12 flex flex-col gap-6 lg:col-span-9">
        <Toolbar
          title="Orders Workspace"
          description="Review, price, and action the active order stack."
          stats={stats.map((stat) => ({ ...stat, id: stat.label }))}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl border border-subtle bg-surface-2 text-xs uppercase tracking-wide text-[var(--text)]"
                onClick={() => refetch()}
              >
                <RefreshCw className="mr-2 size-4" /> Refresh
              </Button>
              <Button size="sm" className="rounded-xl bg-[var(--brand)] text-xs uppercase tracking-wide text-black">
                Create Order
              </Button>
            </div>
          }
        />

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
              className="text-xs text-muted hover:text-[var(--text)]"
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/orders/${row.id}`);
              }}
            >
              Open
            </Button>
          )}
        />
      </div>
    </>
  );
}

function OrdersSkeleton() {
  return (
    <>
      <div className="col-span-12 lg:col-span-3">
        <div className="h-96 animate-pulse rounded-xl border border-subtle bg-surface-1" />
      </div>
      <div className="col-span-12 flex flex-col gap-6 lg:col-span-9">
        <div className="h-24 animate-pulse rounded-xl border border-subtle bg-surface-1" />
        <div className="h-[520px] animate-pulse rounded-xl border border-subtle bg-surface-1" />
      </div>
    </>
  );
}
