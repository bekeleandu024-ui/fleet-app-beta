"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Truck, CheckCircle, Clock, Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { processVoiceCommand } from "@/app/actions/voice-actions";

interface Trip {
  id: string;
  driver: string;
  unit: string;
  status: string;
  pickup: string;
  delivery: string;
}

interface TripEvent {
  id: string;
  tripId: string;
  eventType: string;
  timestamp: string;
  stopLabel: string;
  notes: string;
  lat?: number;
  lon?: number;
  trip: Trip;
}

const EVENT_TYPES = [
  { id: "TRIP_START", label: "Trip Start", color: "bg-blue-600 hover:bg-blue-500" },
  { id: "ARRIVED_PICKUP", label: "Arrived Pickup", color: "bg-emerald-600 hover:bg-emerald-500" },
  { id: "LEFT_PICKUP", label: "Left Pickup", color: "bg-emerald-700 hover:bg-emerald-600" },
  { id: "CROSSED_BORDER", label: "Crossed Border", color: "bg-amber-600 hover:bg-amber-500" },
  { id: "DROP_HOOK", label: "Drop / Hook", color: "bg-purple-600 hover:bg-purple-500" },
  { id: "ARRIVED_DELIVERY", label: "Arrived Delivery", color: "bg-orange-600 hover:bg-orange-500" },
  { id: "LEFT_DELIVERY", label: "Left Delivery", color: "bg-orange-700 hover:bg-orange-600" },
  { id: "TRIP_FINISHED", label: "Finished Trip", color: "bg-zinc-600 hover:bg-zinc-500" },
];

export default function TripEventsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Location state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Ref to hold the latest version of the handler to avoid stale closures
  const handleVoiceCommandRef = useRef<(transcript: string) => Promise<void>>(async () => {});

  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log("Voice transcript:", transcript);
          setIsListening(false);
          // Call the latest handler via ref
          handleVoiceCommandRef.current(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          setMessage({ type: "error", text: "Voice recognition failed. Try again." });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  useEffect(() => {
    fetchTrips();
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await fetch("/api/trips");
      const data = await res.json();
      setTrips(data.data || []);
    } catch (err) {
      console.error("Error fetching trips:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/trip-events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
          setMessage({ type: "success", text: "Location acquired" });
          setTimeout(() => setMessage(null), 3000);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setMessage({ type: "error", text: "Could not get location" });
          setLoading(false);
        }
      );
    }
  };

  const handleEventLog = async (eventType: string, label: string) => {
    if (!selectedTripId) {
      setMessage({ type: "error", text: "Please select a trip first" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        eventType,
        stopLabel: label,
        lat: coords?.lat,
        lon: coords?.lng,
        notes: `Logged via Driver App at ${new Date().toLocaleTimeString()}`
      };

      const res = await fetch(`/api/trips/${selectedTripId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to log event");

      setMessage({ type: "success", text: `${label} logged successfully` });
      fetchEvents();
      fetchTrips(); // Update trip status
    } catch (err) {
      setMessage({ type: "error", text: "Failed to log event" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setMessage({ type: "success", text: "Listening... Speak now" });
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleVoiceCommand = async (transcript: string) => {
    if (!selectedTripId) {
      setMessage({ type: "error", text: "Please select a trip first" });
      return;
    }

    setVoiceProcessing(true);
    setMessage({ type: "success", text: `Processing: "${transcript}"...` });

    try {
      const result = await processVoiceCommand(transcript);
      
      if (result.eventType && result.confidence > 70) {
        const eventLabel = EVENT_TYPES.find(e => e.id === result.eventType)?.label || result.eventType;
        setMessage({ type: "success", text: `Recognized: ${eventLabel}` });
        
        await handleEventLog(result.eventType, eventLabel);
      } else {
        setMessage({ type: "error", text: "Could not understand command. Try again." });
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      setMessage({ type: "error", text: "Error processing voice command" });
    } finally {
      setVoiceProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 text-zinc-200">
      <div className="mx-auto max-w-5xl space-y-8">
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Driver Event Log</h1>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${coords ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="text-xs text-zinc-500">{coords ? "GPS Active" : "GPS Inactive"}</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[400px,1fr]">
          
          {/* Control Panel */}
          <div className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900/50 p-6">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Select Active Trip
              </label>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
              >
                <option value="">-- Select Trip --</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id.substring(0, 8)} • {t.driver}
                  </option>
                ))}
              </select>

              {selectedTrip && (
                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-zinc-400">Status:</span>
                    <span className="font-medium text-emerald-400">{selectedTrip.status}</span>
                  </div>
                  <div className="space-y-1 text-zinc-300">
                    <p><span className="text-zinc-500">Unit:</span> {selectedTrip.unit}</p>
                    <p><span className="text-zinc-500">From:</span> {selectedTrip.pickup}</p>
                    <p><span className="text-zinc-500">To:</span> {selectedTrip.delivery}</p>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Button
                  variant="primary"
                  className={`w-full py-6 text-lg font-bold transition-all ${
                    isListening 
                      ? "animate-pulse bg-red-600 hover:bg-red-700" 
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                  onClick={toggleListening}
                  disabled={!selectedTripId || voiceProcessing}
                >
                  {voiceProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Processing...
                    </>
                  ) : isListening ? (
                    <>
                      <MicOff className="mr-2 h-6 w-6" />
                      Listening...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-6 w-6" />
                      Voice Command
                    </>
                  )}
                </Button>

                <Button 
                  variant="subtle" 
                  className="w-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                  onClick={getCurrentLocation}
                  disabled={loading}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  {loading ? "Acquiring GPS..." : "Update GPS Location"}
                </Button>
                {coords && (
                  <p className="mt-2 text-center text-xs text-zinc-500">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </Card>

            {message && (
              <div className={`rounded-lg border p-4 text-center text-sm font-medium ${
                message.type === "success" 
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              }`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Action Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleEventLog(type.id, type.label)}
                  disabled={!selectedTripId || submitting}
                  className={`flex h-24 flex-col items-center justify-center rounded-xl border border-transparent p-4 text-white transition-all ${
                    !selectedTripId 
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-500 opacity-50" 
                      : `${type.color} shadow-lg hover:scale-[1.02] active:scale-95`
                  }`}
                >
                  <span className="text-lg font-bold">{type.label}</span>
                </button>
              ))}
            </div>

            {/* Recent History */}
            <Card className="border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <Clock className="h-4 w-4" />
                Recent Activity Log
              </h3>
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-4 border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                    <div className="mt-1 rounded-full bg-zinc-800 p-2">
                      <CheckCircle className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{event.stopLabel}</p>
                      <p className="text-xs text-zinc-400">
                        {new Date(event.timestamp).toLocaleString()} • {event.trip?.driver}
                      </p>
                      {event.lat && (
                        <p className="text-[10px] text-zinc-600">
                          Loc: {event.lat}, {event.lon}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-center text-sm text-zinc-500">No events recorded yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

