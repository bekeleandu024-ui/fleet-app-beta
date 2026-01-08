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
  ChevronRight,
  Calendar,
  MapPin,
  Truck,
  Clock,
  AlertTriangle,
  Package,
  DollarSign,
  Zap,
  User,
  ExternalLink,
  Bot,
  CheckCircle2,
  AlertOctagon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchOrders } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { OrderListItem } from "@/lib/types";

const statusColors: Record<string, string> = {
  New: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Planning: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  "In Transit": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Delivered: "bg-zinc-500/20 text-zinc-500 border-zinc-500/30",
  Exception: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Ready to Book": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Qualifying: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Closed: "bg-zinc-800 text-zinc-500 border-zinc-700",
  "Fleet Assigned": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  Brokerage: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Pending Farm Out": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Posted: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Posted to Carriers": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Covered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Covered (External)": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const priorityColors: Record<string, string> = {
  critical: "text-rose-400",
  high: "text-amber-400",
  normal: "text-blue-400",
  low: "text-zinc-400",
};

function formatDateTime(dateStr?: string) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    full: date.toLocaleString("en-US", { 
      month: "short", day: "numeric", 
      hour: "numeric", minute: "2-digit", hour12: true 
    }),
  };
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 0) {
    if (diffHours > -24) return { text: `${Math.abs(diffHours)}h ago`, isLate: true };
    return { text: `${Math.abs(diffDays)}d ago`, isLate: true };
  }
  if (diffHours < 24) return { text: `in ${diffHours}h`, isLate: false };
  return { text: `in ${diffDays}d`, isLate: false };
}

type RiskLevel = "ok" | "warning" | "critical";
type AIInsight = {
  level: RiskLevel;
  risks: string[];
};

function assessOrderRisk(order: any): AIInsight {
  const risks: string[] = [];
  let level: RiskLevel = "ok";
  
  const now = new Date();
  const pickupDate = order.pickupWindowStart ? new Date(order.pickupWindowStart) : null;
  const hoursToPickup = pickupDate ? (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60) : null;
  
  // Check for past due pickup
  if (hoursToPickup !== null && hoursToPickup < 0) {
    risks.push("Pickup overdue");
    level = "critical";
  }
  
  // Check for urgent pickup with no dispatch
  const unassignedStatuses = ["New", "Qualifying", "Qualified", "Ready to Book", "Planning"];
  if (hoursToPickup !== null && hoursToPickup < 24 && hoursToPickup > 0 && unassignedStatuses.includes(order.status)) {
    risks.push("PU <24h, not dispatched");
    level = level === "critical" ? "critical" : "warning";
  } else if (hoursToPickup !== null && hoursToPickup < 48 && hoursToPickup > 0 && unassignedStatuses.includes(order.status)) {
    risks.push("PU soon, needs dispatch");
    level = level === "ok" ? "warning" : level;
  }
  
  // Check for missing critical info
  if (!order.rate || order.rate === 0) {
    risks.push("No rate quoted");
    level = level === "ok" ? "warning" : level;
  }
  
  if (!pickupDate) {
    risks.push("No pickup scheduled");
    level = level === "ok" ? "warning" : level;
  }
  
  // High priority not yet assigned
  if ((order.priority === "critical" || order.priority === "high") && unassignedStatuses.includes(order.status)) {
    risks.push("High priority, pending");
    level = order.priority === "critical" ? "critical" : (level === "ok" ? "warning" : level);
  }
  
  // Brokerage orders needing carrier
  if (order.status === "Pending Farm Out" || order.status === "Posted" || order.status === "Posted to Carriers") {
    if (hoursToPickup !== null && hoursToPickup < 48) {
      risks.push("Needs carrier soon");
      level = level === "ok" ? "warning" : level;
    }
  }
  
  return { level, risks };
}

export default function OrdersPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
  });

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCustomer, setFilterCustomer] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (field: string) => {
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

  const SortIcon = ({ field }: { field: string }) => {
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
    } else {
      filtered = filtered.filter((order) => order.status !== "Delivered" && order.status !== "In Transit");
    }
    if (filterCustomer !== "All") {
      filtered = filtered.filter((order) => order.customer === filterCustomer);
    }
    if (filterPriority !== "All") {
      filtered = filtered.filter((order: any) => order.priority === filterPriority);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(q) ||
        order.reference.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.pickup.toLowerCase().includes(q) ||
        order.delivery.toLowerCase().includes(q) ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(q))
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = (a as any)[sortField];
        let bVal = (b as any)[sortField];

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
  }, [data?.data, filterStatus, filterCustomer, filterPriority, searchQuery, sortField, sortDirection]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const orders = filteredAndSortedData;
    return {
      totalWeight: orders.reduce((sum, o: any) => sum + (o.weight || 0), 0),
      totalRevenue: orders.reduce((sum, o: any) => sum + (o.rate || 0), 0),
      avgRate: orders.length > 0 
        ? orders.reduce((sum, o: any) => sum + (o.rate || 0), 0) / orders.length 
        : 0,
      urgentCount: orders.filter((o: any) => o.priority === "critical" || o.priority === "high").length,
    };
  }, [filteredAndSortedData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
          <p className="text-rose-500">Error loading orders</p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const stats = data.stats;

  return (
    <div className="flex flex-col gap-0 rounded-lg border border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-zinc-100">Orders</h1>
          
          {/* Stats Ribbon */}
          <div className="hidden items-center gap-3 text-xs font-mono md:flex">
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
            {summaryStats.urgentCount > 0 && (
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span className="font-bold text-amber-400">{summaryStats.urgentCount} urgent</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-56 rounded-md border border-zinc-800 bg-black pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>
          <Button
            size="sm"
            variant="plain"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-8 w-8 rounded-md p-0 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            size="sm" 
            onClick={() => router.push("/orders/new/enterprise")}
            className="h-8 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-500"
          >
            + New Order
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
          className="h-7 rounded-md border border-zinc-800 bg-black px-2 text-xs text-zinc-300 focus:border-blue-800 focus:outline-none"
        >
          <option value="All">Status: All Active</option>
          {data.filters.statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          className="h-7 rounded-md border border-zinc-800 bg-black px-2 text-xs text-zinc-300 focus:border-blue-800 focus:outline-none"
        >
          <option value="All">Customer: All</option>
          {data.filters.customers.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="h-7 rounded-md border border-zinc-800 bg-black px-2 text-xs text-zinc-300 focus:border-blue-800 focus:outline-none"
        >
          <option value="All">Priority: All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        {(filterStatus !== "All" || filterCustomer !== "All" || filterPriority !== "All" || searchQuery) && (
          <button 
            onClick={() => {
              setFilterStatus("All");
              setFilterCustomer("All");
              setFilterPriority("All");
              setSearchQuery("");
            }}
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            Clear all
          </button>
        )}
        
        <div className="ml-auto flex items-center gap-4">
          {/* Summary Stats */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] text-zinc-500">
            <span><DollarSign className="inline h-3 w-3" /> ${summaryStats.totalRevenue.toLocaleString()}</span>
            <span><Package className="inline h-3 w-3" /> {summaryStats.totalWeight.toLocaleString()} lbs</span>
          </div>
          <span className="text-xs text-zinc-500">
            {filteredAndSortedData.length} orders
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs table-auto">
          <thead className="bg-zinc-900/80 text-zinc-500 sticky top-0">
            <tr className="border-b border-zinc-800">
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("orderNumber")} className="flex items-center hover:text-zinc-300">
                  Order <SortIcon field="orderNumber" />
                </button>
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("status")} className="flex items-center hover:text-zinc-300">
                  Status <SortIcon field="status" />
                </button>
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("customer")} className="flex items-center hover:text-zinc-300">
                  Customer <SortIcon field="customer" />
                </button>
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                Route
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("pickupWindowStart")} className="flex items-center hover:text-zinc-300">
                  Pickup <SortIcon field="pickupWindowStart" />
                </button>
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                <button onClick={() => handleSort("deliveryWindowStart")} className="flex items-center hover:text-zinc-300">
                  Delivery <SortIcon field="deliveryWindowStart" />
                </button>
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                Equipment
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider text-right">
                <button onClick={() => handleSort("weight")} className="flex items-center justify-end hover:text-zinc-300 ml-auto">
                  Weight <SortIcon field="weight" />
                </button>
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider text-right">
                <button onClick={() => handleSort("rate")} className="flex items-center justify-end hover:text-zinc-300 ml-auto">
                  Rate <SortIcon field="rate" />
                </button>
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  AI Insight
                </div>
              </th>
              <th className="whitespace-nowrap px-2 py-2 font-medium uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 bg-black/20">
            {filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center">
                  <Package className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500">No orders found</p>
                  <p className="text-xs text-zinc-600 mt-1">Try adjusting your filters</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedData.map((order: any, idx) => {
                const statusStyle = statusColors[order.status] || "bg-zinc-800 text-zinc-400 border-zinc-700";
                const priorityColor = priorityColors[order.priority] || priorityColors.normal;
                const pickupTime = formatDateTime(order.pickupWindowStart);
                const deliveryTime = formatDateTime(order.deliveryWindowStart);
                const pickupRelative = formatRelativeTime(order.pickupWindowStart);
                const aiInsight = assessOrderRisk(order);

                return (
                  <tr 
                    key={order.id} 
                    className={`group transition-colors hover:bg-zinc-900/60 cursor-pointer ${idx % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/20'}`}
                    onClick={() => router.push(`/orders/master?id=${order.id}`)}
                  >
                    {/* Order Number & Priority */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {order.priority && order.priority !== "normal" && (
                          <span className={`${priorityColor}`}>
                            {order.priority === "critical" ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : order.priority === "high" ? (
                              <Zap className="h-3 w-3" />
                            ) : null}
                          </span>
                        )}
                        <span className="font-mono font-semibold text-zinc-200">
                          {order.orderNumber || order.reference}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${statusStyle}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      <span className="font-medium text-zinc-300">
                        {order.customer}
                      </span>
                    </td>

                    {/* Route */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      <div className="flex flex-col gap-0">
                        <div className="flex items-center gap-1 text-zinc-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span>{order.pickup || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          <span>{order.delivery || "—"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Pickup Date/Time */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      {pickupTime ? (
                        <div className="flex flex-col gap-0">
                          <span className="text-zinc-300">{pickupTime.date}</span>
                          <span className="text-[10px] text-zinc-500">{pickupTime.time}</span>
                          {pickupRelative && (
                            <span className={`text-[10px] ${pickupRelative.isLate ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {pickupRelative.text}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600">Not scheduled</span>
                      )}
                    </td>

                    {/* Delivery Date/Time */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      {deliveryTime ? (
                        <div className="flex flex-col gap-0">
                          <span className="text-zinc-300">{deliveryTime.date}</span>
                          <span className="text-[10px] text-zinc-500">{deliveryTime.time}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">Not scheduled</span>
                      )}
                    </td>

                    {/* Equipment */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                        <Truck className="h-3 w-3" />
                        {order.equipmentType || "Dry Van"}
                      </span>
                      {order.isDirect && (
                        <span className="ml-1 inline-flex items-center rounded bg-blue-500/20 px-1 py-0.5 text-[10px] font-medium text-blue-400">
                          Direct
                        </span>
                      )}
                    </td>

                    {/* Weight */}
                    <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap">
                      {order.weight ? (
                        <span className="font-mono text-zinc-400">
                          {order.weight >= 1000 ? `${(order.weight / 1000).toFixed(order.weight % 1000 === 0 ? 0 : 1)}K` : order.weight} <span className="text-zinc-600">lbs</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Rate */}
                    <td className="px-2 py-1.5 align-middle text-right whitespace-nowrap">
                      {order.rate ? (
                        <span className="font-mono font-semibold text-emerald-400">
                          ${order.rate.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* AI Insight */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {aiInsight.level === "ok" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        ) : aiInsight.level === "warning" ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        ) : (
                          <AlertOctagon className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                        )}
                        {aiInsight.risks.length === 0 ? (
                          <span className="text-[10px] text-emerald-400">OK</span>
                        ) : (
                          <span className={`text-[10px] ${aiInsight.level === "critical" ? "text-rose-400" : "text-amber-400"}`}>
                            {aiInsight.risks[0]}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-1.5 align-middle whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => router.push(`/orders/master?id=${order.id}`)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
                          title="View Details"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        {order.status !== "Delivered" && order.status !== "In Transit" && (
                          <button
                            onClick={() => router.push(`/dispatch?orderId=${order.id}`)}
                            className="flex items-center gap-1 rounded-md bg-blue-600/20 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-600/30 border border-blue-600/30"
                          >
                            Dispatch <ChevronRight className="h-3 w-3" />
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

      {/* Footer Summary */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/30 px-4 py-2 text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>Showing {filteredAndSortedData.length} of {stats.total} orders</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Total Revenue: <span className="text-emerald-400 font-mono">${summaryStats.totalRevenue.toLocaleString()}</span></span>
          <span>Avg Rate: <span className="text-zinc-300 font-mono">${Math.round(summaryStats.avgRate).toLocaleString()}</span></span>
        </div>
      </div>
    </div>
  );
}
