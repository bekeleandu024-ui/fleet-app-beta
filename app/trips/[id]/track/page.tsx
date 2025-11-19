"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Navigation, Clock, TrendingUp, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  orderId?: string;
}

interface TripEvent {
  id: string;
  tripId: string;
  eventType: string;
  eventLabel: string;
  timestamp: string;
  location?: string;
  coordinates?: { lat: number; lon: number };
  notes?: string;
  actor?: string;
}

interface RouteProgress {
  currentLocation?: { lat: number; lon: number; address?: string };
  distanceCompleted: number;
  distanceRemaining: number;
  percentComplete: number;
  estimatedTimeRemaining: string;
  onTimeStatus: "on-time" | "at-risk" | "delayed";
}

export default function TripTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [routeProgress, setRouteProgress] = useState<RouteProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTripData = async () => {
    try {
      const [tripResponse, eventsResponse] = await Promise.all([
        fetch(`/api/trips/${tripId}`),
        fetch(`/api/trip-events?tripId=${tripId}`),
      ]);

      if (tripResponse.ok) {
        const tripData = await tripResponse.json();
        setTrip(tripData);
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }

      // Calculate route progress (mock calculation for now)
      calculateRouteProgress();
    } catch (error) {
      console.error("Error fetching trip data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateRouteProgress = () => {
    // Mock route progress calculation
    // In production, this would come from GPS tracking service
    const progress: RouteProgress = {
      distanceCompleted: 245,
      distanceRemaining: 155,
      percentComplete: 61,
      estimatedTimeRemaining: "2h 15m",
      onTimeStatus: "on-time",
    };
    setRouteProgress(progress);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTripData();
  };

  useEffect(() => {
    fetchTripData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTripData();
    }, 30000);

    return () => clearInterval(interval);
  }, [tripId]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in progress":
      case "in transit":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "at pickup":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "at delivery":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    }
  };

  const getOnTimeStatusColor = (status: string) => {
    switch (status) {
      case "on-time":
        return "text-emerald-400";
      case "at-risk":
        return "text-amber-400";
      case "delayed":
        return "text-rose-400";
      default:
        return "text-neutral-400";
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "TRIP_START":
        return "bg-emerald-500/20 border-emerald-500/30";
      case "ARRIVED_PICKUP":
        return "bg-blue-500/20 border-blue-500/30";
      case "LEFT_PICKUP":
        return "bg-purple-500/20 border-purple-500/30";
      case "ARRIVED_DELIVERY":
        return "bg-amber-500/20 border-amber-500/30";
      case "LEFT_DELIVERY":
        return "bg-cyan-500/20 border-cyan-500/30";
      case "CROSSED_BORDER":
        return "bg-orange-500/20 border-orange-500/30";
      case "DROP_HOOK":
        return "bg-pink-500/20 border-pink-500/30";
      case "TRIP_FINISHED":
        return "bg-emerald-500/20 border-emerald-500/30";
      default:
        return "bg-neutral-500/20 border-neutral-500/30";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-400" />
          <p className="mt-2 text-sm text-gray-400">Loading trip data...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex h-screen items-center justify-center bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
          <p className="mt-2 text-sm text-gray-400">Trip not found</p>
          <Button onClick={() => router.push("/trips")} className="mt-4">
            Back to Trips
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800 bg-linear-to-r from-gray-900 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/trips")}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Navigation className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Trip #{trip.tripNumber}</h1>
                <p className="text-sm text-gray-400">Real-time tracking & monitoring</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-4 py-1.5 text-sm font-medium ${getStatusColor(trip.status)}`}>
              {trip.status}
            </span>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gray-800 hover:bg-gray-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Trip Info & Route Progress */}
          <div className="col-span-4 space-y-6">
            {/* Trip Details Card */}
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Trip Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Driver</p>
                  <p className="text-sm text-white font-medium">{trip.driver}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Unit</p>
                  <p className="text-sm text-white font-medium">{trip.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Route</p>
                  <div className="flex items-center gap-2 text-sm text-white">
                    <span>{trip.pickup}</span>
                    <span className="text-gray-500">→</span>
                    <span>{trip.delivery}</span>
                  </div>
                </div>
                {trip.eta && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Estimated Arrival</p>
                    <p className="text-sm text-white font-medium">
                      {new Date(trip.eta).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Route Progress Card */}
            {routeProgress && (
              <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-300">Route Progress</h3>
                  <span className={`text-xs font-medium ${getOnTimeStatusColor(routeProgress.onTimeStatus)}`}>
                    {routeProgress.onTimeStatus === "on-time" ? "On Time" : 
                     routeProgress.onTimeStatus === "at-risk" ? "At Risk" : "Delayed"}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>{routeProgress.percentComplete}% Complete</span>
                    <span>{routeProgress.estimatedTimeRemaining} remaining</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${routeProgress.percentComplete}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Completed</p>
                    <p className="text-lg text-white font-semibold">{routeProgress.distanceCompleted} mi</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Remaining</p>
                    <p className="text-lg text-white font-semibold">{routeProgress.distanceRemaining} mi</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Last Known Location Card */}
            {trip.lastPing && (
              <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Last Known Location</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-white">
                    {routeProgress?.currentLocation?.address || "Location tracking active"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated {new Date(trip.lastPing).toLocaleString()}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Center Column - Map Visualization */}
          <div className="col-span-5">
            <Card className="h-[calc(100vh-200px)] bg-gray-900/50 backdrop-blur border-gray-800 overflow-hidden">
              <div className="h-full flex items-center justify-center bg-gray-800/30">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500">Map visualization</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Integration with mapping service required
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Event Timeline */}
          <div className="col-span-3">
            <Card className="p-6 bg-gray-900/50 backdrop-blur border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">Event Timeline</h3>
                <Clock className="h-4 w-4 text-gray-500" />
              </div>

              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No events recorded yet</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className={`p-3 rounded-lg border ${getEventColor(event.eventType)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-white">{event.eventLabel}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.notes && (
                        <p className="text-xs text-gray-400 mt-2">{event.notes}</p>
                      )}
                      {event.actor && (
                        <p className="text-xs text-gray-500 mt-1">by {event.actor}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
