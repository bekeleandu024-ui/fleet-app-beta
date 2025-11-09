"use client";

import { Calendar, MapPin, AlertCircle } from "lucide-react";
import { BookingOrder } from "../types";

interface OrderSnapshotProps {
  order: BookingOrder;
}

export function OrderSnapshot({ order }: OrderSnapshotProps) {
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="bg-[#0B1020] border border-[#1E2638] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#E6EAF2] mb-1">Order Snapshot</h2>
          <p className="text-xs text-[#6C7484]">
            Key load requirements before assigning resources.
          </p>
        </div>
        <span className="px-3 py-1 bg-[#FFC857]/10 border border-[#FFC857]/30 rounded-md text-xs font-medium text-[#FFC857] uppercase">
          {order.status}
        </span>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {/* Customer */}
        <div>
          <div className="text-xs text-[#6C7484] mb-2">CUSTOMER</div>
          <div className="text-sm font-semibold text-[#E6EAF2] mb-1">{order.customer}</div>
          <div className="text-xs text-[#9AA4B2]">{order.customerLocation}</div>
        </div>

        {/* Pickup Window */}
        <div>
          <div className="text-xs text-[#6C7484] mb-2">PICKUP WINDOW</div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-[#60A5FA] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-[#E6EAF2]">
                {formatDateTime(order.pickupWindow.start)}
              </div>
              <div className="text-xs text-[#9AA4B2]">
                → {formatDateTime(order.pickupWindow.end)}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Window */}
        <div>
          <div className="text-xs text-[#6C7484] mb-2">DELIVERY WINDOW</div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-[#24D67B] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-[#E6EAF2]">
                {formatDateTime(order.deliveryWindow.start)}
              </div>
              <div className="text-xs text-[#9AA4B2]">
                → {formatDateTime(order.deliveryWindow.end)}
              </div>
            </div>
          </div>
        </div>

        {/* Dispatcher Notes */}
        <div>
          <div className="text-xs text-[#6C7484] mb-2">DISPATCHER NOTES</div>
          <div className="text-xs text-[#9AA4B2] leading-relaxed">
            {order.dispatcherNotes}
          </div>
        </div>
      </div>

      {/* Trip Context Alert */}
      <div className="flex items-start gap-3 p-4 bg-[#60A5FA]/5 border border-[#60A5FA]/20 rounded-lg">
        <AlertCircle className="h-5 w-5 text-[#60A5FA] flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-medium text-[#60A5FA] mb-1">TRIP CONTEXT</div>
          <p className="text-xs text-[#9AA4B2] leading-relaxed">{order.tripContext}</p>
        </div>
      </div>
    </div>
  );
}
