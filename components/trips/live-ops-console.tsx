"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Radio,
  RotateCcw,
  Send,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";

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
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface LiveOpsConsoleProps {
  tripId: string;
  tripNumber: string;
  stops: Array<{
    type: string;
    location: string;
    sequence: number;
  }>;
  driverName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LiveOpsConsole({ tripId, tripNumber, stops, driverName }: LiveOpsConsoleProps) {
  const {
    isConnected,
    events,
    pendingTrigger,
    currentStageIndex,
    completedStages,
    triggerGeofenceEvent,
    cancelPendingTrigger,
    canTriggerEvent,
    subscribeTripEvents,
    unsubscribeTripEvents,
  } = useTripEvents();

  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // Subscribe to this trip's events
  useEffect(() => {
    subscribeTripEvents(tripId);
    return () => unsubscribeTripEvents();
  }, [tripId, subscribeTripEvents, unsubscribeTripEvents]);

  // Get relevant locations based on current stage
  const getLocationForStage = (eventType: TripEventType): string => {
    switch (eventType) {
      case "ARRIVED_PICKUP":
      case "LOADED_DEPART":
        return stops.find(s => s.type === "Pickup")?.location || stops[0]?.location || "Pickup Location";
      case "ARRIVED_DELIVERY":
      case "UNLOADED_COMPLETE":
        return stops.find(s => s.type === "Delivery")?.location || stops[stops.length - 1]?.location || "Delivery Location";
      default:
        return selectedLocation || "Location";
    }
  };

  // Handle trigger button click
  const handleTrigger = useCallback(async (eventType: TripEventType) => {
    setIsTriggering(true);
    const location = getLocationForStage(eventType);
    
    // Simulate slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    triggerGeofenceEvent(tripId, tripNumber, eventType, location);
    setIsTriggering(false);
  }, [tripId, tripNumber, triggerGeofenceEvent, stops, selectedLocation]);

  // Get status color for stage
  const getStageStatus = (index: number, eventType: TripEventType) => {
    if (completedStages.includes(eventType)) return "completed";
    if (pendingTrigger?.eventType === eventType) return "pending";
    if (index === currentStageIndex) return "current";
    return "upcoming";
  };

  return (
    <Card className="border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-neutral-900/60 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Radio className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Live Operations Console</h3>
            <p className="text-xs text-neutral-500">Manual Geofence Triggers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
          <span className="text-xs text-neutral-500">{isConnected ? "Live" : "Offline"}</span>
        </div>
      </div>

      {/* Driver Status */}
      {driverName && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-800/50 mb-4">
          <Truck className="h-4 w-4 text-neutral-400" />
          <span className="text-sm text-neutral-300">{driverName}</span>
          <span className="ml-auto text-xs text-neutral-500">Connected</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TRIP LIFECYCLE STEPPER
      ───────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3 mb-4">
        <p className="text-xs text-neutral-500 uppercase tracking-wide">Trip Lifecycle</p>
        
        {TRIP_LIFECYCLE_STAGES.map((stage, index) => {
          const status = getStageStatus(index, stage.eventType);
          const canTrigger = canTriggerEvent(stage.eventType);
          const isPending = pendingTrigger?.eventType === stage.eventType;
          
          return (
            <div key={stage.eventType} className="relative">
              {/* Connector line */}
              {index < TRIP_LIFECYCLE_STAGES.length - 1 && (
                <div className={`absolute left-4 top-10 w-0.5 h-6 ${
                  status === "completed" ? "bg-emerald-500" : "bg-neutral-700"
                }`} />
              )}
              
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                status === "completed" ? "bg-emerald-500/10 border border-emerald-500/30" :
                status === "pending" ? "bg-amber-500/10 border border-amber-500/30" :
                status === "current" ? "bg-blue-500/10 border border-blue-500/30" :
                "bg-neutral-800/30 border border-neutral-800"
              }`}>
                {/* Status Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  status === "completed" ? "bg-emerald-500" :
                  status === "pending" ? "bg-amber-500" :
                  status === "current" ? "bg-blue-500" :
                  "bg-neutral-700"
                }`}>
                  {status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : status === "pending" ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  )}
                </div>
                
                {/* Label & Action */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    status === "completed" ? "text-emerald-400" :
                    status === "pending" ? "text-amber-400" :
                    status === "current" ? "text-blue-400" :
                    "text-neutral-400"
                  }`}>
                    {stage.label}
                  </p>
                  
                  {status === "completed" && (
                    <p className="text-xs text-emerald-500/70 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Confirmed
                    </p>
                  )}
                  
                  {isPending && (
                    <p className="text-xs text-amber-400 flex items-center gap-1 animate-pulse">
                      <Clock className="h-3 w-3" /> Waiting for Driver Confirmation...
                    </p>
                  )}
                </div>
                
                {/* Action Button */}
                {canTrigger && !isPending && status === "current" && (
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() => handleTrigger(stage.eventType)}
                    disabled={isTriggering || !!pendingTrigger}
                    className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
                  >
                    {isTriggering ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-1" />
                        Trigger
                      </>
                    )}
                  </Button>
                )}
                
                {isPending && (
                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={cancelPendingTrigger}
                    className="text-amber-400 hover:text-amber-300 shrink-0"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          PENDING TRIGGER NOTIFICATION
      ───────────────────────────────────────────────────────────────────── */}
      {pendingTrigger && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-300">
                Geofence Trigger Sent
              </p>
              <p className="text-xs text-amber-400/70 mt-1">
                Waiting for driver to confirm: <strong>{pendingTrigger.eventLabel}</strong>
              </p>
              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {pendingTrigger.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          RECENT ACTIVITY LOG
      ───────────────────────────────────────────────────────────────────── */}
      <div className="border-t border-neutral-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Activity Log</p>
          {events.length > 0 && (
            <span className="text-xs text-neutral-600">{events.length} events</span>
          )}
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-xs text-neutral-600 text-center py-4">No events logged yet</p>
          ) : (
            events.slice(0, 5).map((event) => (
              <ActivityLogItem key={event.id} event={event} />
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ActivityLogItem({ event }: { event: TripEvent }) {
  const sourceLabel = event.source === "DRIVER_VOICE" 
    ? "Driver Voice (Manual)" 
    : event.source === "GEOFENCE_DISPATCH"
    ? "Geofence/Dispatch (Verified)"
    : event.source;
    
  const sourceColor = event.source === "DRIVER_VOICE" 
    ? "text-purple-400" 
    : event.source === "GEOFENCE_DISPATCH"
    ? "text-blue-400"
    : "text-neutral-400";

  return (
    <div className="flex items-start gap-2 p-2 rounded bg-neutral-800/30 text-xs">
      <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-neutral-200 font-medium">{event.eventLabel}</p>
        <p className="text-neutral-500 truncate">{event.location}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`${sourceColor}`}>Source: {sourceLabel}</span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-600">{formatDateTime(event.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
