"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Navigation, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Trip {
  id: string;
  driver: string;
  unit: string;
  status: string;
  origin: string;
  destination: string;
}

interface TripEvent {
  id: string;
  tripId: string;
  eventType: string;
  at: string;
  stopLabel: string;
  notes: string;
  lat?: number;
  lon?: number;
  trip: Trip;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  TRIP_START: "Trip Start",
  ARRIVED_PICKUP: "Pickup - Arrived",
  LEFT_PICKUP: "Pickup - Departed",
  ARRIVED_DELIVERY: "Delivery - Arrived",
  LEFT_DELIVERY: "Delivery - Departed",
  CROSSED_BORDER: "Border Crossing",
  DROP_HOOK: "Drop / Hook",
  TRIP_FINISHED: "Trip Finished",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  TRIP_START: "border-emerald-500/50 bg-emerald-500/20 text-emerald-200",
  TRIP_FINISHED: "border-sky-500/50 bg-sky-500/20 text-sky-200",
  CROSSED_BORDER: "border-amber-500/50 bg-amber-500/20 text-amber-200",
  DROP_HOOK: "border-purple-500/50 bg-purple-500/20 text-purple-200",
  default: "border-white/20 bg-white/10 text-neutral-200",
};

export default function TripEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTripId = searchParams.get("tripId");

  // State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [tripId, setTripId] = useState("");
  const [eventType, setEventType] = useState("");
  const [stopLabel, setStopLabel] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter state
  const [filterTripId, setFilterTripId] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterEventType, setFilterEventType] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    uniqueTrips: 0,
    borderCrossings: 0,
    tripsCompleted: 0,
  });

  // Fetch trips
  useEffect(() => {
    fetch("/api/trips")
      .then(r => r.json())
      .then(data => {
        const tripsList = data.data || data;
        setTrips(tripsList);
      })
      .catch(err => console.error("Error fetching trips:", err));
  }, []);

  // Fetch events
  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filterTripId) params.set("tripId", filterTripId);
      if (filterDriver) params.set("driver", filterDriver);
      if (filterUnit) params.set("unit", filterUnit);
      if (filterEventType) params.set("eventType", filterEventType);

      const response = await fetch(`/api/trip-events?${params}`);
      const data = await response.json();
      
      setEvents(data.events || []);
      
      // Calculate statistics
      const uniqueTrips = new Set(data.events?.map((e: TripEvent) => e.tripId) || []).size;
      const borderCrossings = data.events?.filter((e: TripEvent) => e.eventType === "CROSSED_BORDER").length || 0;
      const tripsCompleted = data.events?.filter((e: TripEvent) => e.eventType === "TRIP_FINISHED").length || 0;
      
      setStats({ uniqueTrips, borderCrossings, tripsCompleted });
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, [filterTripId, filterDriver, filterUnit, filterEventType]);

  // Load selected trip
  useEffect(() => {
    if (tripId && trips.length > 0) {
      const trip = trips.find(t => t.id === tripId);
      setSelectedTrip(trip || null);
    } else {
      setSelectedTrip(null);
    }
  }, [tripId, trips]);

  // Use geolocation
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(6));
          setLon(position.coords.longitude.toFixed(6));
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setMessage({ type: "error", text: "Unable to get current location" });
          setLoading(false);
        }
      );
    } else {
      setMessage({ type: "error", text: "Geolocation not supported" });
    }
  };

  // Quick action buttons
  const quickActions = [
    { type: "TRIP_START", label: "Trip Start" },
    { type: "CROSSED_BORDER", label: "Crossed Border" },
    { type: "DROP_HOOK", label: "Drop / Hook" },
    { type: "ARRIVED_DELIVERY", label: "Arrived Delivery" },
    { type: "LEFT_DELIVERY", label: "Left Delivery" },
    { type: "TRIP_FINISHED", label: "Trip Finished" },
  ];

  const handleQuickAction = async (type: string) => {
    if (!tripId) {
      setMessage({ type: "error", text: "Please select a trip first" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: type,
          stopLabel: stopLabel || EVENT_TYPE_LABELS[type],
          notes: notes || "",
          lat: lat ? parseFloat(lat) : undefined,
          lon: lon ? parseFloat(lon) : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to log event");
      
      setMessage({ type: "success", text: "Event logged successfully" });
      setStopLabel("");
      setNotes("");
      fetchEvents(); // Refresh the feed
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to log event" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setFilterTripId("");
    setFilterDriver("");
    setFilterUnit("");
    setFilterEventType("");
  };

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-semibold text-white">Trip Event Monitor</h1>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/40">
          <p className="text-[11px] uppercase tracking-wide text-white/60">Unique Trips Touched</p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.uniqueTrips}</p>
        </Card>

        <Card className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/40">
          <p className="text-[11px] uppercase tracking-wide text-white/60">Border Crossings</p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.borderCrossings}</p>
          <p className="mt-1 text-[11px] text-white/40">Triggers add-on costing + guardrails</p>
        </Card>

        <Card className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/40">
          <p className="text-[11px] uppercase tracking-wide text-white/60">Trips Completed</p>
          <p className="mt-2 text-2xl font-semibold text-white">{stats.tripsCompleted}</p>
          <p className="mt-1 text-[11px] text-white/40">Marked finished in this window</p>
        </Card>
      </div>

      {/* Log Trip Milestone */}
      <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/40">
        <h2 className="mb-4 text-sm font-semibold text-neutral-200">Log Trip Milestone</h2>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-neutral-500">Trip</label>
              <select
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
              >
                <option value="">Choose a trip…</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id.substring(0, 8)} • {t.driver} ({t.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedTrip ? (
              <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-4">
                <p className="text-xs font-medium text-neutral-300">Trip Context</p>
                <div className="mt-2 space-y-1 text-xs text-neutral-400">
                  <p><span className="text-white">Driver:</span> {selectedTrip.driver}</p>
                  <p><span className="text-white">Unit:</span> {selectedTrip.unit}</p>
                  <p><span className="text-white">Status:</span> {selectedTrip.status}</p>
                  <p><span className="text-white">Route:</span> {selectedTrip.origin} → {selectedTrip.destination}</p>
                </div>
                <a
                  href={`/trips/${selectedTrip.id}`}
                  className="mt-3 inline-block text-xs text-sky-300 hover:text-sky-200"
                >
                  View trip details →
                </a>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-4 text-center text-xs text-neutral-400">
                Pick a trip to activate quick actions
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase tracking-wide text-neutral-500">Location Description</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                value={stopLabel}
                onChange={(e) => setStopLabel(e.target.value)}
                placeholder="e.g., Windsor Border Crossing"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-neutral-500">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-neutral-500">Notes</label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional context..."
              />
            </div>

            <Button
              type="button"
              variant="subtle"
              size="sm"
              className="w-full"
              onClick={useCurrentLocation}
              disabled={loading}
            >
              <Navigation className="mr-2 h-4 w-4" />
              {loading ? "Getting location..." : "Use current GPS snapshot"}
            </Button>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {quickActions.map(action => (
                <Button
                  key={action.type}
                  type="button"
                  disabled={!tripId || submitting}
                  onClick={() => handleQuickAction(action.type)}
                  className={`h-20 rounded-lg border text-sm font-semibold transition-all ${
                    tripId
                      ? "border-emerald-500/30 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                      : "border-neutral-800 bg-neutral-900/60 text-neutral-500"
                  } ${submitting ? "animate-pulse" : ""}`}
                >
                  {action.label}
                </Button>
              ))}
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-neutral-400">
                Events are immutable once logged. Double-check trip selection and event type before confirming.
                Coordinates are optional but help with route verification.
              </p>
            </div>

            {message && (
              <div className={`rounded-lg border p-3 text-sm ${
                message.type === "success" 
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              }`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Trip Events Feed */}
      <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/40">
        <h2 className="mb-4 text-sm font-semibold text-neutral-200">Recent Trip Events</h2>

        {/* Filter Row */}
        <div className="mb-4 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">Filter by Trip</label>
            <select
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              value={filterTripId}
              onChange={(e) => setFilterTripId(e.target.value)}
            >
              <option value="">All trips</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>{t.id.substring(0, 8)} • {t.driver}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">Driver</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              placeholder="Search..."
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">Unit</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              placeholder="Search..."
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-neutral-500">Event Type</label>
            <select
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none"
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
            >
              <option value="">All types</option>
              {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Row */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-neutral-400">
            Showing {events.length} events · {refreshing ? "Refreshing..." : "Live"}
          </p>
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={resetFilters}
          >
            Reset filters
          </Button>
        </div>

        {/* Events Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 text-left">
                <th className="pb-2 text-[11px] uppercase tracking-wide text-neutral-500">When</th>
                <th className="pb-2 text-[11px] uppercase tracking-wide text-neutral-500">Event</th>
                <th className="pb-2 text-[11px] uppercase tracking-wide text-neutral-500">Trip</th>
                <th className="pb-2 text-[11px] uppercase tracking-wide text-neutral-500">Driver · Unit</th>
                <th className="pb-2 text-[11px] uppercase tracking-wide text-neutral-500">Location/Notes</th>
              </tr>
            </thead>
            <tbody>
              {events.length > 0 ? (
                events.map(event => (
                  <tr key={event.id} className="border-b border-neutral-800/50 hover:bg-white/5">
                    <td className="py-3 text-xs text-neutral-300">
                      {new Date(event.at).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full border px-2 py-1 text-[10px] font-medium ${
                        EVENT_TYPE_COLORS[event.eventType] || EVENT_TYPE_COLORS.default
                      }`}>
                        {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                      </span>
                    </td>
                    <td className="py-3">
                      <a
                        href={`/trips/${event.tripId}`}
                        className="text-sm text-sky-300 hover:text-sky-200"
                      >
                        {event.tripId.substring(0, 8)}
                      </a>
                      <p className="text-xs text-neutral-500">{event.trip?.status}</p>
                    </td>
                    <td className="py-3 text-xs text-neutral-300">
                      <p>{event.trip?.driver}</p>
                      <p className="text-neutral-500">{event.trip?.unit}</p>
                    </td>
                    <td className="py-3 text-xs text-neutral-300">
                      <p>{event.stopLabel}</p>
                      {event.notes && <p className="italic text-neutral-500">{event.notes}</p>}
                      {event.lat && event.lon && (
                        <p className="text-neutral-500">{event.lat}, {event.lon}</p>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-950/40 p-5 text-sm text-neutral-400">
                      No trip events recorded for this filter set
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

