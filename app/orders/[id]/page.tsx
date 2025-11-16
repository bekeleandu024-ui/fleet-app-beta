"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Gauge, Sparkles } from "lucide-react";
import { useState } from "react";

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

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    enabled: Boolean(orderId),
  });

  const { data: aiInsights, isLoading: aiLoading, refetch: fetchAIInsights } = useQuery({
    queryKey: ['ai-insights', orderId],
    queryFn: async () => {
      if (!data) return null;
      const pickup = data.snapshot.stops.find(s => s.type === 'PICKUP')?.location || '';
      const delivery = data.snapshot.stops.find(s => s.type === 'DELIVERY')?.location || '';
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
            <article className="rounded-xl border border-violet-700 bg-gradient-to-br from-violet-900/40 to-purple-900/40 p-4 shadow-lg shadow-black/40">
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
            <form className="grid gap-4 text-sm">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-neutral-500">Driver</span>
                <select className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0" defaultValue={data.booking.recommendedDriverId}>
                  {data.booking.driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} • {driver.status} ({driver.hoursAvailable}h)
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-neutral-500">Unit</span>
                <select className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0" defaultValue={data.booking.recommendedUnitId}>
                  {data.booking.unitOptions.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.id} • {unit.type} ({unit.status})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-neutral-500">Update Status</span>
                <select className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0" defaultValue={data.status}>
                  {data.booking.statusOptions.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-wide text-neutral-500">Notes</span>
                <textarea
                  rows={3}
                  className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                  placeholder="Add dispatcher notes"
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="subtle" size="sm" className="uppercase tracking-wide text-xs">
                  Calculate Cost
                </Button>
                <Button type="button" variant="primary" size="sm" className="uppercase tracking-wide text-xs">
                  Book Trip
                </Button>
                <Button type="button" variant="subtle" size="sm" className="uppercase tracking-wide text-xs">
                  Update Status
                </Button>
              </div>
            </form>
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
