"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, User, RefreshCw, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

interface Trip {
  id: string;
  tripNumber: string;
  driver: string;
  unit: string;
  status: string;
  pickup: string;
  delivery: string;
  eta?: string;
  lastPing?: string;
}

interface TripEvent {
  id: string;
  tripId: string;
  eventType: string;
  eventLabel: string;
  stopLabel?: string;
  location?: string;
  lat?: number;
  lon?: number;
  notes?: string;
  actor: string;
  actorType: string;
  timestamp: string;
  createdAt: string;
}

interface EventFeedProps {
  tripId: string | null;
  trip?: Trip | null;
  refreshTrigger?: number;
  autoRefresh?: boolean;
  autoRefreshInterval?: number;
  className?: string;
}

export function EventFeed({
  tripId,
  trip,
  refreshTrigger = 0,
  autoRefresh = true,
  autoRefreshInterval = 15000, // 15 seconds
  className = "",
}: EventFeedProps) {
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchEvents = async () => {
    if (!tripId) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trip-events?tripId=${tripId}`);
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and manual refresh trigger
  useEffect(() => {
    fetchEvents();
  }, [tripId, refreshTrigger]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !tripId) return;

    const interval = setInterval(fetchEvents, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [tripId, autoRefresh, autoRefreshInterval]);

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "TRIP_START":
        return "border-l-emerald-500 bg-emerald-500/5";
      case "ARRIVED_PICKUP":
        return "border-l-blue-500 bg-blue-500/5";
      case "LEFT_PICKUP":
        return "border-l-purple-500 bg-purple-500/5";
      case "ARRIVED_DELIVERY":
        return "border-l-amber-500 bg-amber-500/5";
      case "LEFT_DELIVERY":
        return "border-l-cyan-500 bg-cyan-500/5";
      case "CROSSED_BORDER":
        return "border-l-orange-500 bg-orange-500/5";
      case "DROP_HOOK":
        return "border-l-pink-500 bg-pink-500/5";
      case "TRIP_FINISHED":
        return "border-l-emerald-500 bg-emerald-500/5";
      default:
        return "border-l-neutral-500 bg-neutral-500/5";
    }
  };

  return (
    <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">Trip Activity Log</h3>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-[10px] text-neutral-500">
              Updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchEvents}
            disabled={isLoading || !tripId}
            className="rounded-md p-1 text-neutral-400 hover:bg-white/5 hover:text-neutral-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {trip && (
        <div className="mb-6 space-y-4 text-sm border-b border-neutral-800 pb-4">
          {/* Trip ID */}
          <div className="p-3 rounded-lg bg-black/40 border border-zinc-800/50">
            <div className="text-xs text-zinc-500 mb-1">Trip ID</div>
            <div className="font-mono text-zinc-300">
              {trip.tripNumber || trip.id.substring(0, 8).toUpperCase()}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <div className="text-xs text-zinc-500 mb-1">Equipment</div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-200">{trip.unit} • {trip.driver}</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="text-xs text-zinc-500 mb-1">Status</div>
            <Chip tone={trip.status === "Completed" ? "success" : "default"} className={trip.status !== "Completed" ? "bg-zinc-900 border-zinc-800 text-zinc-400" : ""}>
              {trip.status}
            </Chip>
          </div>

          {/* Route */}
          <div>
            <div className="text-xs text-zinc-500 mb-2">Route</div>
            <div className="space-y-2">
              {/* Pickup Section */}
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <div className="flex-1">
                  <div className="text-zinc-200">{trip.pickup || "Origin"}</div>
                  {/* Pickup Events */}
                  <div className="mt-2 space-y-1">
                    {events
                      .filter(e => ['TRIP_START', 'ARRIVED_PICKUP', 'LEFT_PICKUP'].includes(e.eventType))
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map(event => (
                      <div key={event.id} className="flex items-center gap-2 text-xs text-zinc-400 pl-2 border-l-2 border-zinc-800 ml-1">
                        <span className="text-emerald-400 font-medium">{event.eventLabel}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {event.location ? (
                          <span className="text-zinc-600 hidden sm:inline">• {event.location}</span>
                        ) : (event.lat && event.lon) ? (
                          <span className="text-zinc-600 hidden sm:inline">• {event.lat.toFixed(4)}, {event.lon.toFixed(4)}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="ml-[3px] border-l-2 border-dashed border-zinc-800 pb-2">
                <div className="pl-6 pt-2 space-y-1">
                  {events
                    .filter(e => ['ARRIVED_DELIVERY', 'LEFT_DELIVERY', 'TRIP_FINISHED'].includes(e.eventType))
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map(event => (
                    <div key={event.id} className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="text-rose-400 font-medium">{event.eventLabel}</span>
                      <span className="text-zinc-600">•</span>
                      <span>{new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {event.location ? (
                        <span className="text-zinc-600 hidden sm:inline">• {event.location}</span>
                      ) : (event.lat && event.lon) ? (
                        <span className="text-zinc-600 hidden sm:inline">• {event.lat.toFixed(4)}, {event.lon.toFixed(4)}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Delivery Section */}
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                <div className="flex-1">
                  <div className="text-zinc-200">{trip.delivery || "Destination"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          {error}
        </div>
      )}

      {!tripId ? (
        <div className="py-8 text-center text-sm text-neutral-500">Select a trip to view events</div>
      ) : events.length === 0 ? (
        <div className="py-8 text-center text-sm text-neutral-500">
          {isLoading ? "Loading events..." : "No events recorded yet"}
        </div>
      ) : (
        <div className="max-h-[500px] space-y-2 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className={`rounded-lg border-l-4 border-white/10 p-3 transition-colors ${getEventColor(
                event.eventType
              )}`}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-white">{event.eventLabel}</span>
                <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <Clock className="h-3 w-3" />
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {(event.location || (event.lat && event.lon)) && (
                <div className="mb-1 flex items-start gap-1 text-xs text-neutral-400">
                  <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <span>
                    {event.location || `${event.lat?.toFixed(6)}, ${event.lon?.toFixed(6)}`}
                  </span>
                </div>
              )}

              {event.notes && (
                <div className="mb-1 text-xs italic text-neutral-400">"{event.notes}"</div>
              )}

              <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                <User className="h-3 w-3" />
                <span>
                  {event.actor} ({event.actorType})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

