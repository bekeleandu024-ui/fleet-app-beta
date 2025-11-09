"use client";

import { useState, useMemo } from "react";
import { Plus, Upload, FileDown, Sparkles } from "lucide-react";
import { OrderRow, OrderStatus, OrderType, ProfitabilityFilter, OrderDetail } from "./types";
import { MOCK_ORDERS, MOCK_ORDER_DETAILS } from "./mockData";
import { FiltersBar } from "./components/FiltersBar";
import { OrdersTable } from "./components/OrdersTable";
import { OrderDetailSheet } from "./components/OrderDetailSheet";

export default function OrdersPage() {
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<OrderStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [profitabilityFilter, setProfitabilityFilter] = useState<ProfitabilityFilter>("all");
  const [aiAttentionOnly, setAiAttentionOnly] = useState(false);

  // Table state
  const [sortColumn, setSortColumn] = useState<keyof OrderRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Detail sheet state
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

  // Filter and sort logic
  const filteredOrders = useMemo(() => {
    let filtered = [...MOCK_ORDERS];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.customer.toLowerCase().includes(query) ||
          `${order.origin.city} ${order.origin.state}`.toLowerCase().includes(query) ||
          `${order.destination.city} ${order.destination.state}`.toLowerCase().includes(query)
      );
    }

    // Status
    if (statusFilters.length > 0) {
      filtered = filtered.filter((order) => statusFilters.includes(order.status));
    }

    // Type
    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.type === typeFilter);
    }

    // Profitability
    if (profitabilityFilter === "profitable") {
      filtered = filtered.filter((order) => order.marginPct >= 0.15);
    } else if (profitabilityFilter === "breakeven") {
      filtered = filtered.filter((order) => order.marginPct >= 0.05 && order.marginPct < 0.15);
    } else if (profitabilityFilter === "losing") {
      filtered = filtered.filter((order) => order.marginPct < 0.05);
    }

    // AI Attention
    if (aiAttentionOnly) {
      filtered = filtered.filter((order) => order.aiRisk > 60);
    }

    // Sort
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal === undefined || bVal === undefined) return 0;
        
        let comparison = 0;
        if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [searchQuery, statusFilters, typeFilter, profitabilityFilter, aiAttentionOnly, sortColumn, sortDirection]);

  const handleSort = (column: keyof OrderRow) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilters([]);
    setTypeFilter("all");
    setProfitabilityFilter("all");
    setAiAttentionOnly(false);
  };

  const handleOrderClick = (order: OrderRow) => {
    // For demo, only the first order has full details
    if (order.id === "CMIHK06U1") {
      setSelectedOrder(MOCK_ORDER_DETAILS[order.id]);
    } else {
      // Create a minimal detail object for other orders
      setSelectedOrder({
        ...order,
        timeline: {
          created: new Date().toISOString(),
        },
        costBreakdown: {
          fixed: order.estCostUsd * 0.33,
          wage: order.estCostUsd * 0.37,
          rolling: order.estCostUsd * 0.25,
          accessorials: order.estCostUsd * 0.05,
          total: order.estCostUsd,
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#E6EAF2]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0B1020] border-b border-[#1E2638] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 bg-[#121826] border border-[#1E2638] rounded-md text-sm text-[#9AA4B2] hover:text-[#E6EAF2] hover:border-[#60A5FA]/40 transition-colors flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </button>
            <button className="h-9 px-3 bg-[#121826] border border-[#1E2638] rounded-md text-sm text-[#9AA4B2] hover:text-[#E6EAF2] hover:border-[#60A5FA]/40 transition-colors flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button className="h-9 px-3 bg-[#121826] border border-[#1E2638] rounded-md text-sm text-[#9AA4B2] hover:text-[#E6EAF2] hover:border-[#60A5FA]/40 transition-colors flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Batch Optimizer
            </button>
            <button className="h-9 px-3 bg-[#60A5FA] hover:bg-[#60A5FA]/90 rounded-md text-sm text-white font-medium transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Order
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 space-y-4">
        {/* Filters */}
        <FiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilters={statusFilters}
          onStatusFiltersChange={setStatusFilters}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          profitabilityFilter={profitabilityFilter}
          onProfitabilityFilterChange={setProfitabilityFilter}
          aiAttentionOnly={aiAttentionOnly}
          onAiAttentionOnlyChange={setAiAttentionOnly}
          onClearFilters={handleClearFilters}
        />

        {/* Results Count */}
        <div className="text-sm text-[#9AA4B2]">
          Showing {filteredOrders.length} of {MOCK_ORDERS.length} orders
        </div>

        {/* Table */}
        <OrdersTable
          orders={filteredOrders}
          onOrderClick={handleOrderClick}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>

      {/* Detail Sheet */}
      <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
