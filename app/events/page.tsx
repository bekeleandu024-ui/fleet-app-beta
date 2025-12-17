"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Mic, MicOff, Loader2, Truck, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { processVoiceCommand } from "@/app/actions/voice-actions";
import { EventFeed } from "@/components/trip-events/event-feed";

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
  timestamp: string;
  stopLabel: string;
  notes: string;
  lat?: number;
  lon?: number;
  trip: Trip;
}

const EVENT_TYPES = [
  { id: "TRIP_START", label: "Start Trip", color: "bg-blue-600 hover:bg-blue-500", icon: Truck },
  { id: "ARRIVED_PICKUP", label: "Arrived Pickup", color: "bg-emerald-600 hover:bg-emerald-500", icon: MapPin },
  { id: "LEFT_PICKUP", label: "Depart Pickup", color: "bg-emerald-700 hover:bg-emerald-600", icon: Navigation },
  { id: "CROSSED_BORDER", label: "Border Cross", color: "bg-amber-600 hover:bg-amber-500", icon: MapPin },
  { id: "DROP_HOOK", label: "Drop / Hook", color: "bg-purple-600 hover:bg-purple-500", icon: Truck },
  { id: "ARRIVED_DELIVERY", label: "Arrived Drop", color: "bg-orange-600 hover:bg-orange-500", icon: MapPin },
  { id: "LEFT_DELIVERY", label: "Depart Drop", color: "bg-orange-700 hover:bg-orange-600", icon: Navigation },
  { id: "TRIP_FINISHED", label: "End Trip", color: "bg-zinc-600 hover:bg-zinc-500", icon: Calendar },
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
          setIsListening(false);
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
      fetchTrips(); 
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
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 bg-black text-zinc-200 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Driver Command Center</h1>
          <p className="text-xs text-zinc-500">Real-time event logging and trip management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${coords ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
            <div className={`h-2 w-2 rounded-full ${coords ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xs font-medium">{coords ? "GPS Active" : "GPS Inactive"}</span>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-12 min-h-0">
        
        {/* Left Panel: Controls (3 cols) */}
        <Card className="lg:col-span-3 flex flex-col gap-4 p-4 bg-zinc-900/50 border-zinc-800 h-full overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Active Trip
              </label>
              <select
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
              >
                <option value="">-- Select Trip --</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber} • {t.driver}
                  </option>
                ))}
              </select>
            </div>

            {selectedTrip ? (
              <div className="rounded-lg border border-zinc-800 bg-black/40 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400 text-xs">Status</span>
                  <span className="font-medium text-emerald-400 text-xs px-2 py-0.5 bg-emerald-500/10 rounded">{selectedTrip.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">Unit</span>
                    <p className="text-zinc-200 font-mono">{selectedTrip.unit}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase">Driver</span>
                    <p className="text-zinc-200 truncate">{selectedTrip.driver}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase">Route</span>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="truncate">{selectedTrip.pickup}</span>
                    </div>
                    <div className="ml-0.5 h-2 w-px bg-zinc-800" />
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      <span className="truncate">{selectedTrip.delivery}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-center">
                <Truck className="mx-auto h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500">Select a trip to view details</p>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <Button
                variant="primary"
                className={`w-full py-8 text-lg font-bold transition-all relative overflow-hidden ${
                  isListening 
                    ? "animate-pulse bg-red-600 hover:bg-red-700 border-red-500" 
                    : "bg-blue-600 hover:bg-blue-500 border-blue-500"
                }`}
                onClick={toggleListening}
                disabled={!selectedTripId || voiceProcessing}
              >
                <div className="relative z-10 flex flex-col items-center gap-1">
                  {voiceProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isListening ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                  <span className="text-sm font-medium">
                    {voiceProcessing ? "Processing..." : isListening ? "Listening..." : "Voice Command"}
                  </span>
                </div>
                {isListening && (
                  <div className="absolute inset-0 bg-red-500/20 animate-ping" />
                )}
              </Button>

              <Button 
                variant="outline" 
                className="w-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                onClick={getCurrentLocation}
                disabled={loading}
              >
                <Navigation className="mr-2 h-4 w-4" />
                {loading ? "Acquiring..." : "Update GPS"}
              </Button>
            </div>

            {message && (
              <div className={`rounded-md border p-3 text-center text-xs font-medium animate-in fade-in slide-in-from-bottom-2 ${
                message.type === "success" 
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              }`}>
                {message.text}
              </div>
            )}
          </div>
        </Card>

        {/* Middle Panel: Actions (5 cols) */}
        <Card className="lg:col-span-5 p-4 bg-zinc-900/50 border-zinc-800 flex flex-col h-full">
          <div className="mb-4 flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Quick Actions</h3>
            <span className="text-[10px] text-zinc-500">Tap to log event</span>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            {EVENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => handleEventLog(type.id, type.label)}
                  disabled={!selectedTripId || submitting}
                  className={`group relative flex flex-col items-center justify-center gap-2 rounded-lg border border-transparent p-4 text-white transition-all h-full ${
                    !selectedTripId 
                      ? "cursor-not-allowed bg-zinc-800/50 text-zinc-600" 
                      : `${type.color} shadow-lg hover:scale-[1.02] active:scale-95`
                  }`}
                >
                  <Icon className={`h-6 w-6 ${!selectedTripId ? "opacity-50" : "opacity-100"}`} />
                  <span className="text-sm font-bold text-center leading-tight">{type.label}</span>
                  {!selectedTripId && (
                    <div className="absolute inset-0 bg-black/10" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right Panel: Feed (4 cols) */}
        <EventFeed 
          tripId={selectedTripId || null} 
          trip={selectedTrip}
          refreshTrigger={events.length}
          className="lg:col-span-4 flex flex-col h-full bg-zinc-900/50 border-zinc-800"
        />
      </div>
    </div>
  );
}

