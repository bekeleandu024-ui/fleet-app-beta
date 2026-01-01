"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useDispatchStore,
  selectDemandOrdersFiltered,
  selectAvailableDrivers,
  selectSelectedTrip,
  selectSelectedOrders,
  type DispatchOrder,
  type DraftTrip,
} from "@/lib/stores/dispatch-store";

// Import new components
import { DispatchTable } from "./components/dispatch-table";
import { CommandRail } from "./components/command-rail";

// ============================================================================
// MAIN DISPATCH BOARD PAGE - MASTER-DETAIL LAYOUT
// ============================================================================

export default function DispatchBoardPage() {
  const router = useRouter();

  // Store state
  const {
    demandOrders,
    draftTrips,
    drivers,
    brokerageOrders,
    isLoading,
    demandFilter,
    setDemandFilter,
    selectedOrderIds,
    selectedTripId,
    toggleOrderSelection,
    clearOrderSelection,
    selectAllOrders,
    selectTrip,
    createDraftTrip,
    deleteDraftTrip,
    publishTrip,
    refreshAll,
    selectedOrderBids,
    kickToBrokerage,
    postToCarriers,
    awardBid,
  } = useDispatchStore();

  // Fetch data on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Derived selectors
  const filteredDemandOrders = useMemo(
    () => selectDemandOrdersFiltered(useDispatchStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demandOrders, demandFilter, draftTrips]
  );

  const availableDrivers = useMemo(
    () => selectAvailableDrivers(useDispatchStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drivers]
  );

  const selectedTrip = useMemo(
    () => selectSelectedTrip(useDispatchStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTripId, draftTrips]
  );

  const selectedOrders = useMemo(
    () => selectSelectedOrders(useDispatchStore.getState()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedOrderIds, demandOrders]
  );

  // Determine selection mode for CommandRail
  const selectionMode = useMemo(() => {
    if (selectedTripId && selectedTrip) return "trip";
    if (selectedOrderIds.length > 0) return "orders";
    return "none";
  }, [selectedTripId, selectedTrip, selectedOrderIds]);

  // Calculate summary stats
  const totalRevenue = useMemo(
    () =>
      filteredDemandOrders.reduce((sum, o) => sum + (o.quotedRate || 0), 0) +
      draftTrips.reduce((sum, t) => sum + t.projectedRevenue, 0),
    [filteredDemandOrders, draftTrips]
  );

  const highPriorityCount = useMemo(
    () =>
      filteredDemandOrders.filter((o) => {
        // Consider high priority if pickup is within 24 hours
        if (!o.pickupTime) return false;
        const pickupDate = new Date(o.pickupTime);
        const now = new Date();
        const diff = pickupDate.getTime() - now.getTime();
        return diff > 0 && diff < 24 * 60 * 60 * 1000;
      }).length,
    [filteredDemandOrders]
  );

  // Handlers
  const handleRowClick = useCallback(
    (order: DispatchOrder) => {
      // If clicking while a trip is selected, deselect the trip first
      if (selectedTripId) {
        selectTrip(null);
      }
      toggleOrderSelection(order.id);
    },
    [selectedTripId, selectTrip, toggleOrderSelection]
  );

  const handleTripClick = useCallback(
    (trip: DraftTrip) => {
      // If clicking a trip, clear order selection and select the trip
      if (selectedOrderIds.length > 0) {
        clearOrderSelection();
      }
      selectTrip(trip.id === selectedTripId ? null : trip.id);
    },
    [selectedOrderIds, selectedTripId, clearOrderSelection, selectTrip]
  );

  const handleClearSelection = useCallback(() => {
    clearOrderSelection();
    selectTrip(null);
  }, [clearOrderSelection, selectTrip]);

  const handleCreateTrip = useCallback(
    (orderIds: string[]) => {
      createDraftTrip(orderIds);
      clearOrderSelection();
    },
    [createDraftTrip, clearOrderSelection]
  );

  const handleAssignToDriver = useCallback(
    async (tripId: string, driverId: string) => {
      await publishTrip(tripId, driverId, "driver");
    },
    [publishTrip]
  );
  
  const handleKickToBrokerage = useCallback(
    async (tripId: string) => {
      const success = await publishTrip(tripId, "brokerage", "carrier");
      if (success) {
        // Navigate to Farm Out page after successfully kicking
        router.push("/farm-out");
      }
    },
    [publishTrip, router]
  );

  const handlePostToCarriers = useCallback(
    async (orderId: string) => {
      await postToCarriers(orderId);
    },
    [postToCarriers]
  );

  const handleAwardBid = useCallback(
    async (orderId: string, bidId: string) => {
      await awardBid(orderId, bidId);
    },
    [awardBid]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Dispatch Command Center</h1>
          <p className="text-xs text-zinc-500">
            {filteredDemandOrders.length} orders • {draftTrips.length} draft trips
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search orders..."
              value={demandFilter.search}
              onChange={(e) => setDemandFilter({ search: e.target.value })}
              className="w-64 h-9 pl-9 bg-zinc-900 border-zinc-700 text-sm"
            />
          </div>

          {/* Filter Button */}
          <Button size="sm" variant="subtle" className="h-9 border-zinc-700">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          {/* Refresh */}
          <Button
            size="sm"
            variant="subtle"
            className="h-9 border-zinc-700"
            onClick={() => refreshAll()}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>

          {/* New Order */}
          <Link href="/orders/new">
            <Button
              size="sm"
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content: Master-Detail Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Dispatch Grid (65%) */}
        <div className="w-[65%] flex flex-col border-r border-zinc-800">
          {/* Table Toolbar */}
          <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                {filteredDemandOrders.length} available
              </Badge>
              {draftTrips.length > 0 && (
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                  {draftTrips.length} draft trips
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">
                {selectedOrderIds.length > 0
                  ? `${selectedOrderIds.length} selected`
                  : selectedTripId
                  ? "1 trip selected"
                  : "Select rows to plan"}
              </span>
            </div>
          </div>

          {/* Dispatch Table */}
          <div className="flex-1 overflow-hidden bg-zinc-950/50">
            <DispatchTable
              orders={filteredDemandOrders}
              trips={draftTrips}
              selectedOrderIds={selectedOrderIds}
              selectedTripId={selectedTripId}
              onToggleOrderSelection={toggleOrderSelection}
              onSelectAllOrders={selectAllOrders}
              onClearSelection={handleClearSelection}
              onRowClick={handleRowClick}
              onTripClick={handleTripClick}
            />
          </div>
        </div>

        {/* Right Panel: Command Rail (35%) */}
        <div className="w-[35%] flex flex-col bg-zinc-900/30 overflow-hidden min-h-0">
          <CommandRail
            selectedOrders={selectedOrders}
            selectedTrip={selectedTrip}
            selectionMode={selectionMode as "none" | "orders" | "trip"}
            drivers={availableDrivers}
            brokerageOrders={brokerageOrders}
            bids={selectedOrderBids}
            totalOrders={filteredDemandOrders.length}
            highPriorityCount={highPriorityCount}
            totalRevenue={totalRevenue}
            onCreateTrip={handleCreateTrip}
            onDeleteTrip={deleteDraftTrip}
            onAssignToDriver={handleAssignToDriver}
            onKickToBrokerage={handleKickToBrokerage}
            onPostToCarriers={handlePostToCarriers}
            onAwardBid={handleAwardBid}
            onClearSelection={handleClearSelection}
          />
        </div>
      </div>
    </div>
  );
}
