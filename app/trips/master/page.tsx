"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck, RefreshCw, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  MasterDetailLayout,
  MasterDetailEmptyState,
  TripMasterList,
  TripDetailPanel,
} from "@/components/master-detail";
import { UnsavedChangesDialog, useNavigationGuard } from "@/hooks/use-dirty-state";
import { useTripRealtimeUpdates } from "@/hooks/use-realtime-updates";
import { fetchTrips, fetchTripDetail } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { TripListItem, TripDetail } from "@/lib/types";

/**
 * Trips Master-Detail Page
 * 
 * Full-Width Split-Pane Layout:
 * - Left Pane (30%): Scrollable list with Quick Filters (At Risk, Unassigned)
 * - Right Pane (70%): 3-Column Grid Detail Panel
 * 
 * Features:
 * - Lazy-loading/Infinite scroll on left rail
 * - Real-time WebSocket updates
 * - Quick Filters at top of Master List
 * - Dirty state warnings
 */
export default function TripsMasterDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Selected trip from URL or state
  const selectedTripId = searchParams.get("id");

  // Fetch trips list
  const {
    data: tripsData,
    isLoading: isLoadingTrips,
    refetch: refetchTrips,
  } = useQuery({
    queryKey: queryKeys.trips({ status: "active" }),
    queryFn: () => fetchTrips("active"),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch selected trip detail
  const {
    data: tripDetail,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: queryKeys.trip(selectedTripId || ""),
    queryFn: () => fetchTripDetail(selectedTripId!),
    enabled: Boolean(selectedTripId),
    refetchInterval: 15000, // More frequent for active trip
  });

  // Real-time updates for selected trip
  const {
    data: realtimeTripData,
    isStale,
    lastUpdateSource,
    isConnected,
  } = useTripRealtimeUpdates(selectedTripId, tripDetail ?? null, (updated) => {
    // Optimistically update the query cache
    queryClient.setQueryData(queryKeys.trip(selectedTripId!), updated);
  });

  // Use realtime data if available, fallback to query data
  const currentTripDetail = realtimeTripData ?? tripDetail;

  // Navigation guard for dirty state
  const {
    isDirty,
    isSaving,
    showDialog,
    guardNavigation,
    dialogProps,
    updateField,
    save,
  } = useNavigationGuard<TripDetail>({
    initialData: currentTripDetail ?? null,
    onSave: async (data) => {
      // TODO: Implement trip update API
      console.log("Saving trip:", data);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    autoSaveDelay: 3000, // Auto-save after 3 seconds of inactivity
  });

  // Handle trip selection
  const handleSelectTrip = useCallback((tripId: string) => {
    guardNavigation(() => {
      // Update URL with selected trip ID
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", tripId);
      router.push(`/trips/master?${params.toString()}`);
    });
  }, [guardNavigation, router, searchParams]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetchTrips();
    if (selectedTripId) {
      refetchDetail();
    }
  }, [refetchTrips, refetchDetail, selectedTripId]);

  // Trips list with loading state
  const trips = useMemo(() => tripsData?.data ?? [], [tripsData]);

  return (
    <>
      <MasterDetailLayout
        header={
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-[#e8e8ed]">Trips</h1>
              {tripsData?.stats && (
                <div className="hidden md:flex items-center gap-3 text-xs">
                  <span className="text-[#5a5a6e]">
                    <span className="text-[#a0a0b0] font-medium">{tripsData.stats.total}</span> total
                  </span>
                  <span className="text-[#5a5a6e]">
                    <span className="text-[#a0a0b0] font-medium">{tripsData.stats.inTransit}</span> in transit
                  </span>
                  {tripsData.stats.exceptions > 0 && (
                    <span className="text-[#b45353]">
                      <AlertCircle className="inline w-3 h-3 mr-1" />
                      {tripsData.stats.exceptions} exceptions
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* WebSocket Status - Keep subtle green for Live system status */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1c1c22] border border-[#1c1c22]">
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#5a7a6b]" : "bg-[#5a5a6e]"}`} />
                <span className="text-[10px] text-[#5a5a6e]">
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>

              {/* Dirty Indicator */}
              {isDirty && (
                <span className="text-xs text-[#c97a5a] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c97a5a]" />
                  Unsaved
                </span>
              )}

              {/* Refresh */}
              <Button
                size="sm"
                variant="subtle"
                onClick={handleRefresh}
                disabled={isLoadingTrips}
                className="h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingTrips ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              {/* New Trip */}
              <Link href="/trips/new">
                <Button size="sm" className="h-8 bg-[#5a6a8a] hover:bg-[#6a7a9a]">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  New Trip
                </Button>
              </Link>
            </div>
          </div>
        }
        masterList={
          <TripMasterList
            trips={trips}
            selectedTripId={selectedTripId}
            onSelectTrip={handleSelectTrip}
            isLoading={isLoadingTrips}
            onRefresh={refetchTrips}
            useInfiniteScroll={true}
            pageSize={25}
          />
        }
        detailPanel={
          currentTripDetail ? (
            <TripDetailPanel
              trip={currentTripDetail}
              onEdit={() => router.push(`/trips/${selectedTripId}/edit`)}
              onCancel={() => console.log("Cancel trip")}
              onDuplicate={() => console.log("Duplicate trip")}
              isEditing={false}
            />
          ) : isLoadingDetail ? (
            <TripDetailSkeleton />
          ) : null
        }
        isEmpty={!selectedTripId && !isLoadingDetail}
        emptyState={
          <MasterDetailEmptyState
            icon={<Truck className="w-12 h-12" />}
            title="Select a Trip"
            description="Choose a trip from the list to view its details, itinerary, and financials."
          />
        }
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog {...dialogProps} />

      {/* Stale Data Banner */}
      {isStale && selectedTripId && (
        <div className="fixed bottom-4 right-4 bg-amber-900/90 border border-amber-700 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-200">
            Trip updated by {lastUpdateSource}
          </span>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => refetchDetail()}
            className="h-7 text-xs"
          >
            Refresh
          </Button>
        </div>
      )}
    </>
  );
}

function TripDetailSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header Skeleton */}
      <div className="h-16 rounded-lg bg-zinc-900 animate-pulse" />
      
      {/* 3-Column Grid Skeleton */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <div className="h-64 rounded-lg bg-zinc-900 animate-pulse" />
          <div className="h-24 rounded-lg bg-zinc-900 animate-pulse" />
        </div>
        <div className="col-span-4 space-y-4">
          <div className="h-32 rounded-lg bg-zinc-900 animate-pulse" />
          <div className="h-32 rounded-lg bg-zinc-900 animate-pulse" />
          <div className="h-40 rounded-lg bg-zinc-900 animate-pulse" />
        </div>
        <div className="col-span-3 space-y-4">
          <div className="h-48 rounded-lg bg-zinc-900 animate-pulse" />
          <div className="h-24 rounded-lg bg-zinc-900 animate-pulse" />
          <div className="h-32 rounded-lg bg-zinc-900 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
