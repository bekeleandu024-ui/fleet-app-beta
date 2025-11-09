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
    <div className="bg-[#0B1020] border border-[#1E2638] rounded-lg p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[#E6EAF2]">Qualified Orders</h2>
          <span className="px-2 py-1 bg-[#60A5FA]/10 border border-[#60A5FA]/30 rounded text-xs font-medium text-[#60A5FA]">
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
                ? "bg-[#60A5FA]/10 border-[#60A5FA]"
                : "bg-[#0F1420] border-[#1E2638] hover:border-[#2A3548]"
            }`}
          >
            {/* Order Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-[#E6EAF2] mb-1">
                  {order.customer}
                </div>
                <div className="text-xs text-[#9AA4B2]">{order.customerLocation}</div>
              </div>
              {order.status === "in_focus" && (
                <span className="px-2 py-1 bg-[#24D67B]/10 border border-[#24D67B]/30 rounded text-xs font-medium text-[#24D67B]">
                  IN FOCUS
                </span>
              )}
            </div>

            {/* Flatbed Window */}
            <div className="text-xs text-[#6C7484] mb-3">{order.flatbedWindow}</div>

            {/* Crew Lineup */}
            {order.crew.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-xs text-[#6C7484] mb-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>DRIVERS</span>
                </div>
                <div className="space-y-1.5">
                  {order.crew.map((member) => (
                    <div
                      key={member.id}
                      className="text-xs text-[#9AA4B2] flex items-start gap-2"
                    >
                      <span className="text-[#60A5FA] font-medium">
                        {member.name}
                      </span>
                      <span className="text-[#6C7484]">{member.homeBase}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Units */}
            {order.units.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#6C7484] mb-2">
                  <Truck className="h-3.5 w-3.5" />
                  <span>UNITS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.units.map((unit, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-[#1E2638] rounded text-xs text-[#9AA4B2]"
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
