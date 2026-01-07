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
    <Card className="flex flex-col h-full border-[#1c1c22] bg-gradient-to-b from-[#1c1c22]/20 to-[#111114] p-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#2a2a32] border border-[#3a3a42]">
            <Radio className="h-3.5 w-3.5 text-[#a0a0b0]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#e8e8ed]">Live Operations Console</h3>
            <p className="text-[10px] text-[#5a5a6e]">Manual Geofence Triggers</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#5a7a6b]" : "bg-[#b45353]"}`} />
          <span className="text-[10px] text-[#5a5a6e]">{isConnected ? "Live" : "Offline"}</span>
        </div>
      </div>

      {/* Driver Status */}
      {driverName && (
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#1c1c22] mb-2">
          <Truck className="h-3.5 w-3.5 text-[#5a5a6e]" />
          <span className="text-xs text-[#a0a0b0]">{driverName}</span>
          <span className="ml-auto text-[10px] text-[#5a5a6e]">Connected</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TRIP LIFECYCLE STEPPER
      ───────────────────────────────────────────────────────────────────── */}
      <div className="space-y-1 mb-2">
        <p className="text-[10px] text-[#5a5a6e] uppercase tracking-wide">Trip Lifecycle</p>
        
        {TRIP_LIFECYCLE_STAGES.map((stage, index) => {
          const status = getStageStatus(index, stage.eventType);
          const canTrigger = canTriggerEvent(stage.eventType);
          const isPending = pendingTrigger?.eventType === stage.eventType;
          
          return (
            <div key={stage.eventType} className="relative">
              {/* Connector line */}
              {index < TRIP_LIFECYCLE_STAGES.length - 1 && (
                <div className={`absolute left-[14px] top-5 bottom-[-2px] w-px ${
                  status === "completed" ? "bg-[#3a3a42]" : "bg-[#1c1c22]"
                }`} />
              )}
              
              <div className={`flex items-center gap-2 p-1 rounded transition-all ${
                status === "completed" ? "bg-[#2a2a32] border border-[#3a3a42]" :
                status === "pending" ? "bg-[#c97a5a]/10 border border-[#c97a5a]/30" :
                status === "current" ? "bg-[#2a2a32] border border-[#3a3a42]" :
                "bg-[#1c1c22] border border-[#1c1c22]"
              }`}>
                {/* Status Icon */}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 text-[9px] ${
                  status === "completed" ? "bg-[#3a3a42]" :
                  status === "pending" ? "bg-[#c97a5a]" :
                  status === "current" ? "bg-[#5a6a8a]" :
                  "bg-[#1c1c22]"
                }`}>
                  {status === "completed" ? (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  ) : status === "pending" ? (
                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                  ) : (
                    <span className="font-bold text-white">{index + 1}</span>
                  )}
                </div>
                
                {/* Label & Action */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${
                    status === "completed" ? "text-[#a0a0b0]" :
                    status === "pending" ? "text-[#c97a5a]" :
                    status === "current" ? "text-[#a0a0b0]" :
                    "text-[#5a5a6e]"
                  }`}>
                    {stage.label}
                  </p>
                  
                  {isPending && (
                    <p className="text-[10px] text-[#c97a5a] flex items-center gap-1 animate-pulse">
                      <Clock className="h-2.5 w-2.5" /> Confirming...
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
                    className="bg-[#5a6a8a] hover:bg-[#6a7a9a] text-white shrink-0 h-6 px-1.5 text-[10px]"
                  >
                    {isTriggering ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
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
                    className="text-[#c97a5a] hover:text-[#d98a6a] shrink-0 h-7 px-2 text-[10px]"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
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
        <div className="p-2 rounded-lg bg-[#c97a5a]/10 border border-[#c97a5a]/30 mb-2">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-full bg-[#c97a5a]/20">
              <AlertTriangle className="h-3.5 w-3.5 text-[#c97a5a]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-[#c97a5a]">
                Trigger Sent
              </p>
              <p className="text-[10px] text-[#c97a5a]/70 mt-0.5">
                Waiting confirmation: <strong>{pendingTrigger.eventLabel}</strong>
              </p>
              <p className="text-[10px] text-[#5a5a6e] mt-0.5 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" /> {pendingTrigger.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          RECENT ACTIVITY LOG
      ───────────────────────────────────────────────────────────────────── */}
      <div className="border-t border-[#1c1c22] pt-2 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <p className="text-[10px] text-[#5a5a6e] uppercase tracking-wide">Activity Log</p>
          {events.length > 0 && (
            <span className="text-[10px] text-[#5a5a6e]">{events.length} events</span>
          )}
        </div>
        
        <div className="space-y-1 flex-1 overflow-y-auto min-h-0 pr-1 pb-1">
          {events.length === 0 ? (
            <p className="text-[10px] text-[#5a5a6e] text-center py-2">No events logged yet</p>
          ) : (
            events.map((event) => (
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
  return (
    <div className="flex items-center gap-1.5 py-1 px-1.5 rounded bg-[#1c1c22]/50 text-[10px]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#3a3a42] shrink-0" />
      <span className="text-[#a0a0b0] font-medium truncate flex-1">{event.eventLabel}</span>
      <span className="text-[#5a5a6e] whitespace-nowrap shrink-0">
        {formatDateTime(event.timestamp).split(',')[1]?.trim() || formatDateTime(event.timestamp)}
      </span>
    </div>
  );
}
