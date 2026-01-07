"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  AlertTriangle,
  Clock,
  Package,
  MapPin,
  ArrowRight,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import {
  MasterListHeader,
  MasterListCard,
  QuickFilter,
} from "./master-detail-layout";
import type { OrderListItem } from "@/lib/types";

// Status colors for the indicator bar - Enterprise neutral with color-as-exception
const statusBarColors: Record<string, string> = {
  "New": "bg-[#5a5a6e]",
  "Planning": "bg-[#5a5a6e]",
  "In Transit": "bg-[#5a5a6e]",
  "At Risk": "bg-[#c97a5a]",
  "Delivered": "bg-[#5a5a6e]",
  "Exception": "bg-[#b45353]",
  "Ready to Book": "bg-[#5a5a6e]",
  "Qualifying": "bg-[#5a5a6e]",
  "Qualified": "bg-[#5a5a6e]",
  "Closed": "bg-[#3a3a42]",
  "Fleet Assigned": "bg-[#5a5a6e]",
  "Brokerage": "bg-[#5a5a6e]",
  "Pending Farm Out": "bg-[#c97a5a]",
  "Posted": "bg-[#5a5a6e]",
  "Posted to Carriers": "bg-[#5a5a6e]",
  "Covered": "bg-[#5a5a6e]",
  "Covered (External)": "bg-[#5a5a6e]",
};

// Quick filter options for orders
type QuickFilterType = "all" | "new" | "at-risk" | "unassigned" | "ready-to-book";

interface OrderMasterListProps {
  orders: OrderListItem[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  /** Whether to use infinite scroll */
  useInfiniteScroll?: boolean;
  /** Page size for infinite scroll */
  pageSize?: number;
}

export function OrderMasterList({
  orders,
  selectedOrderId,
  onSelectOrder,
  isLoading = false,
  onRefresh,
  useInfiniteScroll = true,
  pageSize = 20,
}: OrderMasterListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<QuickFilterType>("all");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Status helper - handles status string comparison
  const hasStatus = (o: OrderListItem, status: string) => 
    (o.status as string) === status;

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const newOrders = orders.filter(o => hasStatus(o, "New")).length;
    const atRisk = orders.filter(o => 
      hasStatus(o, "At Risk") || 
      hasStatus(o, "Exception") ||
      (o.ageHours && o.ageHours > 24)
    ).length;
    const unassigned = orders.filter(o => 
      hasStatus(o, "New") || 
      hasStatus(o, "Planning") ||
      hasStatus(o, "Ready to Book")
    ).length;
    const readyToBook = orders.filter(o => hasStatus(o, "Ready to Book")).length;

    return { newOrders, atRisk, unassigned, readyToBook };
  }, [orders]);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply quick filter
    switch (activeFilter) {
      case "new":
        result = result.filter(o => hasStatus(o, "New"));
        break;
      case "at-risk":
        result = result.filter(o => 
          hasStatus(o, "At Risk") || 
          hasStatus(o, "Exception") ||
          (o.ageHours && o.ageHours > 24)
        );
        break;
      case "unassigned":
        result = result.filter(o => 
          hasStatus(o, "New") || 
          hasStatus(o, "Planning") ||
          hasStatus(o, "Ready to Book")
        );
        break;
      case "ready-to-book":
        result = result.filter(o => hasStatus(o, "Ready to Book"));
        break;
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.reference?.toLowerCase().includes(q) ||
        o.customer?.toLowerCase().includes(q) ||
        o.pickup?.toLowerCase().includes(q) ||
        o.delivery?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, activeFilter, searchQuery]);

  // Visible orders (for infinite scroll)
  const visibleOrders = useMemo(() => {
    if (!useInfiniteScroll) return filteredOrders;
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount, useInfiniteScroll]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!useInfiniteScroll || !scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrollThreshold = 100;

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      setVisibleCount(prev => Math.min(prev + pageSize, filteredOrders.length));
    }
  }, [useInfiniteScroll, pageSize, filteredOrders.length]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [activeFilter, searchQuery, pageSize]);

  const formatAge = (ageHours?: number) => {
    if (!ageHours) return null;
    if (ageHours < 1) return "Just now";
    if (ageHours < 24) return `${Math.round(ageHours)}h ago`;
    const days = Math.round(ageHours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      {/* Header with Search and Filters */}
      <MasterListHeader
        title="Active Orders"
        count={filteredOrders.length}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <QuickFilter
          label="All"
          count={orders.length}
          isActive={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        <QuickFilter
          label="New"
          count={filterCounts.newOrders}
          isActive={activeFilter === "new"}
          onClick={() => setActiveFilter("new")}
          variant="success"
        />
        <QuickFilter
          label="At Risk"
          count={filterCounts.atRisk}
          isActive={activeFilter === "at-risk"}
          onClick={() => setActiveFilter("at-risk")}
          variant="danger"
        />
        <QuickFilter
          label="Unassigned"
          count={filterCounts.unassigned}
          isActive={activeFilter === "unassigned"}
          onClick={() => setActiveFilter("unassigned")}
          variant="warning"
        />
        {filterCounts.readyToBook > 0 && (
          <QuickFilter
            label="Ready to Book"
            count={filterCounts.readyToBook}
            isActive={activeFilter === "ready-to-book"}
            onClick={() => setActiveFilter("ready-to-book")}
          />
        )}
      </MasterListHeader>

      {/* Order List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-[#5a5a6e] animate-spin" />
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="text-center py-8 text-[#5a5a6e] text-sm">
            {searchQuery || activeFilter !== "all"
              ? "No orders match your filters"
              : "No orders found"}
          </div>
        ) : (
          <>
            {visibleOrders.map((order) => {
              const age = formatAge(order.ageHours);
              const isAtRisk = order.status === "At Risk" || order.status === "Exception" || (order.ageHours && order.ageHours > 24);

              return (
                <MasterListCard
                  key={order.id}
                  id={order.id}
                  isSelected={selectedOrderId === order.id}
                  onClick={() => onSelectOrder(order.id)}
                  statusColor={statusBarColors[order.status] || "bg-zinc-500"}
                >
                  {/* Row 1: Order ID + Status Indicator + Age */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-[#e8e8ed]">
                        {order.orderNumber || order.id.substring(0, 10)}
                      </span>
                      {isAtRisk && (
                        <AlertTriangle className="w-3 h-3 text-[#c97a5a]" />
                      )}
                    </div>
                    {age && (
                      <span className={cn(
                        "text-[10px] font-medium",
                        isAtRisk ? "text-[#c97a5a]" : "text-[#5a5a6e]"
                      )}>
                        {age}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Customer */}
                  <div className="text-xs text-[#a0a0b0] font-medium mb-1 truncate">
                    {order.customer}
                  </div>

                  {/* Row 3: Origin → Destination */}
                  <div className="flex items-center gap-1.5 text-xs text-[#a0a0b0] mb-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[80px]">{order.pickup}</span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0 text-[#5a5a6e]" />
                    <span className="truncate max-w-[80px]">{order.delivery}</span>
                  </div>

                  {/* Row 4: Rate + Window */}
                  <div className="flex items-center justify-between text-[10px] text-[#5a5a6e]">
                    {order.rate !== undefined && order.rate > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" />
                        <span className="text-[#a0a0b0] font-medium">
                          {formatCurrency(order.rate)}
                        </span>
                      </div>
                    )}
                    {order.window && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[80px]">{order.window}</span>
                      </div>
                    )}
                    {order.laneMiles !== undefined && order.laneMiles > 0 && (
                      <span className="text-[#5a5a6e]">{order.laneMiles} mi</span>
                    )}
                  </div>
                </MasterListCard>
              );
            })}

            {/* Load More Indicator */}
            {useInfiniteScroll && visibleCount < filteredOrders.length && (
              <div className="py-3 text-center text-xs text-[#5a5a6e]">
                Scroll for more • {filteredOrders.length - visibleCount} remaining
              </div>
            )}
          </>
        )}
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <div className="flex-none border-t border-[#1c1c22] px-3 py-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 text-xs text-[#5a5a6e] hover:text-[#a0a0b0] transition-colors py-1.5"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      )}
    </>
  );
}
