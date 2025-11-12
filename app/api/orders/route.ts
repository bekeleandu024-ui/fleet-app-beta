import { NextResponse } from "next/server";

import { listOrders } from "@/lib/mock-data-store";

export async function GET() {
  const orders = listOrders();
  const stats = {
    total: orders.length,
    new: orders.filter((order) => order.status === "New").length,
    inProgress: orders.filter((order) => ["Planning", "In Transit"].includes(order.status)).length,
    delayed: orders.filter((order) => ["At Risk", "Exception"].includes(order.status)).length,
  };

  const customers = Array.from(new Set(orders.map((order) => order.customer))).sort();
  const statuses = Array.from(new Set(orders.map((order) => order.status))).sort();
  const lanes = Array.from(new Set(orders.map((order) => order.lane))).sort();

  return NextResponse.json({
    stats,
    filters: {
      customers: ["All", ...customers],
      statuses,
      lanes,
      dateRanges: ["Today", "48 Hours", "7 Days"],
    },
    data: orders,
  });
}
