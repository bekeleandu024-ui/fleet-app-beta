"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Gauge, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

import { RecommendationCallout } from "@/components/recommendation-callout";
import { AIInsightsPanel } from "@/components/ai-insights-panel";
import { StatChip } from "@/components/stat-chip";
import { Button } from "@/components/ui/button";
import { fetchOrderDetail } from "@/lib/api";
import { getRouteOptimization } from "@/lib/ai-service";
import { formatDateTime, formatDurationHours } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { OrderDetail } from "@/lib/types";

const statusVariant: Record<string, "default" | "ok" | "warn" | "alert"> = {
  "In Transit": "ok",
  "Delivered": "default",
  "Planning": "default",
  "New": "default",
  "Exception": "alert",
  "At Risk": "warn",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: Boolean(orderId),
  });

  // Initialize form values when data loads
  useEffect(() => {
    if (data) {
      setSelectedDriver(data.booking.recommendedDriverId || "");
      setSelectedUnit(data.booking.recommendedUnitId || "");
      setSelectedStatus(data.status || "");
    }
  }, [data]);

  const { data: aiInsights, isLoading: aiLoading, refetch: fetchAIInsights } = useQuery({
    queryKey: ['ai-insights', orderId],
    queryFn: async () => {
      if (!data) return null;
      const pickup = data.snapshot.stops.find(s => s.type === 'Pickup')?.location || '';
      const delivery = data.snapshot.stops.find(s => s.type === 'Delivery')?.location || '';
      return getRouteOptimization({
        origin: pickup,
        destination: delivery,
        orderId,
        miles: data.laneMiles,
      });
    },
    enabled: false,
  });

  const handleGetAIRecommendation = async () => {
    setShowAIInsights(true);
    await fetchAIInsights();
  };

  const handleBookTrip = async () => {
    if (!data || !selectedDriver || !selectedUnit) {
      alert("Please select both a driver and unit");
      return;
    }

    setIsBooking(true);
    try {
      const pickup = data.snapshot.stops.find(s => s.type === "Pickup");
      const delivery = data.snapshot.stops.find(s => s.type === "Delivery");

      if (!pickup || !delivery) {
        throw new Error("Missing pickup or delivery information");
      }

      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.id,
          driverId: selectedDriver,
          unitId: selectedUnit,
          pickup: {
            location: pickup.location,
            windowStart: pickup.windowStart,
            windowEnd: pickup.windowEnd,
          },
          delivery: {
            location: delivery.location,
            windowStart: delivery.windowStart,
            windowEnd: delivery.windowEnd,
          },
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book trip");
      }

      const trip = await response.json();
      alert(`Trip ${trip.id.slice(0, 8)} booked successfully!`);
      setNotes("");
    } catch (error: any) {
      console.error("Error booking trip:", error);
      alert(error.message || "Failed to book trip");
    } finally {
      setIsBooking(false);
    }
  };

  const handleCalculateCost = async () => {
    alert("Cost calculation feature coming soon");
  };

  const handleUpdateStatus = async () => {
    alert("Status update feature coming soon");
  };

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <section className="col-span-12 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-sm text-neutral-500">
        Unable to load order.
      </section>
    );
  }

  const headerChips = [
    { label: data.status, variant: statusVariant[data.status] ?? "default" },
    { label: `${formatDurationHours(data.ageHours)} old` },
    { label: `${data.laneMiles} lane mi` },
  ];

  return (
    <>
      <header className="col-span-12 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-4 shadow-lg shadow-black/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-200">Order {data.id}</h1>
            <p className="text-xs text-neutral-500">{data.lane}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerChips.map((chip) => (
              <StatChip key={chip.label} label={chip.label} variant={chip.variant ?? "default"} />
            ))}
          </div>
        </div>
      </header>

      <section className="col-span-12 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-200">Order Snapshot</h2>
              <span className="flex items-center gap-2 text-xs text-neutral-500">
                <CalendarClock className="size-4" />
                Updated {formatDateTime(data.snapshot.stops[0]?.windowStart ?? new Date().toISOString())}
              </span>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <p className="text-neutral-500">Customer</p>
                <p className="font-semibold text-neutral-200">{data.customer}</p>
                <p className="text-neutral-500">Service Level</p>
                <p className="font-semibold text-neutral-200">{data.serviceLevel}</p>
                <p className="text-neutral-500">Commodity</p>
                <p className="font-semibold text-neutral-200">{data.snapshot.commodity}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-neutral-500">Windows</p>
                <ul className="space-y-1 text-neutral-200">
                  {data.snapshot.windows.map((window) => (
                    <li key={window.label} className="flex items-center justify-between">
                      <span>{window.label}</span>
                      <span className="text-xs text-neutral-500">{window.value}</span>
                    </li>
                  ))}
                </ul>
                {data.snapshot.notes ? (
                  <p className="mt-2 text-xs text-neutral-500">{data.snapshot.notes}</p>
                ) : null}
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Stops</h3>
              <ul className="space-y-2">
                {data.snapshot.stops.map((stop) => (
                  <li key={stop.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500">
                      <span>{stop.type}</span>
                      <span>
                        {new Date(stop.windowStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –
                        {" "}
                        {new Date(stop.windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-200">{stop.location}</p>
                    {stop.instructions ? (
                      <p className="mt-1 text-xs text-neutral-500">{stop.instructions}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-200">Pricing & Cost</h2>
              <span className="flex items-center gap-2 text-xs text-neutral-500">
                <Gauge className="size-4" /> Pricing engine synced
              </span>
            </header>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              {data.pricing.items.map((item) => (
                <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
                  <dt className="text-xs uppercase tracking-wide text-neutral-500">{item.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-neutral-200">{item.value}</dd>
                  {item.helper ? <p className="text-xs text-neutral-500">{item.helper}</p> : null}
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm font-semibold text-neutral-200">
              <span>{data.pricing.totals.label}</span>
              <span>{data.pricing.totals.value}</span>
            </div>
            {data.pricing.totals.helper ? (
              <p className="mt-2 text-xs text-neutral-500">{data.pricing.totals.helper}</p>
            ) : null}
          </article>
        </div>

        <aside className="lg:col-span-5 space-y-6">
          {/* AI Insights Section */}
          {!showAIInsights && (
            <article className="rounded-xl border border-violet-700 bg-linear-to-br from-violet-900/40 to-purple-900/40 p-4 shadow-lg shadow-black/40">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h2 className="text-sm font-semibold text-violet-200">AI Route Optimization</h2>
              </div>
              <p className="text-xs text-violet-300 mb-4">
                Get AI-powered driver recommendations and cost analysis for this route
              </p>
              <Button
                onClick={handleGetAIRecommendation}
                disabled={aiLoading}
                variant="primary"
                size="sm"
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {aiLoading ? 'Analyzing...' : 'Get AI Recommendation'}
              </Button>
            </article>
          )}

          {showAIInsights && aiInsights && (
            <AIInsightsPanel
              recommendation={aiInsights.recommendation}
              driverRecommendations={aiInsights.driverRecommendations}
              costComparison={aiInsights.costComparison}
              insights={aiInsights.insights}
              totalDistance={aiInsights.totalDistance}
              estimatedTime={aiInsights.estimatedTime}
              borderCrossings={aiInsights.borderCrossings}
            />
          )}

          <RecommendationCallout
            title="Guardrail summary"
            description="Key constraints enforced before booking."
            bullets={data.booking.guardrails}
          />
          <article className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-lg shadow-black/40">
            <header className="mb-4">
              <h2 className="text-sm font-semibold text-neutral-200">Booking Console</h2>
              <p className="text-xs text-neutral-500">Pair qualified driver and equipment, then commit.</p>
            </header>
            <div className="space-y-4">
              <label className="block">
                <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Driver</span>
                <select 
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  {data.booking.driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} • {driver.status} ({driver.hoursAvailable}h)
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block">
                <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Unit</span>
                <select 
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                >
                  {data.booking.unitOptions.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.id} • {unit.type} ({unit.status})
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block">
                <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Update Status</span>
                <select 
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {data.booking.statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              
              <label className="block">
                <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">Notes</span>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                  placeholder="Add dispatcher notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="primary" 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  onClick={handleBookTrip}
                  disabled={isBooking || !selectedDriver || !selectedUnit}
                >
                  {isBooking ? "Booking..." : "Book Trip"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    type="button" 
                    variant="subtle" 
                    size="sm"
                    onClick={handleCalculateCost}
                  >
                    Calculate Cost
                  </Button>
                  <Button 
                    type="button" 
                    variant="subtle" 
                    size="sm"
                    onClick={handleUpdateStatus}
                  >
                    Update Status
                  </Button>
                </div>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}

function OrderDetailSkeleton() {
  return (
    <>
      <header className="col-span-12 h-24 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
      <section className="col-span-12 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="h-64 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-56 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="h-28 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
          <div className="h-72 animate-pulse rounded-xl border border-neutral-800 bg-neutral-900/60" />
        </div>
      </section>
    </>
  );
}
