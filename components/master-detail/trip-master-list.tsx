"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  Truck,
  User,
  MapPin,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MasterListHeader,
  MasterListCard,
  QuickFilter,
} from "./master-detail-layout";
import type { TripListItem } from "@/lib/types";

// Status colors for the indicator bar - Enterprise neutral with color-as-exception
const statusBarColors: Record<string, string> = {
  "Assigned": "bg-[#5a5a6e]",
  "Dispatched": "bg-[#5a5a6e]",
  "At Pickup": "bg-[#c97a5a]",
  "In Transit": "bg-[#5a5a6e]",
  "At Delivery": "bg-[#5a5a6e]",
  "Delivered": "bg-[#5a5a6e]",
  "Completed": "bg-[#3a3a42]",
  "Cancelled": "bg-[#b45353]",
  "Pending Farm Out": "bg-[#c97a5a]",
  "Posted to Carriers": "bg-[#5a5a6e]",
  "Covered (External)": "bg-[#5a5a6e]",
};

// Quick filter options
type QuickFilterType = "all" | "at-risk" | "unassigned" | "in-transit" | "exceptions";

interface TripMasterListProps {
  trips: TripListItem[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  /** Whether to use infinite scroll (Option 2) */
  useInfiniteScroll?: boolean;
  /** Page size for infinite scroll */
  pageSize?: number;
}

export function TripMasterList({
  trips,
  selectedTripId,
  onSelectTrip,
  isLoading = false,
  onRefresh,
  useInfiniteScroll = true,
  pageSize = 20,
}: TripMasterListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<QuickFilterType>("all");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const atRisk = trips.filter(t => 
      t.exceptions > 0 || 
      t.status === "At Risk" ||
      (t.eta && new Date(t.eta) < new Date())
    ).length;
    const unassigned = trips.filter(t => !t.driver || t.driver === "Unassigned").length;
    const inTransit = trips.filter(t => t.status === "In Transit").length;
    const exceptions = trips.filter(t => t.exceptions > 0).length;

    return { atRisk, unassigned, inTransit, exceptions };
  }, [trips]);

  // Filter and search trips
  const filteredTrips = useMemo(() => {
    let result = trips;

    // Apply quick filter
    switch (activeFilter) {
      case "at-risk":
        result = result.filter(t => 
          t.exceptions > 0 || 
          t.status === "At Risk" ||
          (t.eta && new Date(t.eta) < new Date())
        );
        break;
      case "unassigned":
        result = result.filter(t => !t.driver || t.driver === "Unassigned");
        break;
      case "in-transit":
        result = result.filter(t => t.status === "In Transit");
        break;
      case "exceptions":
        result = result.filter(t => t.exceptions > 0);
        break;
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.tripNumber.toLowerCase().includes(q) ||
        t.customer?.toLowerCase().includes(q) ||
        t.driver?.toLowerCase().includes(q) ||
        t.pickup?.toLowerCase().includes(q) ||
        t.delivery?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [trips, activeFilter, searchQuery]);

  // Visible trips (for infinite scroll)
  const visibleTrips = useMemo(() => {
    if (!useInfiniteScroll) return filteredTrips;
    return filteredTrips.slice(0, visibleCount);
  }, [filteredTrips, visibleCount, useInfiniteScroll]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!useInfiniteScroll || !scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrollThreshold = 100; // pixels from bottom

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      setVisibleCount(prev => Math.min(prev + pageSize, filteredTrips.length));
    }
  }, [useInfiniteScroll, pageSize, filteredTrips.length]);

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [activeFilter, searchQuery, pageSize]);

  const formatTimestamp = (eta?: string) => {
    if (!eta) return null;
    const date = new Date(eta);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return { text: `${Math.abs(diffHours)}h late`, isLate: true };
    } else if (diffHours < 24) {
      return { text: `ETA ${diffHours}h`, isLate: false };
    } else {
      return { text: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), isLate: false };
    }
  };

  return (
    <>
      {/* Header with Search and Filters */}
      <MasterListHeader
        title="Active Trips"
        count={filteredTrips.length}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <QuickFilter
          label="All"
          count={trips.length}
          isActive={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
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
        <QuickFilter
          label="In Transit"
          count={filterCounts.inTransit}
          isActive={activeFilter === "in-transit"}
          onClick={() => setActiveFilter("in-transit")}
        />
        {filterCounts.exceptions > 0 && (
          <QuickFilter
            label="Exceptions"
            count={filterCounts.exceptions}
            isActive={activeFilter === "exceptions"}
            onClick={() => setActiveFilter("exceptions")}
            variant="danger"
          />
        )}
      </MasterListHeader>

      {/* Trip List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-[#5a5a6e] animate-spin" />
          </div>
        ) : visibleTrips.length === 0 ? (
          <div className="text-center py-8 text-[#5a5a6e] text-sm">
            {searchQuery || activeFilter !== "all"
              ? "No trips match your filters"
              : "No active trips"}
          </div>
        ) : (
          <>
            {visibleTrips.map((trip) => {
              const timestamp = formatTimestamp(trip.eta);
              const isAtRisk = trip.exceptions > 0 || timestamp?.isLate;

              return (
                <MasterListCard
                  key={trip.id}
                  id={trip.id}
                  isSelected={selectedTripId === trip.id}
                  onClick={() => onSelectTrip(trip.id)}
                  statusColor={statusBarColors[trip.status] || "bg-zinc-500"}
                >
                  {/* Row 1: Trip ID + Status + Timestamp */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-[#e8e8ed]">
                        {trip.tripNumber}
                      </span>
                      {isAtRisk && (
                        <AlertTriangle className="w-3 h-3 text-[#c97a5a]" />
                      )}
                    </div>
                    {timestamp && (
                      <span className={cn(
                        "text-[10px] font-medium",
                        timestamp.isLate ? "text-[#b45353]" : "text-[#5a5a6e]"
                      )}>
                        {timestamp.text}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Origin → Destination */}
                  <div className="flex items-center gap-1.5 text-xs text-[#a0a0b0] mb-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[80px]">{trip.pickup}</span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0 text-[#5a5a6e]" />
                    <span className="truncate max-w-[80px]">{trip.delivery}</span>
                  </div>

                  {/* Row 3: Driver + Unit */}
                  <div className="flex items-center justify-between text-[10px] text-[#5a5a6e]">
                    <div className="flex items-center gap-1">
                      <User className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[70px]">
                        {trip.driver || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="w-2.5 h-2.5" />
                      <span>{trip.unit || "—"}</span>
                    </div>
                    {trip.exceptions > 0 && (
                      <span className="text-[#c97a5a]">
                        {trip.exceptions} exc
                      </span>
                    )}
                  </div>
                </MasterListCard>
              );
            })}

            {/* Load More Indicator */}
            {useInfiniteScroll && visibleCount < filteredTrips.length && (
              <div className="py-3 text-center text-xs text-[#5a5a6e]">
                Scroll for more • {filteredTrips.length - visibleCount} remaining
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
