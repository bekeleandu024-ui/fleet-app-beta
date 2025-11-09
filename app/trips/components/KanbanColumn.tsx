"use client";

import { Clock, MapPin, TrendingUp, AlertTriangle, Package, Truck } from "lucide-react";
import { DispatchOrder } from "../types";

interface KanbanColumnProps {
  title: string;
  orders: DispatchOrder[];
  onOrderClick: (order: DispatchOrder) => void;
  onDragStart?: (order: DispatchOrder) => void;
}

export function KanbanColumn({ title, orders, onOrderClick, onDragStart }: KanbanColumnProps) {
  const getStatusColor = () => {
    if (title.includes("Unassigned")) return "border-[#FFC857]";
    if (title.includes("Assigned")) return "border-[#60A5FA]";
    if (title.includes("En Route")) return "border-[#22D3EE]";
    if (title.includes("Pickup")) return "border-[#FF8A00]";
    if (title.includes("Transit")) return "border-[#A78BFA]";
    if (title.includes("Delivery")) return "border-[#FCD34D]";
    if (title.includes("Completed")) return "border-[#24D67B]";
    return "border-[#1E2638]";
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E] rounded-lg border border-[#1E2638]">
      {/* Column Header */}
      <div className={`px-4 py-3 border-b border-l-4 ${getStatusColor()} border-r-0 border-t-0 bg-[#0F1420]`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#E6EAF2]">{title}</h3>
          <span className="text-xs text-[#6C7484] bg-[#1E2638] px-2 py-1 rounded-md">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[400px]">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[#6C7484] text-sm">
            No orders
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => onOrderClick(order)}
              onDragStart={() => onDragStart?.(order)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onClick,
  onDragStart,
}: {
  order: DispatchOrder;
  onClick: () => void;
  onDragStart: () => void;
}) {
  const getPriorityColor = () => {
    if (order.priority === "high") return "text-[#FF4D4D] bg-[#FF4D4D]/10 border-[#FF4D4D]/20";
    if (order.priority === "medium") return "text-[#FFC857] bg-[#FFC857]/10 border-[#FFC857]/20";
    return "text-[#6C7484] bg-[#6C7484]/10 border-[#6C7484]/20";
  };

  const marginColor = order.margin >= 0.15 ? "#24D67B" : order.margin >= 0.05 ? "#FFC857" : "#FF4D4D";

  return (
    <div
      draggable={order.status === "unassigned"}
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-[#141C2F] border border-[#1E2638] rounded-lg p-3 cursor-pointer hover:border-[#60A5FA]/40 transition-colors group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <code className="text-sm font-mono text-[#E6EAF2]">{order.id}</code>
          <div className="text-xs text-[#6C7484] mt-0.5">{order.customer}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-md border ${getPriorityColor()}`}>
          {order.priority.toUpperCase()}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-1 text-xs text-[#9AA4B2] mb-2">
        <MapPin className="h-3 w-3" />
        <span>
          {order.origin.city} → {order.destination.city}
        </span>
        <span className="text-[#6C7484]">({order.miles} mi)</span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-[#9AA4B2] mb-3">
        <Clock className="h-3 w-3" />
        <span>
          {new Date(order.pickupTime).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Driver (if assigned) */}
      {order.driver && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#1E2638]">
          <div className="w-6 h-6 rounded-md bg-[#60A5FA]/20 flex items-center justify-center text-[#60A5FA] text-[10px] font-medium">
            {order.driver.initials}
          </div>
          <span className="text-xs text-[#E6EAF2]">{order.driver.name}</span>
        </div>
      )}

      {/* Status-specific info */}
      {order.status === "unassigned" && order.aiMatchScore !== undefined && (
        <div className="mb-3 pb-3 border-b border-[#1E2638]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6C7484]">AI Match</span>
            <span className="text-[#60A5FA] font-medium">{order.aiMatchScore}%</span>
          </div>
        </div>
      )}

      {order.status === "en_route_pickup" && (
        <div className="mb-3 pb-3 border-b border-[#1E2638]">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6C7484]">ETA to Pickup</span>
              <span className="text-[#22D3EE]">
                {new Date(order.eta!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6C7484]">Distance</span>
              <span className="text-[#E6EAF2]">{order.distanceRemaining} mi</span>
            </div>
          </div>
        </div>
      )}

      {(order.status === "at_pickup" || order.status === "at_delivery") && order.dwellTime !== undefined && (
        <div className="mb-3 pb-3 border-b border-[#1E2638]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6C7484]">Dwell Time</span>
            <span className={order.dwellTime > 30 ? "text-[#FF8A00] font-medium" : "text-[#E6EAF2]"}>
              {order.dwellTime} min
              {order.dwellTime > 30 && (
                <AlertTriangle className="inline h-3 w-3 ml-1" />
              )}
            </span>
          </div>
        </div>
      )}

      {order.status === "in_transit" && (
        <div className="mb-3 pb-3 border-b border-[#1E2638] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6C7484]">Progress</span>
            <span className="text-[#E6EAF2]">{order.progressPct}%</span>
          </div>
          <div className="w-full bg-[#1E2638] rounded-full h-1.5">
            <div
              className="bg-[#A78BFA] h-1.5 rounded-full transition-all"
              style={{ width: `${order.progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#6C7484]">ETA</span>
            <span className="text-[#E6EAF2]">
              {new Date(order.eta!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#6C7484]">HOS Remaining</span>
            <span className={order.hosRemaining! < 3 ? "text-[#FF8A00]" : "text-[#E6EAF2]"}>
              {order.hosRemaining?.toFixed(1)}h
            </span>
          </div>
        </div>
      )}

      {/* Margin */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#6C7484]">Margin</span>
        <div className="flex items-center gap-2">
          <span className="text-[#9AA4B2]">${order.revenue - order.estCost}</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              color: marginColor,
              backgroundColor: `${marginColor}15`,
              border: `1px solid ${marginColor}30`,
            }}
          >
            {(order.margin * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
