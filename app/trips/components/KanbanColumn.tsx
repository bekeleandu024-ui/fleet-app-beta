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
    if (title.includes("Unassigned")) return "border-fleet-warning";
    if (title.includes("Assigned")) return "border-fleet-accent";
    if (title.includes("En Route")) return "border-[#22D3EE]";
    if (title.includes("Pickup")) return "border-fleet-alert";
    if (title.includes("Transit")) return "border-[#A78BFA]";
    if (title.includes("Delivery")) return "border-[#FCD34D]";
    if (title.includes("Completed")) return "border-fleet-success";
    return "border-fleet";
  };

  return (
    <div className="flex flex-col h-full bg-fleet-primary rounded-lg border border-fleet">
      {/* Column Header */}
      <div className={`px-4 py-3 border-b border-l-4 ${getStatusColor()} border-r-0 border-t-0 bg-fleet-secondary`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fleet-primary">{title}</h3>
          <span className="text-xs text-fleet-muted bg-fleet-border px-2 py-1 rounded-md">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[400px]">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-fleet-muted text-sm">
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
    if (order.priority === "high") return "text-fleet-danger bg-fleet-danger/10 border border-fleet-danger/20";
    if (order.priority === "medium") return "text-fleet-warning bg-fleet-warning/10 border border-fleet-warning/20";
    return "text-fleet-muted bg-fleet-muted/10 border border-fleet-muted/20";
  };

  const marginClasses =
    order.margin >= 0.15
      ? "text-fleet-success bg-fleet-success/10 border border-fleet-success/20"
      : order.margin >= 0.05
      ? "text-fleet-warning bg-fleet-warning/10 border border-fleet-warning/20"
      : "text-fleet-danger bg-fleet-danger/10 border border-fleet-danger/20";

  return (
    <div
      draggable={order.status === "unassigned"}
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-fleet-tertiary border border-fleet rounded-lg p-3 cursor-pointer hover:border-fleet-accent/40 transition-colors group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <code className="text-sm font-mono text-fleet-primary">{order.id}</code>
          <div className="text-xs text-fleet-muted mt-0.5">{order.customer}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-md ${getPriorityColor()}`}>
          {order.priority.toUpperCase()}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-1 text-xs text-fleet-secondary mb-2">
        <MapPin className="h-3 w-3" />
        <span>
          {order.origin.city} → {order.destination.city}
        </span>
        <span className="text-fleet-muted">({order.miles} mi)</span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-fleet-secondary mb-3">
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
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-fleet">
          <div className="w-6 h-6 rounded-md bg-fleet-accent/20 flex items-center justify-center text-fleet-accent text-[10px] font-medium">
            {order.driver.initials}
          </div>
          <span className="text-xs text-fleet-primary">{order.driver.name}</span>
        </div>
      )}

      {/* Status-specific info */}
      {order.status === "unassigned" && order.aiMatchScore !== undefined && (
        <div className="mb-3 pb-3 border-b border-fleet">
          <div className="flex items-center justify-between text-xs">
            <span className="text-fleet-muted">AI Match</span>
            <span className="text-fleet-accent font-medium">{order.aiMatchScore}%</span>
          </div>
        </div>
      )}

      {order.status === "en_route_pickup" && (
        <div className="mb-3 pb-3 border-b border-fleet">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-fleet-muted">ETA to Pickup</span>
              <span className="text-[#22D3EE]">
                {new Date(order.eta!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fleet-muted">Distance</span>
              <span className="text-fleet-primary">{order.distanceRemaining} mi</span>
            </div>
          </div>
        </div>
      )}

      {(order.status === "at_pickup" || order.status === "at_delivery") && order.dwellTime !== undefined && (
        <div className="mb-3 pb-3 border-b border-fleet">
          <div className="flex items-center justify-between text-xs">
            <span className="text-fleet-muted">Dwell Time</span>
            <span className={order.dwellTime > 30 ? "text-fleet-alert font-medium" : "text-fleet-primary"}>
              {order.dwellTime} min
              {order.dwellTime > 30 && (
                <AlertTriangle className="inline h-3 w-3 ml-1" />
              )}
            </span>
          </div>
        </div>
      )}

      {order.status === "in_transit" && (
        <div className="mb-3 pb-3 border-b border-fleet space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-fleet-muted">Progress</span>
            <span className="text-fleet-primary">{order.progressPct}%</span>
          </div>
          <div className="w-full bg-fleet-border rounded-full h-1.5">
            <div
              className="bg-[#A78BFA] h-1.5 rounded-full transition-all"
              style={{ width: `${order.progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-fleet-muted">ETA</span>
            <span className="text-fleet-primary">
              {new Date(order.eta!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-fleet-muted">HOS Remaining</span>
            <span className={order.hosRemaining! < 3 ? "text-fleet-alert" : "text-fleet-primary"}>
              {order.hosRemaining?.toFixed(1)}h
            </span>
          </div>
        </div>
      )}

      {/* Margin */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-fleet-muted">Margin</span>
        <div className="flex items-center gap-2">
          <span className="text-fleet-secondary">${order.revenue - order.estCost}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${marginClasses}`}>
            {(order.margin * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
