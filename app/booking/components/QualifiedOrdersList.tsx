"use client";

import { Users, Truck } from "lucide-react";
import { QualifiedOrder } from "../types";

interface QualifiedOrdersListProps {
  orders: QualifiedOrder[];
  activeOrderId?: string;
  onOrderSelect: (orderId: string) => void;
}

export function QualifiedOrdersList({
  orders,
  activeOrderId,
  onOrderSelect,
}: QualifiedOrdersListProps) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-fleet bg-fleet-primary p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-fleet-primary">Qualified Orders</h2>
          <span className="rounded border border-fleet-accent/20 bg-fleet-accent/10 px-2 py-1 text-xs font-medium text-fleet-accent">
            LIVE AVAILABILITY
          </span>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => onOrderSelect(order.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              order.id === activeOrderId
                ? "border-fleet-accent bg-fleet-accent/10"
                : "border-fleet bg-fleet-tertiary hover:border-fleet-accent/40"
            }`}
          >
            {/* Order Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="mb-1 text-sm font-semibold text-fleet-primary">
                  {order.customer}
                </div>
                <div className="text-xs text-fleet-secondary">{order.customerLocation}</div>
              </div>
              {order.status === "in_focus" && (
                <span className="rounded border border-fleet-success/20 bg-fleet-success/10 px-2 py-1 text-xs font-medium text-fleet-success">
                  IN FOCUS
                </span>
              )}
            </div>

            {/* Flatbed Window */}
            <div className="mb-3 text-xs text-fleet-muted">{order.flatbedWindow}</div>

            {/* Crew Lineup */}
            {order.crew.length > 0 && (
              <div className="mb-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs text-fleet-muted">
                  <Users className="h-3.5 w-3.5" />
                  <span>DRIVERS</span>
                </div>
                <div className="space-y-1.5">
                  {order.crew.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-start gap-2 text-xs text-fleet-secondary"
                    >
                      <span className="font-medium text-fleet-accent">
                        {member.name}
                      </span>
                      <span className="text-fleet-muted">{member.homeBase}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Units */}
            {order.units.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs text-fleet-muted">
                  <Truck className="h-3.5 w-3.5" />
                  <span>UNITS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.units.map((unit, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-fleet-border px-2 py-1 text-xs text-fleet-secondary"
                    >
                      {unit}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
