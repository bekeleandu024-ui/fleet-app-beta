"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  RefreshCw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Search,
  MoreHorizontal,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchOrders } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { OrderListItem } from "@/lib/types";

const statusColors = {
  New: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Planning: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "In Transit": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Delivered: "bg-zinc-500/20 text-zinc-500 border-zinc-500/30",
  Exception: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Ready to Book": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Qualifying": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Qualified": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function OrdersPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
  });

  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCustomer, setFilterCustomer] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (field) => {
    if (sortField === field) {
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

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-20" />;
    if (sortDirection === "asc") return <ArrowUp className="ml-1 h-3 w-3 text-blue-400" />;
    if (sortDirection === "desc") return <ArrowDown className="ml-1 h-3 w-3 text-blue-400" />;
    return null;
  };

  const filteredAndSortedData = useMemo(() => {
    if (!data?.data) return [];

    let filtered = data.data;

    if (filterStatus !== "All") {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }
    if (filterCustomer !== "All") {
      filtered = filtered.filter((order) => order.customer === filterCustomer);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(q) ||
        order.reference.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.pickup.toLowerCase().includes(q) ||
        order.delivery.toLowerCase().includes(q)
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data?.data, filterStatus, filterCustomer, searchQuery, sortField, sortDirection]);

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Loading orders...</div>;
  }

  if (isError || !data) {
    return <div className="p-8 text-rose-500">Error loading orders.</div>;
  }

  const stats = data.stats;

  return (
    <div className="flex flex-col gap-0 rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden">
      {/* Header & Stats Ribbon */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-zinc-100">Orders</h1>
          
          {/* Stats Ribbon */}
          <div className="hidden items-center gap-4 text-xs font-mono md:flex">
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Total</span>
              <span className="font-bold text-zinc-200">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">New</span>
              <span className="font-bold text-emerald-400">{stats.new}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Active</span>
              <span className="font-bold text-blue-400">{stats.inProgress}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500">Delayed</span>
              <span className="font-bold text-rose-400">{stats.delayed}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-sm border border-zinc-800 bg-black pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => void refetch()}
            className="h-8 w-8 rounded-sm p-0 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button 
            size="sm" 
            onClick={() => router.push("/orders/new")}
            className="h-8 rounded-sm bg-blue-700 px-3 text-xs font-medium text-white hover:bg-blue-600"
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Filters:</span>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-7 rounded-sm border border-zinc-800 bg-black px-2 text-xs text-zinc-300 focus:border-blue-800 focus:outline-none"
        >
          <option value="All">Status: All</option>
          {data.filters.statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          className="h-7 rounded-sm border border-zinc-800 bg-black px-2 text-xs text-zinc-300 focus:border-blue-800 focus:outline-none"
        >
          <option value="All">Customer: All</option>
          {data.filters.customers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {(filterStatus !== "All" || filterCustomer !== "All" || searchQuery) && (
          <button 
            onClick={() => {
              setFilterStatus("All");
              setFilterCustomer("All");
              setSearchQuery("");
            }}
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            Clear all
          </button>
        )}
        
        <div className="ml-auto text-xs text-zinc-500">
          Showing {filteredAndSortedData.length} orders
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900/80 text-zinc-500">
            <tr className="border-b border-zinc-800">
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("reference")} className="flex items-center hover:text-zinc-300">
                  Order ID <SortIcon field="reference" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("status")} className="flex items-center hover:text-zinc-300">
                  Status <SortIcon field="status" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("customer")} className="flex items-center hover:text-zinc-300">
                  Customer <SortIcon field="customer" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("pickup")} className="flex items-center hover:text-zinc-300">
                  Origin <SortIcon field="pickup" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("delivery")} className="flex items-center hover:text-zinc-300">
                  Destination <SortIcon field="delivery" />
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider">
                Equipment
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider text-right">
                Distance
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 bg-black/20">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((order, idx) => {
                const statusStyle = statusColors[order.status] || "bg-zinc-800 text-zinc-400 border-zinc-700";
                
                return (
                  <tr 
                    key={order.id} 
                    className={`group transition-colors hover:bg-zinc-900/60 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/20'}`}
                  >
                    {/* Order ID / Date */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="font-mono font-medium text-blue-400 group-hover:text-blue-300">
                          {order.id}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {order.window}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2 align-middle">
                      <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${statusStyle}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-2 align-middle font-medium text-zinc-300">
                      {order.customer}
                    </td>

                    {/* Origin */}
                    <td className="px-4 py-2 align-middle text-zinc-400">
                      {order.pickup}
                    </td>

                    {/* Destination */}
                    <td className="px-4 py-2 align-middle text-zinc-400">
                      {order.delivery}
                    </td>

                    {/* Equipment */}
                    <td className="px-4 py-2 align-middle text-zinc-500">
                      {order.serviceLevel || "—"}
                    </td>

                    {/* Distance */}
                    <td className="px-4 py-2 align-middle text-right font-mono text-zinc-400">
                      {order.laneMiles ? `${order.laneMiles} mi` : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 align-middle text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="text-zinc-400 hover:text-white"
                          title="View Details"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {order.status !== "Delivered" && order.status !== "In Transit" && (
                          <button
                            onClick={() => router.push(`/book?orderId=${order.id}`)}
                            className="flex items-center gap-1 rounded-sm bg-blue-900/30 px-2 py-1 text-[10px] font-medium text-blue-300 hover:bg-blue-900/50 border border-blue-800/30"
                          >
                            Book <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
