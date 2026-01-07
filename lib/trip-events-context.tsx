"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES - Shared Event System
// ═══════════════════════════════════════════════════════════════════════════

export type TripEventType = 
  | "ARRIVED_PICKUP"
  | "LOADED_DEPART"
  | "ARRIVED_DELIVERY"
  | "UNLOADED_COMPLETE"
  | "EN_ROUTE"
  | "DELAY"
  | "BREAK"
  | "CUSTOM";

export type EventSource = 
  | "DRIVER_VOICE"      // Driver used voice command
  | "DRIVER_MANUAL"     // Driver tapped button
  | "GEOFENCE_DISPATCH" // Dispatcher triggered via geofence override
  | "GPS_AUTO"          // Automatic GPS detection
  | "SYSTEM";           // System-generated

export type EventStatus = 
  | "PENDING_CONFIRMATION" // Waiting for driver to confirm
  | "CONFIRMED"            // Driver confirmed
  | "IGNORED"              // Driver ignored/dismissed
  | "AUTO_CONFIRMED"       // Auto-confirmed after timeout
  | "COMPLETED";           // Event fully processed

export interface TripEvent {
  id: string;
  tripId: string;
  tripNumber?: string;
  eventType: TripEventType;
  eventLabel: string;
  location: string;
  coordinates?: { lat: number; lon: number };
  timestamp: string;
  source: EventSource;
  status: EventStatus;
  actor: string;
  actorType: "DRIVER" | "DISPATCHER" | "SYSTEM";
  notes?: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface PendingGeofenceTrigger {
  id: string;
  tripId: string;
  tripNumber: string;
  eventType: TripEventType;
  eventLabel: string;
  location: string;
  triggeredBy: string;
  triggeredAt: string;
  expiresAt: string;
}

// Trip lifecycle stages for the stepper
export const TRIP_LIFECYCLE_STAGES = [
  { eventType: "ARRIVED_PICKUP" as TripEventType, label: "Arrived at Pickup", buttonLabel: "Force 'Arrived Pickup' Trigger" },
  { eventType: "LOADED_DEPART" as TripEventType, label: "Loaded & Departed", buttonLabel: "Force 'Loaded/Depart' Trigger" },
  { eventType: "ARRIVED_DELIVERY" as TripEventType, label: "Arrived at Delivery", buttonLabel: "Force 'Arrived Delivery' Trigger" },
  { eventType: "UNLOADED_COMPLETE" as TripEventType, label: "Unloaded & Complete", buttonLabel: "Force 'Unloaded/Complete' Trigger" },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface TripEventsContextValue {
  // Connection state
  isConnected: boolean;
  connectionId: string | null;
  
  // Events
  events: TripEvent[];
  pendingTrigger: PendingGeofenceTrigger | null;
  
  // Current trip stage (for stepper)
  currentStageIndex: number;
  completedStages: TripEventType[];
  
  // Actions - Dispatcher
  triggerGeofenceEvent: (tripId: string, tripNumber: string, eventType: TripEventType, location: string) => void;
  cancelPendingTrigger: () => void;
  
  // Actions - Driver
  confirmEvent: (eventId: string) => void;
  ignoreEvent: (eventId: string) => void;
  logVoiceEvent: (tripId: string, eventType: TripEventType, location: string, transcript?: string) => void;
  
  // Subscribe to specific trip
  subscribeTripEvents: (tripId: string) => void;
  unsubscribeTripEvents: () => void;
  
  // Check if event can still be triggered (not already completed)
  canTriggerEvent: (eventType: TripEventType) => boolean;
}

const TripEventsContext = createContext<TripEventsContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER - Simulated WebSocket (for demo)
// ═══════════════════════════════════════════════════════════════════════════

export function TripEventsProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [pendingTrigger, setPendingTrigger] = useState<PendingGeofenceTrigger | null>(null);
  const [completedStages, setCompletedStages] = useState<TripEventType[]>([]);
  const [subscribedTripId, setSubscribedTripId] = useState<string | null>(null);
  
  const broadcastChannel = useRef<BroadcastChannel | null>(null);
  
  // Current stage index based on completed stages
  const currentStageIndex = TRIP_LIFECYCLE_STAGES.findIndex(
    stage => !completedStages.includes(stage.eventType)
  );

  // Initialize BroadcastChannel for cross-tab communication (simulates WebSocket)
  useEffect(() => {
    // Use BroadcastChannel API to sync between tabs (simulates WebSocket)
    broadcastChannel.current = new BroadcastChannel("trip-events-sync");
    
    const connId = `conn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setConnectionId(connId);
    setIsConnected(true);
    
    // Listen for messages from other tabs
    broadcastChannel.current.onmessage = (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case "GEOFENCE_TRIGGER":
          // Only show to driver tabs
          if (payload.tripId === subscribedTripId || !subscribedTripId) {
            setPendingTrigger(payload);
          }
          break;
          
        case "EVENT_CONFIRMED":
        case "EVENT_LOGGED":
          // Add to events list
          setEvents(prev => [payload, ...prev]);
          // Mark stage as completed
          if (payload.status === "CONFIRMED" || payload.status === "COMPLETED") {
            setCompletedStages(prev => 
              prev.includes(payload.eventType) ? prev : [...prev, payload.eventType]
            );
          }
          // Clear pending trigger if it was confirmed
          setPendingTrigger(prev => 
            prev?.id === payload.id || prev?.eventType === payload.eventType ? null : prev
          );
          break;
          
        case "EVENT_IGNORED":
          // Clear the pending trigger
          setPendingTrigger(prev => prev?.id === payload.id ? null : prev);
          break;
          
        case "TRIGGER_CANCELLED":
          setPendingTrigger(prev => prev?.id === payload.id ? null : prev);
          break;
      }
    };
    
    return () => {
      broadcastChannel.current?.close();
    };
  }, [subscribedTripId]);

  // Load existing events for subscribed trip
  useEffect(() => {
    if (subscribedTripId) {
      fetch(`/api/trip-events?tripId=${subscribedTripId}`)
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            setEvents(data.events);
            // Determine completed stages from existing events
            const completed = data.events
              .filter((e: TripEvent) => e.status === "CONFIRMED" || e.status === "COMPLETED")
              .map((e: TripEvent) => e.eventType);
            setCompletedStages([...new Set(completed)] as TripEventType[]);
          }
        })
        .catch(err => console.error("Failed to load events:", err));
    }
  }, [subscribedTripId]);

  // ─────────────────────────────────────────────────────────────────────────
  // DISPATCHER ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const triggerGeofenceEvent = useCallback((
    tripId: string, 
    tripNumber: string, 
    eventType: TripEventType, 
    location: string
  ) => {
    const trigger: PendingGeofenceTrigger = {
      id: `trigger-${Date.now()}`,
      tripId,
      tripNumber,
      eventType,
      eventLabel: TRIP_LIFECYCLE_STAGES.find(s => s.eventType === eventType)?.label || eventType,
      location,
      triggeredBy: "Dispatcher",
      triggeredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
    };
    
    // Broadcast to all tabs (driver app will see this)
    broadcastChannel.current?.postMessage({
      type: "GEOFENCE_TRIGGER",
      payload: trigger,
    });
    
    // Also set locally for dispatcher feedback
    setPendingTrigger(trigger);
  }, []);

  const cancelPendingTrigger = useCallback(() => {
    if (pendingTrigger) {
      broadcastChannel.current?.postMessage({
        type: "TRIGGER_CANCELLED",
        payload: { id: pendingTrigger.id },
      });
      setPendingTrigger(null);
    }
  }, [pendingTrigger]);

  // ─────────────────────────────────────────────────────────────────────────
  // DRIVER ACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const confirmEvent = useCallback(async (eventId: string) => {
    if (!pendingTrigger) return;
    
    const confirmedEvent: TripEvent = {
      id: eventId,
      tripId: pendingTrigger.tripId,
      tripNumber: pendingTrigger.tripNumber,
      eventType: pendingTrigger.eventType,
      eventLabel: pendingTrigger.eventLabel,
      location: pendingTrigger.location,
      timestamp: pendingTrigger.triggeredAt,
      source: "GEOFENCE_DISPATCH",
      status: "CONFIRMED",
      actor: "Driver",
      actorType: "DRIVER",
      confirmedAt: new Date().toISOString(),
      confirmedBy: "Driver",
    };
    
    // Persist to backend
    try {
      await fetch("/api/trip-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: confirmedEvent.tripId,
          eventType: confirmedEvent.eventType,
          eventLabel: confirmedEvent.eventLabel,
          location: confirmedEvent.location,
          notes: `Confirmed by driver. Source: Geofence/Dispatch (Verified)`,
          actor: "Driver",
          actorType: "DRIVER",
          source: "GEOFENCE_DISPATCH",
        }),
      });
    } catch (err) {
      console.error("Failed to persist event:", err);
    }
    
    // Broadcast confirmation
    broadcastChannel.current?.postMessage({
      type: "EVENT_CONFIRMED",
      payload: confirmedEvent,
    });
    
    // Update local state
    setEvents(prev => [confirmedEvent, ...prev]);
    setCompletedStages(prev => 
      prev.includes(confirmedEvent.eventType) ? prev : [...prev, confirmedEvent.eventType]
    );
    setPendingTrigger(null);
  }, [pendingTrigger]);

  const ignoreEvent = useCallback((eventId: string) => {
    broadcastChannel.current?.postMessage({
      type: "EVENT_IGNORED",
      payload: { id: eventId },
    });
    setPendingTrigger(null);
  }, []);

  const logVoiceEvent = useCallback(async (
    tripId: string, 
    eventType: TripEventType, 
    location: string,
    transcript?: string
  ) => {
    const voiceEvent: TripEvent = {
      id: `voice-${Date.now()}`,
      tripId,
      eventType,
      eventLabel: TRIP_LIFECYCLE_STAGES.find(s => s.eventType === eventType)?.label || eventType,
      location,
      timestamp: new Date().toISOString(),
      source: "DRIVER_VOICE",
      status: "COMPLETED",
      actor: "Driver",
      actorType: "DRIVER",
      notes: transcript ? `Voice command: "${transcript}". Source: Driver Voice (Manual)` : "Source: Driver Voice (Manual)",
    };
    
    // Persist to backend
    try {
      await fetch("/api/trip-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: voiceEvent.tripId,
          eventType: voiceEvent.eventType,
          eventLabel: voiceEvent.eventLabel,
          location: voiceEvent.location,
          notes: voiceEvent.notes,
          actor: "Driver",
          actorType: "DRIVER",
          source: "DRIVER_VOICE",
        }),
      });
    } catch (err) {
      console.error("Failed to persist voice event:", err);
    }
    
    // Broadcast to all tabs
    broadcastChannel.current?.postMessage({
      type: "EVENT_LOGGED",
      payload: voiceEvent,
    });
    
    // Update local state
    setEvents(prev => [voiceEvent, ...prev]);
    setCompletedStages(prev => 
      prev.includes(voiceEvent.eventType) ? prev : [...prev, voiceEvent.eventType]
    );
    // Clear any pending trigger for this event type (prevents duplicates)
    setPendingTrigger(prev => 
      prev?.eventType === eventType ? null : prev
    );
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────────────
  
  const subscribeTripEvents = useCallback((tripId: string) => {
    setSubscribedTripId(tripId);
    setEvents([]);
    setCompletedStages([]);
    setPendingTrigger(null);
  }, []);

  const unsubscribeTripEvents = useCallback(() => {
    setSubscribedTripId(null);
    setEvents([]);
    setCompletedStages([]);
    setPendingTrigger(null);
  }, []);

  const canTriggerEvent = useCallback((eventType: TripEventType) => {
    return !completedStages.includes(eventType);
  }, [completedStages]);

  return (
    <TripEventsContext.Provider
      value={{
        isConnected,
        connectionId,
        events,
        pendingTrigger,
        currentStageIndex,
        completedStages,
        triggerGeofenceEvent,
        cancelPendingTrigger,
        confirmEvent,
        ignoreEvent,
        logVoiceEvent,
        subscribeTripEvents,
        unsubscribeTripEvents,
        canTriggerEvent,
      }}
    >
      {children}
    </TripEventsContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useTripEvents() {
  const context = useContext(TripEventsContext);
  if (!context) {
    throw new Error("useTripEvents must be used within a TripEventsProvider");
  }
  return context;
}
