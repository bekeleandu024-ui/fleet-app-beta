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
  Planning: "text-slate-200",
  "In Transit": "text-cyan-400",
  "At Risk": "text-amber-400",
  Delivered: "text-slate-500",
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
            <span className="font-bold text-slate-100">{row.id}</span>
            <span className="text-xs text-slate-500">{row.reference}</span>
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
            <span className="text-slate-200">{row.pickup}</span>
            <span className="text-xs text-slate-500">{row.delivery}</span>
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
          <span className={`text-sm font-bold ${statusTone[row.status] ?? "text-slate-200"}`}>{row.status}</span>
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
        <p className="text-sm text-slate-400">Unable to load orders. Refresh the page.</p>
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
          <div key={stat.label} className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-5 shadow-lg shadow-black/40 hover:border-emerald-500/60 transition-all duration-200">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 shadow-md shadow-black/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-200">Filters:</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">Status:</label>
          <select
            className="rounded-full border border-slate-800/70 bg-slate-950/70 px-4 py-1.5 text-sm text-white focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
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
          <label className="text-xs text-slate-500 font-semibold">Customer:</label>
          <select
            className="rounded-full border border-slate-800/70 bg-slate-950/70 px-4 py-1.5 text-sm text-white focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
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

      <div className="space-y-3">
        {filteredAndSortedData.length === 0 ? (
          <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-8 text-center">
            <p className="text-slate-400">No orders found matching your filters.</p>
          </div>
        ) : (
          filteredAndSortedData.map((order) => {
            // Calculate order age styling
            const ageHours = order.ageHours || 0;
            const ageColor = ageHours > 48 ? 'text-rose-400' : ageHours > 24 ? 'text-amber-400' : 'text-emerald-400';
            const ageText = ageHours > 24 ? `${Math.floor(ageHours / 24)}d` : `${ageHours}h`;
            
            // Status color mapping
            const statusConfig: Record<string, { color: string; progress: number }> = {
              'New': { color: 'bg-slate-500', progress: 25 },
              'Qualifying': { color: 'bg-amber-500', progress: 50 },
              'Qualified': { color: 'bg-emerald-500', progress: 75 },
              'Ready to Book': { color: 'bg-cyan-500', progress: 90 },
              'In Transit': { color: 'bg-blue-500', progress: 100 },
              'Delivered': { color: 'bg-emerald-600', progress: 100 },
              'Exception': { color: 'bg-rose-500', progress: 50 },
            };
            
            const currentStatus = statusConfig[order.status] || { color: 'bg-slate-500', progress: 25 };
            
            return (
              <div
                key={order.id}
                className="rounded-lg border border-slate-800/70 bg-slate-900/60 p-3 shadow-md shadow-black/30 hover:border-emerald-500/40 transition-all duration-200"
              >
                {/* Top section: Customer name and timestamp */}
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-sm font-semibold text-white">
                    {order.customer}
                  </h3>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">Created</div>
                    <div className="text-xs text-slate-300">
                      {order.window}
                    </div>
                  </div>
                </div>

                {/* Route: Origin → Destination */}
                <div className="mb-2 text-xs text-slate-300">
                  <span>{order.pickup}</span>
                  <span className="mx-1.5 text-slate-600">→</span>
                  <span>{order.delivery}</span>
                </div>

                {/* Middle section: Status, Progress, Metrics */}
                <div className="mb-2 space-y-1.5">
                  {/* Status Badge & Metrics Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${currentStatus.color}`}>
                        {order.status}
                      </span>
                      <span className={`text-[10px] font-semibold ${ageColor}`}>
                        {ageText} old
                      </span>
                    </div>
                    {order.laneMiles !== undefined && (
                      <span className="text-[10px] font-medium text-slate-400">
                        {order.laneMiles} mi
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800/50 rounded-full h-1 overflow-hidden">
                    <div 
                      className={`h-full ${currentStatus.color} transition-all duration-500 ease-out`}
                      style={{ width: `${currentStatus.progress}%` }}
                    />
                  </div>
                </div>

                {/* Equipment */}
                {order.serviceLevel && (
                  <div className="mb-1 text-[11px] text-slate-400">
                    Equipment: {order.serviceLevel}
                  </div>
                )}

                {/* Notes/Commodity */}
                {order.commodity && order.commodity !== "General Freight" && (
                  <div className="mb-1.5 text-[11px] text-slate-400">
                    {order.commodity}
                  </div>
                )}

                {/* Bottom section: Actions */}
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    View details
                  </button>
                  <button
                    onClick={() => router.push(`/book?orderId=${order.id}`)}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded shadow-md shadow-blue-600/40 hover:shadow-blue-500/50 transition-all duration-200"
                  >
                    Book Trip
                  </button>
                </div>
              </div>
            );
          })
        )}
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

