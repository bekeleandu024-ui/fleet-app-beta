"use client";

import { useState, useEffect } from "react";
import { TripSelector } from "@/components/trip-events/trip-selector";
import { QuickActionButtons } from "@/components/trip-events/quick-action-buttons";
import { GPSCapture } from "@/components/trip-events/gps-capture";
import { EventFeed } from "@/components/trip-events/event-feed";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, Send, Loader2, CheckCircle, XCircle } from "lucide-react";

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

interface Coordinates {
  lat: number;
  lon: number;
}

export default function TripEventPage() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastEventType, setLastEventType] = useState<string | null>(null);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");

  // Fetch active trips on mount and refresh periodically
  const fetchTrips = () => {
    fetch("/api/trips")
      .then((res) => res.json())
      .then((data) => {
        // Filter for active trips - include more statuses for newly booked trips
        const activeTrips = (data.data || []).filter((trip: Trip) => 
          !["Completed", "Delivered", "Cancelled"].includes(trip.status)
        );
        setTrips(activeTrips);
      })
      .catch((err) => console.error("Failed to fetch trips:", err));
  };

  useEffect(() => {
    fetchTrips();
    
    // Refresh trips every 30 seconds
    const interval = setInterval(fetchTrips, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTripSelect = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    setSelectedTrip(trip || null);
    setSelectedTripId(tripId);
    setSubmitStatus("idle");
    setLastEventType(null);
  };

  const handleLocationCapture = (location: { lat: number; lon: number; address?: string }) => {
    setLocation(location.address || `${location.lat}, ${location.lon}`);
    setCoordinates({ lat: location.lat, lon: location.lon });
  };

  const handleQuickAction = async (eventType: string, eventLabel: string) => {
    if (!selectedTrip) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/trip-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId: selectedTrip.id,
          eventType,
          eventLabel,
          location: location || null,
          coordinates: coordinates || null,
          notes: notes || `Quick action: ${eventLabel}`,
          actor: "Dispatcher", // In production, would be from auth context
          actorType: "USER",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to log event");
      }

      const result = await response.json();

      setSubmitStatus("success");
      setLastEventType(eventType);
      
      // Clear notes after successful submission
      setNotes("");

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error logging event:", error);
      setSubmitStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to log event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomEvent = async () => {
    if (!selectedTrip || !location) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/trip-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId: selectedTrip.id,
          eventType: "CUSTOM",
          eventLabel: "Custom Event",
          location,
          coordinates: coordinates || null,
          notes: notes || "Manual event log",
          actor: "Dispatcher",
          actorType: "USER",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to log event");
      }

      setSubmitStatus("success");
      setLastEventType("CUSTOM");
      
      // Clear form after successful submission
      setLocation("");
      setCoordinates(null);
      setNotes("");

      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error logging event:", error);
      setSubmitStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to log event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-gray-900 via-slate-900 to-gray-900">
      {/* Header */}
      <div className="flex-none border-b border-gray-800 bg-linear-to-r from-gray-900 to-slate-900 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Radio className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Trip Event Console</h1>
            <p className="text-sm text-gray-400">Real-time trip event logging & tracking</p>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-4 p-4">
          {/* Left Column - Trip Selection & Quick Actions */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            <TripSelector
              trips={trips}
              selectedTripId={selectedTripId}
              onTripSelect={handleTripSelect}
            />
            <QuickActionButtons
              onAction={handleQuickAction}
              disabled={!selectedTrip || isSubmitting}
            />
          </div>

          {/* Center Column - Custom Event Form */}
          <div className="col-span-5 space-y-4 overflow-y-auto">
            <GPSCapture onLocationCapture={handleLocationCapture} />

            {/* Notes Input */}
            <Card className="p-4 bg-gray-900/50 backdrop-blur border-gray-800">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
                placeholder="Add context about this event..."
                disabled={isSubmitting}
              />
            </Card>

            {/* Submit Custom Event */}
            <Card className="p-4 bg-gray-900/50 backdrop-blur border-gray-800">
              <Button
                onClick={handleCustomEvent}
                disabled={!selectedTrip || !location || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging Event...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Log Custom Event
                  </>
                )}
              </Button>
            </Card>

            {/* Submit Status */}
            {submitStatus !== "idle" && (
              <Card className={`p-4 ${
                submitStatus === "success"
                  ? "bg-emerald-900/20 border-emerald-500/30"
                  : "bg-rose-900/20 border-rose-500/30"
              }`}>
                <div className="flex items-center gap-2">
                  {submitStatus === "success" ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300 font-medium">
                        Event logged successfully
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400" />
                      <div className="flex-1">
                        <span className="text-rose-300 font-medium block">Failed to log event</span>
                        {errorMessage && (
                          <span className="text-rose-400 text-sm">{errorMessage}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Event Feed */}
          <div className="col-span-4 overflow-y-auto">
            <EventFeed tripId={selectedTrip?.id || null} key={lastEventType} />
          </div>
        </div>
      </div>
    </div>
  );
}

