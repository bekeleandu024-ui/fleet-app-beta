"use server";

import { calculateRouteMetrics } from "@/lib/claude-api";

export async function enrichTripAction(origin: string, destination: string) {
  try {
    const metrics = await calculateRouteMetrics(origin, destination);
    return metrics;
  } catch (error) {
    console.error("Failed to enrich trip:", error);
    return null;
  }
}
