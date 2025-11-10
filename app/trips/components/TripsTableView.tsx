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
        return "bg-fleet-warning/10 text-fleet-warning border border-fleet-warning/20";
      case "assigned":
        return "bg-fleet-accent/10 text-fleet-accent border border-fleet-accent/20";
      case "en_route_pickup":
        return "bg-fleet-info/10 text-fleet-info border border-fleet-info/20";
      case "at_pickup":
        return "bg-fleet-alert/10 text-fleet-alert border border-fleet-alert/20";
      case "in_transit":
        return "bg-fleet-insight/10 text-fleet-insight border border-fleet-insight/20";
      case "at_delivery":
        return "bg-fleet-highlight/10 text-fleet-highlight border border-fleet-highlight/20";
      case "completed":
        return "bg-fleet-success/10 text-fleet-success border border-fleet-success/20";
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
        return "text-fleet-danger";
      case "medium":
        return "text-fleet-warning";
      case "low":
        return "text-fleet-muted";
      default:
        return "text-fleet-muted";
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 15) return "text-fleet-success";
    if (margin >= 10) return "text-fleet-warning";
    return "text-fleet-danger";
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        {/* Header */}
        <thead className="sticky top-0 bg-fleet-secondary border-b border-fleet z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Route
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Driver
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Pickup Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Delivery Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Miles
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Priority
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Cost
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Revenue
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Margin
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted uppercase tracking-wider">
              Progress
            </th>
          </tr>
        </thead>

        {/* Body */}
  <tbody className="bg-fleet-primary divide-y divide-(--color-fleet-border)">
          {trips.map((trip) => (
            <tr
              key={trip.id}
              className="hover:bg-fleet-secondary transition-colors cursor-pointer"
            >
              {/* Order ID */}
              <td className="px-4 py-3 whitespace-nowrap">
                <code className="text-xs font-mono text-fleet-accent">{trip.id}</code>
              </td>

              {/* Customer */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-fleet-primary">{trip.customer}</div>
              </td>

              {/* Route */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-xs text-fleet-secondary">
                  <MapPin className="h-3 w-3 text-fleet-accent shrink-0" />
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
                    <div className="w-6 h-6 bg-fleet-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-fleet-accent">
                        {trip.driver.initials}
                      </span>
                    </div>
                    <span className="text-sm text-fleet-primary">{trip.driver.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-fleet-muted">—</span>
                )}
              </td>

              {/* Pickup Time */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1 text-xs text-fleet-secondary">
                  <Clock className="h-3 w-3 text-fleet-muted" />
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
                <div className="flex items-center gap-1 text-xs text-fleet-secondary">
                  <Clock className="h-3 w-3 text-fleet-muted" />
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
                <span className="text-sm font-mono text-fleet-primary">{trip.miles}</span>
              </td>

              {/* Priority */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {trip.priority === "high" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-fleet-danger" />
                  )}
                  <span className={`text-xs font-medium uppercase ${getPriorityColor(trip.priority)}`}>
                    {trip.priority}
                  </span>
                </div>
              </td>

              {/* Cost */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-mono text-fleet-secondary">
                  ${trip.estCost.toFixed(2)}
                </span>
              </td>

              {/* Revenue */}
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="text-sm font-mono text-fleet-primary">
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
                    <div className="w-16 h-2 bg-fleet-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-fleet-accent rounded-full transition-all"
                        style={{ width: `${trip.progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-fleet-secondary">{trip.progressPct}%</span>
                  </div>
                ) : trip.eta ? (
                  <div className="flex items-center gap-1 text-xs text-fleet-warning">
                    <Clock className="h-3 w-3" />
                    {trip.eta}
                  </div>
                ) : trip.dwellTime ? (
                  <div className="flex items-center gap-1 text-xs text-fleet-alert">
                    <Package className="h-3 w-3" />
                    {trip.dwellTime}m dwell
                  </div>
                ) : (
                  <span className="text-xs text-fleet-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-fleet-muted mb-3 opacity-30" />
          <p className="text-sm text-fleet-muted">No trips found</p>
          <p className="text-xs text-fleet-muted mt-1">Adjust your filters to see more results</p>
        </div>
      )}
    </div>
  );
}
