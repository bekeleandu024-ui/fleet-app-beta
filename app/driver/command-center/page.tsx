"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Mic,
  MicOff,
  Navigation,
  Phone,
  Radio,
  RefreshCw,
  Truck,
  User,
  Volume2,
  X,
  Zap,
} from "lucide-react";

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useTripEvents,
  TRIP_LIFECYCLE_STAGES,
  type TripEvent,
  type TripEventType,
} from "@/lib/trip-events-context";
import { formatDateTime } from "@/lib/format";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Trip {
  id: string;
  tripNumber: string;
  driver: string;
  status: string;
  pickup: string;
  delivery: string;
  eta?: string;
}

// Voice command patterns
const VOICE_PATTERNS: Record<string, TripEventType> = {
  "arrived": "ARRIVED_PICKUP",
  "at pickup": "ARRIVED_PICKUP",
  "at the pickup": "ARRIVED_PICKUP",
  "loaded": "LOADED_DEPART",
  "departing": "LOADED_DEPART",
  "leaving": "LOADED_DEPART",
  "at delivery": "ARRIVED_DELIVERY",
  "at the delivery": "ARRIVED_DELIVERY",
  "delivered": "UNLOADED_COMPLETE",
  "unloaded": "UNLOADED_COMPLETE",
  "complete": "UNLOADED_COMPLETE",
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DriverCommandCenterPage() {
  const {
    isConnected,
    events,
    pendingTrigger,
    completedStages,
    confirmEvent,
    ignoreEvent,
    logVoiceEvent,
    subscribeTripEvents,
    canTriggerEvent,
  } = useTripEvents();

  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number; address?: string } | null>(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Fetch available trips on mount
  useEffect(() => {
    fetch("/api/trips")
      .then(res => res.json())
      .then(data => {
        const trips = (data.data || []).filter((t: Trip) => 
          ["In Transit", "Dispatched", "At Pickup", "At Delivery", "Pending", "Assigned"].includes(t.status)
        );
        setAvailableTrips(trips);
      })
      .catch(err => console.error("Failed to fetch trips:", err));
  }, []);

  // Select a trip
  const handleSelectTrip = useCallback((trip: Trip) => {
    setActiveTrip(trip);
    subscribeTripEvents(trip.id);
    setShowTripSelector(false);
  }, [subscribeTripEvents]);

  // Show modal when pending trigger arrives
  useEffect(() => {
    if (pendingTrigger && pendingTrigger.tripId === activeTrip?.id) {
      setShowGeofenceModal(true);
    }
  }, [pendingTrigger, activeTrip?.id]);

  // Get current GPS location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (err) => console.warn("GPS not available:", err)
      );
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(" ")
          .toLowerCase();
        
        setVoiceTranscript(transcript);
        
        // Check for command matches when final result
        if (event.results[event.results.length - 1].isFinal) {
          processVoiceCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // Process voice command
  const processVoiceCommand = useCallback((transcript: string) => {
    if (!activeTrip) return;
    
    // Find matching event type
    for (const [pattern, eventType] of Object.entries(VOICE_PATTERNS)) {
      if (transcript.includes(pattern) && canTriggerEvent(eventType)) {
        const location = currentLocation 
          ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`
          : "Current Location";
        
        logVoiceEvent(activeTrip.id, eventType, location, transcript);
        setVoiceTranscript("");
        return;
      }
    }
  }, [activeTrip, currentLocation, canTriggerEvent, logVoiceEvent]);

  // Toggle voice listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  // Handle geofence confirmation
  const handleConfirmGeofence = () => {
    if (pendingTrigger) {
      confirmEvent(pendingTrigger.id);
      setShowGeofenceModal(false);
    }
  };

  // Handle geofence ignore
  const handleIgnoreGeofence = () => {
    if (pendingTrigger) {
      ignoreEvent(pendingTrigger.id);
      setShowGeofenceModal(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* ═══════════════════════════════════════════════════════════════════
          GEOFENCE CONFIRMATION MODAL (High Priority Overlay)
      ═══════════════════════════════════════════════════════════════════ */}
      {showGeofenceModal && pendingTrigger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md mx-4 bg-neutral-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-amber-500/10 border-b border-amber-500/30 p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-amber-500/20 animate-pulse">
                  <MapPin className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-300">📍 Geofence Detected</h2>
                  <p className="text-sm text-amber-400/70">Dispatch Override</p>
                </div>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-xl font-semibold text-neutral-100 mb-2">
                  {pendingTrigger.eventLabel}
                </p>
                <p className="text-neutral-400">
                  at <span className="text-neutral-200 font-medium">{pendingTrigger.location}</span>
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
                <p className="text-sm text-neutral-400 text-center">
                  Confirm timestamp for this event?
                </p>
                <p className="text-xs text-neutral-500 text-center mt-1">
                  Triggered by: <span className="text-neutral-400">{pendingTrigger.triggeredBy}</span>
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  size="lg"
                  variant="subtle"
                  onClick={handleIgnoreGeofence}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-6"
                >
                  <X className="h-5 w-5 mr-2" />
                  Ignore
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirmGeofence}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-6"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Confirm Arrival
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="flex-none border-b border-neutral-800 bg-neutral-900/80 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Truck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">Driver Command Center</h1>
              <p className="text-xs text-neutral-500">Digital Walkie-Talkie Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              <span className="text-xs text-neutral-500">{isConnected ? "Connected" : "Offline"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 p-4 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Trip Selector */}
          <Card className="border-neutral-700 bg-neutral-900/60 p-3">
            <button
              onClick={() => setShowTripSelector(!showTripSelector)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-emerald-400" />
                <span className="text-neutral-200 font-medium">
                  {activeTrip ? `Trip: ${activeTrip.tripNumber}` : "Select a Trip"}
                </span>
              </div>
              <ChevronDown className={`h-5 w-5 text-neutral-400 transition-transform ${showTripSelector ? "rotate-180" : ""}`} />
            </button>
            
            {/* Trip Dropdown */}
            {showTripSelector && (
              <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                {availableTrips.length === 0 ? (
                  <p className="text-center text-neutral-500 py-4 text-sm">No trips available</p>
                ) : (
                  availableTrips.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleSelectTrip(trip)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeTrip?.id === trip.id
                          ? "bg-emerald-500/20 border border-emerald-500/30"
                          : "bg-neutral-800/50 hover:bg-neutral-700/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-neutral-100">{trip.tripNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          trip.status === "In Transit" ? "bg-blue-500/20 text-blue-300" :
                          trip.status === "Dispatched" ? "bg-amber-500/20 text-amber-300" :
                          trip.status === "At Pickup" ? "bg-emerald-500/20 text-emerald-300" :
                          trip.status === "At Delivery" ? "bg-purple-500/20 text-purple-300" :
                          "bg-neutral-500/20 text-neutral-300"
                        }`}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {trip.pickup} → {trip.delivery}
                      </div>
                      {trip.driver && (
                        <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                          <User className="h-3 w-3" /> {trip.driver}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </Card>

          {/* Active Trip Card */}
          {activeTrip ? (
            <Card className="border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-neutral-900/60 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs uppercase tracking-wide text-neutral-500">Active Trip</span>
                </div>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                  {activeTrip.status}
                </span>
              </div>
              
              <h2 className="text-xl font-bold text-neutral-100 mb-3">{activeTrip.tripNumber}</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Pickup</p>
                    <p className="text-neutral-200">{activeTrip.pickup}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="text-xs text-neutral-500">Delivery</p>
                    <p className="text-neutral-200">{activeTrip.delivery}</p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-neutral-800 bg-neutral-900/60 p-8 text-center">
              <Navigation className="h-12 w-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No trip selected</p>
              <p className="text-xs text-neutral-600 mt-1">Select a trip above to begin</p>
            </Card>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              VOICE COMMAND SECTION
          ───────────────────────────────────────────────────────────────── */}
          <Card className="border-purple-500/30 bg-gradient-to-b from-purple-950/20 to-neutral-900/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-neutral-200">Voice Command</span>
              </div>
              {isListening && (
                <span className="text-xs text-purple-400 animate-pulse">Listening...</span>
              )}
            </div>
            
            {/* Large Voice Button */}
            <button
              onClick={toggleListening}
              disabled={!activeTrip}
              className={`w-full py-8 rounded-2xl transition-all flex flex-col items-center justify-center gap-3 ${
                isListening 
                  ? "bg-purple-600 shadow-lg shadow-purple-500/30 scale-[1.02]" 
                  : "bg-neutral-800 hover:bg-neutral-700"
              } ${!activeTrip ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className={`p-4 rounded-full ${isListening ? "bg-white/20 animate-pulse" : "bg-purple-500/20"}`}>
                {isListening ? (
                  <Mic className="h-10 w-10 text-white" />
                ) : (
                  <MicOff className="h-10 w-10 text-purple-400" />
                )}
              </div>
              <span className={`text-lg font-semibold ${isListening ? "text-white" : "text-neutral-300"}`}>
                {isListening ? "Tap to Stop" : "Tap to Speak"}
              </span>
              <span className="text-xs text-neutral-400">
                Say: "I arrived" • "Loaded" • "Delivered"
              </span>
            </button>
            
            {/* Voice Transcript */}
            {voiceTranscript && (
              <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-sm text-purple-300">
                  <span className="text-purple-500">Heard:</span> "{voiceTranscript}"
                </p>
              </div>
            )}
          </Card>

          {/* ─────────────────────────────────────────────────────────────────
              TRIP ACTIVITY LOG
          ───────────────────────────────────────────────────────────────── */}
          <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-neutral-200">Trip Activity Log</span>
              </div>
              <span className="text-xs text-neutral-600">{events.length} events</span>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-sm text-neutral-600 text-center py-8">
                  No events logged yet
                </p>
              ) : (
                events.map((event) => (
                  <EventLogItem key={event.id} event={event} />
                ))
              )}
            </div>
          </Card>

          {/* Quick Status Buttons (Fallback) */}
          {activeTrip && (
            <Card className="border-neutral-800/70 bg-neutral-900/60 p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {TRIP_LIFECYCLE_STAGES.map((stage) => {
                  const isCompleted = completedStages.includes(stage.eventType);
                  const canUse = canTriggerEvent(stage.eventType);
                  
                  return (
                    <button
                      key={stage.eventType}
                      onClick={() => {
                        if (canUse && activeTrip) {
                          const location = currentLocation 
                            ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`
                            : "Current Location";
                          logVoiceEvent(activeTrip.id, stage.eventType, location);
                        }
                      }}
                      disabled={!canUse}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        isCompleted 
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                          : canUse
                          ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
                          : "bg-neutral-800/50 text-neutral-600 border border-neutral-800 cursor-not-allowed"
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                      {stage.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function EventLogItem({ event }: { event: TripEvent }) {
  const sourceColor = event.source === "DRIVER_VOICE" 
    ? "bg-purple-500/20 text-purple-400 border-purple-500/30" 
    : event.source === "GEOFENCE_DISPATCH"
    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
    : "bg-neutral-700 text-neutral-400 border-neutral-600";
    
  const sourceLabel = event.source === "DRIVER_VOICE" 
    ? "Driver Voice (Manual)" 
    : event.source === "GEOFENCE_DISPATCH"
    ? "Geofence/Dispatch (Verified)"
    : event.source;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800/30">
      <div className="p-2 rounded-full bg-emerald-500/10">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-neutral-200">{event.eventLabel}</p>
        </div>
        <p className="text-xs text-neutral-500 mb-2 flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {event.location}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs border ${sourceColor}`}>
            Source: {sourceLabel}
          </span>
          <span className="text-xs text-neutral-600">
            {formatDateTime(event.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
