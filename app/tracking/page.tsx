"use client";

import { useMemo, useState } from "react";
import { MapView } from "./components/MapView";
import { SidePanel } from "./components/SidePanel";
import { BottomStatsBar } from "./components/BottomStatsBar";
import { ACTIVE_TRIPS, AI_FEATURES, NETWORK_PREDICTION } from "./mockData";
import { ActiveTrip, TripStatus } from "./types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_PRIORITY: Record<TripStatus, number> = {
  delayed: 0,
  "at-risk": 1,
  "on-time": 2,
};

export default function TrackingPage() {
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTraffic, setShowTraffic] = useState(true);
  const [showWeather, setShowWeather] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  // User-driven selection; we no longer mirror in an effect.
  const [selectedTripId, setSelectedTripId] = useState<string | null>(
    ACTIVE_TRIPS[0]?.id ?? null
  );

  const filteredTrips = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ACTIVE_TRIPS.filter((trip) => {
      const matchesFilter = statusFilter === "all" || trip.status === statusFilter;
      const haystack = [
        trip.orderId,
        trip.driverName,
        trip.route.origin,
        trip.route.destination,
        trip.locationSummary,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = term ? haystack.includes(term) : true;
      return matchesFilter && matchesSearch;
    }).sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);
  }, [statusFilter, searchTerm]);

  // Derived "display" selection that clamps to the filtered list.
  const displaySelectedTripId = useMemo(() => {
    if (filteredTrips.length === 0) return null;
    return selectedTripId && filteredTrips.some((t) => t.id === selectedTripId)
      ? selectedTripId
      : filteredTrips[0]?.id ?? null;
  }, [filteredTrips, selectedTripId]);

  const selectedTrip: ActiveTrip | null = useMemo(() => {
    if (!displaySelectedTripId) return null;
    return ACTIVE_TRIPS.find((trip) => trip.id === displaySelectedTripId) ?? null;
  }, [displaySelectedTripId]);

  const totalTrips = ACTIVE_TRIPS.length;
  const onTimeCount = ACTIVE_TRIPS.filter((trip) => trip.status === "on-time").length;
  const onTimePercent = totalTrips ? (onTimeCount / totalTrips) * 100 : 0;
  const averageSpeed = totalTrips
    ? ACTIVE_TRIPS.reduce((acc, trip) => acc + trip.speedMph, 0) / totalTrips
    : 0;
  const riskTrips = ACTIVE_TRIPS.filter((trip) => trip.status !== "on-time");
  const focusTripIds = filteredTrips.map((trip) => trip.id);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex items-start justify-between border-b border-border px-8 py-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Live Tracking</h1>
            <Badge className="bg-rose-500/90 text-xs uppercase tracking-wider text-white">Live</Badge>
            <Badge className="bg-emerald-500/20 text-xs uppercase tracking-wider text-emerald-200 border border-emerald-400/40">
              AI Assisted
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Monitor every active trip in real-time, keep tabs on at-risk freight, and react to AI-powered alerts before customers feel the impact.
          </p>
        </div>
        <div className="hidden text-right text-xs text-muted-foreground lg:block">
          <p className="font-semibold uppercase tracking-wide text-foreground/80">Network Watch</p>
          <p>{NETWORK_PREDICTION.trendingRisk}</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 pb-10 pt-6">
          <div className="relative h-[60vh] min-h-[460px]">
            <MapView
              trips={ACTIVE_TRIPS}
              selectedTripId={displaySelectedTripId}
              onSelectTrip={setSelectedTripId}
              focusTripIds={focusTripIds}
              showTraffic={showTraffic}
              showWeather={showWeather}
              onToggleTraffic={() => setShowTraffic((prev) => !prev)}
              onToggleWeather={() => setShowWeather((prev) => !prev)}
            />
            <div className="pointer-events-none absolute inset-x-6 bottom-6">
              <BottomStatsBar
                totalTrips={totalTrips}
                onTimePercent={onTimePercent}
                averageSpeed={averageSpeed}
                prediction={NETWORK_PREDICTION}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 border border-border/60" aria-hidden />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {AI_FEATURES.map((feature) => (
              <Card
                key={feature.id}
                className="border border-border/70 bg-card/90 text-foreground"
              >
                <CardHeader className="space-y-2">
                  <CardTitle className="flex items-center gap-3 text-base text-foreground">
                    <span className="text-xl" aria-hidden>{feature.emoji}</span>
                    {feature.label}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="mt-6 border border-border/70 bg-card/90 text-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                Network Watchlist
                <Badge className="bg-amber-400/20 text-amber-200 border border-amber-400/40">
                  {riskTrips.length} at-risk
                </Badge>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {NETWORK_PREDICTION.narrative}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {riskTrips.length === 0 && (
                <p className="text-sm text-muted-foreground">No at-risk shipments at the moment.</p>
              )}
              {riskTrips.map((trip) => (
                <div
                  key={`risk-${trip.id}`}
                  className="rounded-lg border border-border/70 bg-card/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-foreground">
                    <span className="font-semibold">{trip.orderId}</span>
                    <span className="text-xs text-muted-foreground">ETA {trip.eta}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {trip.route.origin} → {trip.route.destination} · {trip.speedMph} mph · {trip.route.milesRemaining} miles remaining
                  </p>
                  <p className="mt-3 text-sm text-amber-200">{trip.aiPrediction}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <SidePanel
          filteredTrips={filteredTrips}
          selectedTrip={selectedTrip}
          onSelectTrip={setSelectedTripId}
          filter={statusFilter}
          onFilterChange={setStatusFilter}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          isOpen={isSidePanelOpen}
          onToggleOpen={() => setIsSidePanelOpen((prev) => !prev)}
        />
      </div>
    </div>
  );
}
