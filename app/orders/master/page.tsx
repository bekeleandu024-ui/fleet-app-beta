"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, RefreshCw, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  MasterDetailLayout,
  MasterDetailEmptyState,
  OrderMasterList,
} from "@/components/master-detail";
import { OrderDetailPanel } from "@/components/master-detail/order-detail-panel";
import { UnsavedChangesDialog, useNavigationGuard } from "@/hooks/use-dirty-state";
import { useOrderRealtimeUpdates } from "@/hooks/use-realtime-updates";
import { fetchOrders, fetchOrderDetail } from "@/lib/api";
import { queryKeys } from "@/lib/query";
import type { OrderListItem, OrderDetail } from "@/lib/types";

/**
 * Orders Master-Detail Page
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
export default function OrdersMasterDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Selected order from URL
  const selectedOrderId = searchParams.get("id");

  // Fetch orders list
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: fetchOrders,
    refetchInterval: 30000,
  });

  // Fetch selected order detail
  const {
    data: orderDetail,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: queryKeys.order(selectedOrderId || ""),
    queryFn: () => fetchOrderDetail(selectedOrderId!),
    enabled: Boolean(selectedOrderId),
    refetchInterval: 15000,
  });

  // Real-time updates for selected order
  const {
    data: realtimeOrderData,
    isStale,
    isConnected,
  } = useOrderRealtimeUpdates(selectedOrderId, orderDetail ?? null, (updated) => {
    queryClient.setQueryData(queryKeys.order(selectedOrderId!), updated);
  });

  // Use realtime data if available
  const currentOrderDetail = realtimeOrderData ?? orderDetail;

  // Navigation guard for dirty state
  const {
    isDirty,
    isSaving,
    showDialog,
    guardNavigation,
    dialogProps,
  } = useNavigationGuard<OrderDetail>({
    initialData: currentOrderDetail ?? null,
    onSave: async (data) => {
      console.log("Saving order:", data);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    autoSaveDelay: 3000,
  });

  // Handle order selection
  const handleSelectOrder = useCallback((orderId: string) => {
    guardNavigation(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", orderId);
      router.push(`/orders/master?${params.toString()}`);
    });
  }, [guardNavigation, router, searchParams]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetchOrders();
    if (selectedOrderId) {
      refetchDetail();
    }
  }, [refetchOrders, refetchDetail, selectedOrderId]);

  // Orders list
  const orders = useMemo(() => ordersData?.data ?? [], [ordersData]);

  return (
    <>
      <MasterDetailLayout
        header={
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-[#e8e8ed]">Orders</h1>
              {ordersData?.stats && (
                <div className="hidden md:flex items-center gap-3 text-xs">
                  <span className="text-[#5a5a6e]">
                    <span className="text-[#a0a0b0] font-medium">{ordersData.stats.total}</span> total
                  </span>
                  <span className="text-[#5a5a6e]">
                    <span className="text-[#a0a0b0] font-medium">{ordersData.stats.new}</span> new
                  </span>
                  {ordersData.stats.delayed > 0 && (
                    <span className="text-[#b45353]">
                      <AlertCircle className="inline w-3 h-3 mr-1" />
                      {ordersData.stats.delayed} at risk
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
                disabled={isLoadingOrders}
                className="h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingOrders ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              {/* New Order */}
              <Link href="/orders/new">
                <Button size="sm" className="h-8 bg-[#5a6a8a] hover:bg-[#6a7a9a]">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  New Order
                </Button>
              </Link>
            </div>
          </div>
        }
        masterList={
          <OrderMasterList
            orders={orders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={handleSelectOrder}
            isLoading={isLoadingOrders}
            onRefresh={refetchOrders}
            useInfiniteScroll={true}
            pageSize={25}
          />
        }
        detailPanel={
          currentOrderDetail ? (
            <OrderDetailPanel
              order={currentOrderDetail as any}
              onEdit={() => router.push(`/orders/${selectedOrderId}/edit`)}
              onCancel={() => console.log("Cancel order")}
              onDuplicate={() => console.log("Duplicate order")}
            />
          ) : isLoadingDetail ? (
            <OrderDetailSkeleton />
          ) : null
        }
        isEmpty={!selectedOrderId && !isLoadingDetail}
        emptyState={
          <MasterDetailEmptyState
            icon={<Package className="w-12 h-12" />}
            title="Select an Order"
            description="Choose an order from the list to view its details, route, and financials."
          />
        }
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog {...dialogProps} />

      {/* Stale Data Banner */}
      {isStale && selectedOrderId && (
        <div className="fixed bottom-4 right-4 bg-amber-900/90 border border-amber-700 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-200">
            Order updated
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

function OrderDetailSkeleton() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header Skeleton */}
      <div className="h-16 rounded-lg bg-[#1c1c22] animate-pulse" />
      
      {/* 3-Column Grid Skeleton */}
      <div className="flex-1 grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <div className="h-48 rounded-lg bg-[#1c1c22] animate-pulse" />
          <div className="h-24 rounded-lg bg-[#1c1c22] animate-pulse" />
        </div>
        <div className="col-span-4 space-y-4">
          <div className="h-32 rounded-lg bg-[#1c1c22] animate-pulse" />
          <div className="h-24 rounded-lg bg-[#1c1c22] animate-pulse" />
          <div className="h-32 rounded-lg bg-[#1c1c22] animate-pulse" />
        </div>
        <div className="col-span-3 space-y-4">
          <div className="h-40 rounded-lg bg-[#1c1c22] animate-pulse" />
          <div className="h-24 rounded-lg bg-[#1c1c22] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
