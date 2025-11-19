"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";

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

type SortField = "reference" | "customer" | "status" | "ageHours" | "cost" | "window";
type SortDirection = "asc" | "desc" | null;

export default function OrdersPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
  });

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterCustomer, setFilterCustomer] = useState<string>("All");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUp className="ml-1 h-3 w-3" />;
    if (sortDirection === "desc") return <ArrowDown className="ml-1 h-3 w-3" />;
    return null;
  };

  const columns: DataTableColumn<OrderListItem>[] = useMemo(
    () => [
      {
        key: "order",
        header: (
          <button onClick={() => handleSort("reference")} className="flex items-center hover:text-white">
            Order
            <SortIcon field="reference" />
          </button>
        ),
        cell: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-200">{row.id}</span>
            <span className="text-xs text-neutral-500">{row.reference}</span>
          </div>
        ),
        widthClass: "w-40",
      },
      {
        key: "customer",
        header: (
          <button onClick={() => handleSort("customer")} className="flex items-center hover:text-white">
            Customer
            <SortIcon field="customer" />
          </button>
        ),
        accessor: (row) => row.customer,
        widthClass: "w-44",
      },
      {
        key: "lane",
        header: "PU→DEL",
        cell: (row) => (
          <div className="flex flex-col text-sm">
            <span>{row.pickup}</span>
            <span className="text-xs text-neutral-500">{row.delivery}</span>
          </div>
        ),
        widthClass: "w-52",
      },
      {
        key: "window",
        header: (
          <button onClick={() => handleSort("window")} className="flex items-center hover:text-white">
            Window
            <SortIcon field="window" />
          </button>
        ),
        accessor: (row) => row.window,
        widthClass: "w-40",
      },
      {
        key: "status",
        header: (
          <button onClick={() => handleSort("status")} className="flex items-center hover:text-white">
            Status
            <SortIcon field="status" />
          </button>
        ),
        cell: (row) => (
          <span className={`text-sm font-semibold ${statusTone[row.status] ?? "text-neutral-200"}`}>{row.status}</span>
        ),
        widthClass: "w-32",
      },
      {
        key: "age",
        header: (
          <button onClick={() => handleSort("ageHours")} className="flex items-center hover:text-white">
            Age
            <SortIcon field="ageHours" />
          </button>
        ),
        accessor: (row) => `${row.ageHours}h`,
        align: "right",
        widthClass: "w-20",
      },
      {
        key: "cost",
        header: (
          <button onClick={() => handleSort("cost")} className="flex items-center hover:text-white">
            Cost
            <SortIcon field="cost" />
          </button>
        ),
        cell: (row) => (row.cost !== undefined ? formatCurrency(row.cost) : "—"),
        align: "right",
        widthClass: "w-28",
      },
    ],
    [sortField, sortDirection]
  );

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    if (!data?.data) return [];

    let filtered = data.data;

    // Apply filters
    if (filterStatus !== "All") {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }
    if (filterCustomer !== "All") {
      filtered = filtered.filter((order) => order.customer === filterCustomer);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

        // Handle undefined/null values
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        // Convert to comparable values
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data?.data, filterStatus, filterCustomer, sortField, sortDirection]);

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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Orders</h1>
          <p className="text-sm text-neutral-400">Review, price, and action the active order stack</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              void refetch();
            }}
          >
            <RefreshCw className="size-4" /> Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={() => router.push("/orders/new")}>
            Create Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

        ))}\n      </div>\n\n      {/* Filters */}
      <div className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-300">Filters:</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500">Status:</label>
          <select
            className="rounded-md border border-neutral-800 bg-black/40 px-3 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All</option>
            {data?.filters.statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500">Customer:</label>
          <select
            className="rounded-md border border-neutral-800 bg-black/40 px-3 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
          >
            {data?.filters.customers.map((customer) => (
              <option key={customer} value={customer}>
                {customer}
              </option>
            ))}
          </select>
        </div>
        {(filterStatus !== "All" || filterCustomer !== "All") && (
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              setFilterStatus("All");
              setFilterCustomer("All");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900/60">
        <div className="inline-block min-w-full align-middle">
          <DataTable
            columns={columns}
            data={filteredAndSortedData}
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
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-20 animate-pulse rounded-xl bg-neutral-900/50" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-neutral-900/50"
          />
        ))}
      </div>
      <div className="h-96 w-full animate-pulse rounded-lg bg-neutral-900/50" />
    </div>
  );
}
