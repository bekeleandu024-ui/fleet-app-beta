"use client";

import { MapPin, Clock, TrendingUp, AlertTriangle, Package } from "lucide-react";
import { DispatchOrder } from "../types";

interface TripsTableViewProps {
  trips: DispatchOrder[];
}

export function TripsTableView({ trips }: TripsTableViewProps) {
  const getStatusColor = (status: DispatchOrder["status"]) => {
    switch (status) {
      case "unassigned":
        return "bg-[#FFC857]/10 text-[#FFC857] border-[#FFC857]/30";
      case "assigned":
        return "bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30";
      case "en_route_pickup":
        return "bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/30";
      case "at_pickup":
        return "bg-[#FF8A00]/10 text-[#FF8A00] border-[#FF8A00]/30";
      case "in_transit":
        return "bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30";
      case "at_delivery":
        return "bg-[#FCD34D]/10 text-[#FCD34D] border-[#FCD34D]/30";
      case "completed":
        return "bg-[#24D67B]/10 text-[#24D67B] border-[#24D67B]/30";
    }
  };

  const getStatusLabel = (status: DispatchOrder["status"]) => {
    switch (status) {
      case "unassigned":
        return "Unassigned";
      case "assigned":
        return "Assigned";
      case "en_route_pickup":
        return "En Route to Pickup";
      case "at_pickup":
        return "At Pickup";
      case "in_transit":
        return "In Transit";
      case "at_delivery":
        return "At Delivery";
      case "completed":
        return "Completed";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-[#FF4D4D]";
      case "medium":
        return "text-[#FFC857]";
      case "low":
        return "text-[#6C7484]";
      default:
        return "text-[#6C7484]";
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 15) return "text-[#24D67B]";
    if (margin >= 10) return "text-[#FFC857]";
    return "text-[#FF4D4D]";
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        {/* Header */}
        <thead className="sticky top-0 bg-[#0F1420] border-b border-[#1E2638] z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Route
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Driver
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Pickup Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Delivery Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Miles
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Priority
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Cost
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Margin
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#6C7484] uppercase tracking-wider">
              Progress
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-[#0A0F1E] divide-y divide-[#1E2638]">
          {trips.map((trip) => (
            <tr
              key={trip.id}
              className="hover:bg-[#0B1020] transition-colors cursor-pointer"
            >
              {/* Order ID */}
              <td className="px-4 py-3 whitespace-nowrap">
                <code className="text-xs font-mono text-[#60A5FA]">{trip.id}</code>
              </td>

              {/* Customer */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-[#E6EAF2]">{trip.customer}</div>
              </td>

              {/* Route */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-xs text-[#9AA4B2]">
                  <MapPin className="h-3 w-3 text-[#60A5FA] flex-shrink-0" />
                  <span className="truncate max-w-[200px]">
                    {trip.origin.city}, {trip.origin.state} → {trip.destination.city},{" "}
                    {trip.destination.state}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                    trip.status
                  )}`}
                >
                  {getStatusLabel(trip.status)}
                </span>
              </td>

              {/* Driver */}
              <td className="px-4 py-3 whitespace-nowrap">
                {trip.driver ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#60A5FA]/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-[#60A5FA]">
                        {trip.driver.initials}
                      </span>
                    </div>
                    <span className="text-sm text-[#E6EAF2]">{trip.driver.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-[#6C7484]">—</span>
                )}
              </td>

              {/* Pickup Time */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1 text-xs text-[#9AA4B2]">
                  <Clock className="h-3 w-3 text-[#6C7484]" />
                  {new Date(trip.pickupTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </td>

              {/* Delivery Time */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1 text-xs text-[#9AA4B2]">
                  <Clock className="h-3 w-3 text-[#6C7484]" />
                  {new Date(trip.deliveryTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </td>

              {/* Miles */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-mono text-[#E6EAF2]">{trip.miles}</span>
              </td>

              {/* Priority */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {trip.priority === "high" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-[#FF4D4D]" />
                  )}
                  <span className={`text-xs font-medium uppercase ${getPriorityColor(trip.priority)}`}>
                    {trip.priority}
                  </span>
                </div>
              </td>

              {/* Cost */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-mono text-[#9AA4B2]">
                  ${trip.estCost.toFixed(2)}
                </span>
              </td>

              {/* Revenue */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-mono text-[#E6EAF2]">
                  ${trip.revenue.toFixed(2)}
                </span>
              </td>

              {/* Margin */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-3.5 w-3.5 ${getMarginColor(trip.margin)}`} />
                  <span className={`text-sm font-semibold ${getMarginColor(trip.margin)}`}>
                    {trip.margin.toFixed(1)}%
                  </span>
                </div>
              </td>

              {/* Progress */}
              <td className="px-4 py-3 whitespace-nowrap">
                {trip.progressPct !== undefined ? (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-[#1E2638] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#60A5FA] rounded-full transition-all"
                        style={{ width: `${trip.progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[#9AA4B2]">{trip.progressPct}%</span>
                  </div>
                ) : trip.eta ? (
                  <div className="flex items-center gap-1 text-xs text-[#FFC857]">
                    <Clock className="h-3 w-3" />
                    {trip.eta}
                  </div>
                ) : trip.dwellTime ? (
                  <div className="flex items-center gap-1 text-xs text-[#FF8A00]">
                    <Package className="h-3 w-3" />
                    {trip.dwellTime}m dwell
                  </div>
                ) : (
                  <span className="text-xs text-[#6C7484]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-[#6C7484] mb-3 opacity-30" />
          <p className="text-sm text-[#6C7484]">No trips found</p>
          <p className="text-xs text-[#6C7484] mt-1">Adjust your filters to see more results</p>
        </div>
      )}
    </div>
  );
}
