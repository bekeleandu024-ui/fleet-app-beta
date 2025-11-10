"use client";

import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Package,
  Repeat,
  Truck,
} from "lucide-react";
import { OrderRow } from "../types";
import {
  formatCurrency,
  formatDateTime,
  formatPercentage,
  marginColor,
  riskColor,
  statusColor,
  statusLabel,
} from "../utils";

// Moved OUTSIDE the component to avoid "components created during render".
function renderSortIcon(
  active: boolean,
  dir: "asc" | "desc"
) {
  if (!active) return null;
  return dir === "asc" ? (
    <ChevronUp className="h-3 w-3 inline ml-1" />
  ) : (
    <ChevronDown className="h-3 w-3 inline ml-1" />
  );
}

interface OrdersTableProps {
  orders: OrderRow[];
  onOrderClick: (order: OrderRow) => void;
  sortColumn: keyof OrderRow | null;
  sortDirection: "asc" | "desc";
  onSort: (column: keyof OrderRow) => void;
}

export function OrdersTable({
  orders,
  onOrderClick,
  sortColumn,
  sortDirection,
  onSort,
}: OrdersTableProps) {
  const getTypeIcon = (type: OrderRow["type"]) => {
    switch (type) {
      case "pickup":
        return <Package className="h-4 w-4" />;
      case "delivery":
        return <Truck className="h-4 w-4" />;
      case "round_trip":
        return <Repeat className="h-4 w-4" />;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-fleet bg-fleet-secondary">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-fleet">
              <th
                className="px-4 py-3 text-left text-xs font-medium text-fleet-muted transition-colors cursor-pointer hover:text-fleet-primary"
                onClick={() => onSort("id")}
              >
                Order ID {renderSortIcon(sortColumn === "id", sortDirection)}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-fleet-muted transition-colors cursor-pointer hover:text-fleet-primary"
                onClick={() => onSort("customer")}
              >
                Customer {renderSortIcon(sortColumn === "customer", sortDirection)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted">Route</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted">Windows</th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-fleet-muted transition-colors cursor-pointer hover:text-fleet-primary"
                onClick={() => onSort("status")}
              >
                Status {renderSortIcon(sortColumn === "status", sortDirection)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-fleet-muted">Driver</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-fleet-muted">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-fleet-muted">Revenue</th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-fleet-muted transition-colors cursor-pointer hover:text-fleet-primary"
                onClick={() => onSort("marginPct")}
              >
                Margin {renderSortIcon(sortColumn === "marginPct", sortDirection)}
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-fleet-muted transition-colors cursor-pointer hover:text-fleet-primary"
                onClick={() => onSort("aiRisk")}
              >
                AI Risk {renderSortIcon(sortColumn === "aiRisk", sortDirection)}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-fleet-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onOrderClick(order)}
                className="cursor-pointer border-b border-fleet transition-colors hover:bg-fleet-tertiary"
              >
                <td className="px-4 py-3">
                  <code className="font-mono text-sm text-fleet-primary">{order.id}</code>
                </td>
                <td className="px-4 py-3 text-sm text-fleet-primary">{order.customer}</td>
                <td className="px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-fleet-tertiary text-fleet-secondary">
                    {getTypeIcon(order.type)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-fleet-primary">
                    <span>
                      {order.origin.city}, {order.origin.state}
                    </span>
                    <ArrowRight className="h-3 w-3 text-fleet-muted" />
                    <span>
                      {order.destination.city}, {order.destination.state}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5 text-xs">
                    <div className="text-fleet-secondary">
                      P: {formatDateTime(order.pickupWindow.start)}
                    </div>
                    <div className="text-fleet-secondary">
                      D: {formatDateTime(order.deliveryWindow.start)}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusColor(
                      order.status
                    )}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {order.driver ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-fleet-accent/20 text-xs font-medium text-fleet-accent">
                        {order.driver.initials}
                      </div>
                      <span className="text-sm text-fleet-primary">{order.driver.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-fleet-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-fleet-primary">
                  {formatCurrency(order.estCostUsd)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-mono text-fleet-primary">
                  {formatCurrency(order.revenueUsd)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${marginColor(
                      order.marginPct
                    )}`}
                  >
                    {formatPercentage(order.marginPct)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${riskColor(
                      order.aiRisk
                    )}`}
                    title={order.aiRiskReason}
                  >
                    {order.aiRisk}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle dropdown open
                    }}
                    className="rounded-md p-1 transition-colors hover:bg-fleet-secondary"
                  >
                    <MoreVertical className="h-4 w-4 text-fleet-secondary" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-fleet-muted">No orders match your filters</p>
          <button className="mt-2 text-sm text-fleet-accent hover:underline">Reset filters</button>
        </div>
      )}
    </div>
  );
}
