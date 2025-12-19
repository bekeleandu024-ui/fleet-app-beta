import React from "react";
import { LifecycleDashboard } from "./_components/LifecycleDashboard";

export default async function OrderLifecyclePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <LifecycleDashboard orderId={orderId} />;
}
