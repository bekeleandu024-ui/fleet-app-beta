"use client";

import { useMemo } from "react";
import {
  Truck,
  MapPin,
  Package,
  Clock,
  CheckSquare,
  Square,
  AlertCircle,
  Circle,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DispatchOrder, DispatchStatus, DraftTrip } from "@/lib/stores/dispatch-store";

// ============================================================================
// STATUS ICON COMPONENT
// ============================================================================

const statusConfig: Record<DispatchStatus, { label: string; color: string; icon: typeof Circle }> = {
  NEW: { label: "New", color: "text-blue-400", icon: Circle },
  PLANNED: { label: "Planned", color: "text-violet-400", icon: Circle },
  FLEET_DISPATCH: { label: "Fleet", color: "text-emerald-400", icon: Truck },
  BROKERAGE_PENDING: { label: "Brokerage", color: "text-amber-400", icon: AlertCircle },
  POSTED_EXTERNAL: { label: "Posted", color: "text-purple-400", icon: ArrowUpRight },
  COVERED_INTERNAL: { label: "Covered", color: "text-emerald-400", icon: CheckSquare },
  COVERED_EXTERNAL: { label: "Covered", color: "text-cyan-400", icon: CheckSquare },
};

function StatusIcon({ status }: { status: DispatchStatus }) {
  const config = statusConfig[status] || statusConfig.NEW;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("h-3.5 w-3.5", config.color)} />
      <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
    </div>
  );
}

// ============================================================================
// TABLE PROPS & TYPES
// ============================================================================

interface DispatchTableProps {
  orders: DispatchOrder[];
  trips: DraftTrip[];
  selectedOrderIds: string[];
  selectedTripId: string | null;
  onToggleOrderSelection: (orderId: string) => void;
  onSelectAllOrders: (orderIds: string[]) => void;
  onClearSelection: () => void;
  onRowClick: (order: DispatchOrder) => void;
  onTripClick: (trip: DraftTrip) => void;
}

// ============================================================================
// MAIN DISPATCH TABLE COMPONENT
// ============================================================================

export function DispatchTable({
  orders,
  trips,
  selectedOrderIds,
  selectedTripId,
  onToggleOrderSelection,
  onSelectAllOrders,
  onClearSelection,
  onRowClick,
  onTripClick,
}: DispatchTableProps) {
  // Determine if all orders are selected
  const allSelected = orders.length > 0 && selectedOrderIds.length === orders.length;
  const someSelected = selectedOrderIds.length > 0 && selectedOrderIds.length < orders.length;

  // Extract city from location string (e.g., "Chicago, IL" -> "Chicago")
  const extractCity = (location: string | null | undefined): string => {
    if (!location) return "—";
    const parts = location.split(",");
    return parts[0]?.trim() || location;
  };

  // Format weight
  const formatWeight = (weight: number | null | undefined): string => {
    if (!weight) return "—";
    return `${Math.round(weight / 1000)}K`;
  };

  // Format date
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Toggle select all
  const handleSelectAll = () => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAllOrders(orders.map((o) => o.id));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Dense Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          {/* Table Header */}
          <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur">
            <tr className="border-b border-zinc-800">
              <th className="w-10 px-3 py-2 text-left">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                  ) : someSelected ? (
                    <div className="h-4 w-4 rounded border border-emerald-400 bg-emerald-400/20" />
                  ) : (
                    <Square className="h-4 w-4 text-zinc-500 hover:text-zinc-300" />
                  )}
                </button>
              </th>
              <th className="w-16 px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Status
              </th>
              <th className="w-24 px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Customer
              </th>
              <th className="w-28 px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Origin
              </th>
              <th className="w-28 px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Dest
              </th>
              <th className="w-24 px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Pickup
              </th>
              <th className="w-20 px-3 py-2 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Equip
              </th>
              <th className="w-16 px-3 py-2 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Weight
              </th>
              <th className="w-20 px-3 py-2 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Rate
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-zinc-800/50">
            {/* Draft Trips Section */}
            {trips.length > 0 && (
              <>
                <tr className="bg-violet-500/5">
                  <td colSpan={10} className="px-3 py-1.5">
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
                      Draft Trips ({trips.length})
                    </span>
                  </td>
                </tr>
                {trips.map((trip) => (
                  <tr
                    key={trip.id}
                    onClick={() => onTripClick(trip)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedTripId === trip.id
                        ? "bg-violet-500/20 hover:bg-violet-500/25"
                        : "bg-violet-500/5 hover:bg-violet-500/10"
                    )}
                  >
                    <td className="px-3 py-2">
                      <Package className="h-4 w-4 text-violet-400" />
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-medium text-violet-400">Trip</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs font-bold text-zinc-100">
                        {trip.tripNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-zinc-400">
                        {trip.orders.length} orders consolidated
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-400 truncate max-w-[120px]">
                      {extractCity(trip.pickupLocations[0])}
                      {trip.pickupLocations.length > 1 && (
                        <span className="text-zinc-600"> +{trip.pickupLocations.length - 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-400 truncate max-w-[120px]">
                      {extractCity(trip.dropoffLocations[0])}
                      {trip.dropoffLocations.length > 1 && (
                        <span className="text-zinc-600"> +{trip.dropoffLocations.length - 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">—</td>
                    <td className="px-3 py-2 text-zinc-400">{trip.equipmentType}</td>
                    <td className="px-3 py-2 text-right text-zinc-400">
                      {formatWeight(trip.totalWeightLbs)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-mono text-emerald-400 font-semibold">
                        ${trip.projectedRevenue.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Orders Section */}
            {orders.length > 0 && (
              <>
                {trips.length > 0 && (
                  <tr className="bg-zinc-900/50">
                    <td colSpan={10} className="px-3 py-1.5">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        Available Orders ({orders.length})
                      </span>
                    </td>
                  </tr>
                )}
                {orders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => onRowClick(order)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected
                          ? "bg-blue-500/10 hover:bg-blue-500/15"
                          : "hover:bg-zinc-900/70"
                      )}
                    >
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleOrderSelection(order.id)}
                          className="flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Square className="h-4 w-4 text-zinc-500 hover:text-zinc-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <StatusIcon status={order.dispatchStatus} />
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs font-bold text-zinc-100">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-zinc-200 truncate block max-w-[180px]">
                          {order.customerName}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-zinc-400 truncate max-w-[120px]">
                        {extractCity(order.pickupLocation)}
                      </td>
                      <td className="px-3 py-2 text-zinc-400 truncate max-w-[120px]">
                        {extractCity(order.dropoffLocation)}
                      </td>
                      <td className="px-3 py-2 text-zinc-400">
                        {formatDate(order.pickupTime)}
                      </td>
                      <td className="px-3 py-2 text-zinc-400">
                        {order.equipmentType || "Van"}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-400">
                        {formatWeight(order.totalWeightLbs)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-mono text-emerald-400 font-semibold">
                          ${order.quotedRate?.toLocaleString() || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </>
            )}

            {/* Empty State */}
            {orders.length === 0 && trips.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-12 text-center">
                  <Package className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No orders available</p>
                  <p className="text-zinc-600 text-xs mt-1">
                    New orders will appear here for dispatch
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Selection Summary Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="flex-none border-t border-zinc-800 bg-blue-500/5 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-400">
              <strong>{selectedOrderIds.length}</strong> order{selectedOrderIds.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={onClearSelection}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
