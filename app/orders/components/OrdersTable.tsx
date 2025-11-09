"use client";

import { ArrowRight, ChevronDown, ChevronUp, MoreVertical, Package, Repeat, Truck } from "lucide-react";
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

interface OrdersTableProps {
  orders: OrderRow[];
  onOrderClick: (order: OrderRow) => void;
  sortColumn: keyof OrderRow | null;
  sortDirection: "asc" | "desc";
  onSort: (column: keyof OrderRow) => void;
}

export function OrdersTable({ orders, onOrderClick, sortColumn, sortDirection, onSort }: OrdersTableProps) {
  const SortIcon = ({ column }: { column: keyof OrderRow }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-1" />
    );
  };

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
    <div className="bg-[#121826] border border-[#1E2638] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E2638]">
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[#9AA4B2] cursor-pointer hover:text-[#E6EAF2] transition-colors"
                onClick={() => onSort("id")}
              >
                Order ID <SortIcon column="id" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[#9AA4B2] cursor-pointer hover:text-[#E6EAF2] transition-colors"
                onClick={() => onSort("customer")}
              >
                Customer <SortIcon column="customer" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9AA4B2]">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9AA4B2]">Route</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9AA4B2]">Windows</th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-[#9AA4B2] cursor-pointer hover:text-[#E6EAF2] transition-colors"
                onClick={() => onSort("status")}
              >
                Status <SortIcon column="status" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#9AA4B2]">Driver</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#9AA4B2]">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#9AA4B2]">Revenue</th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-[#9AA4B2] cursor-pointer hover:text-[#E6EAF2] transition-colors"
                onClick={() => onSort("marginPct")}
              >
                Margin <SortIcon column="marginPct" />
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-medium text-[#9AA4B2] cursor-pointer hover:text-[#E6EAF2] transition-colors"
                onClick={() => onSort("aiRisk")}
              >
                AI Risk <SortIcon column="aiRisk" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#9AA4B2]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onOrderClick(order)}
                className="border-b border-[#1E2638] hover:bg-[#141C2F] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <code className="text-sm text-[#E6EAF2] font-mono">{order.id}</code>
                </td>
                <td className="px-4 py-3 text-sm text-[#E6EAF2]">{order.customer}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#141C2F] text-[#9AA4B2]">
                    {getTypeIcon(order.type)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#E6EAF2]">
                      {order.origin.city}, {order.origin.state}
                    </span>
                    <ArrowRight className="h-3 w-3 text-[#6C7484]" />
                    <span className="text-[#E6EAF2]">
                      {order.destination.city}, {order.destination.state}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs space-y-0.5">
                    <div className="text-[#9AA4B2]">
                      P: {formatDateTime(order.pickupWindow.start)}
                    </div>
                    <div className="text-[#9AA4B2]">
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
                      <div className="w-7 h-7 rounded-md bg-[#60A5FA]/20 flex items-center justify-center text-[#60A5FA] text-xs font-medium">
                        {order.driver.initials}
                      </div>
                      <span className="text-sm text-[#E6EAF2]">{order.driver.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#6C7484]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm text-[#E6EAF2] font-mono">
                  {formatCurrency(order.estCostUsd)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-[#E6EAF2] font-mono">
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
                    className="p-1 hover:bg-[#1E2638] rounded-md transition-colors"
                  >
                    <MoreVertical className="h-4 w-4 text-[#9AA4B2]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-[#6C7484] text-sm">No orders match your filters</p>
          <button className="mt-2 text-sm text-[#60A5FA] hover:underline">Reset filters</button>
        </div>
      )}
    </div>
  );
}
