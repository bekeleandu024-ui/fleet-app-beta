"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

interface TripUpdate {
  tripId: string;
  field: string;
  value: unknown;
  updatedBy: string;
  source: "driver" | "dispatcher" | "system";
}

interface OrderUpdate {
  orderId: string;
  field: string;
  value: unknown;
  updatedBy: string;
  source: "customer" | "dispatcher" | "system";
}

interface StopUpdate {
  tripId: string;
  stopId: string;
  status: string;
  completedAt?: string;
  location?: { lat: number; lng: number };
  updatedBy: string;
}

interface UseRealtimeUpdatesOptions {
  /** WebSocket URL - defaults to /api/ws */
  url?: string;
  /** Enable/disable WebSocket connection (defaults to false until WS server is available) */
  enabled?: boolean;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect interval in ms */
  reconnectInterval?: number;
  /** Max reconnect attempts */
  maxReconnectAttempts?: number;
  /** Callback when trip is updated */
  onTripUpdate?: (update: TripUpdate) => void;
  /** Callback when order is updated */
  onOrderUpdate?: (update: OrderUpdate) => void;
  /** Callback when stop status changes */
  onStopUpdate?: (update: StopUpdate) => void;
  /** Callback for any message */
  onMessage?: (message: WebSocketMessage) => void;
  /** Callback on connection status change */
  onStatusChange?: (status: WebSocketStatus) => void;
}

/**
 * Hook for real-time WebSocket updates
 * 
 * When a driver updates a stop on mobile, the right panel updates instantly.
 * Implements Option 2 (Robust/Recommended) for syncing.
 * 
 * NOTE: Set enabled=true once WebSocket server is available at /api/ws
 */
export function useRealtimeUpdates({
  url = typeof window !== "undefined" ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws` : "",
  enabled = false, // Disabled by default until WS server is set up
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 3, // Reduced to avoid spam
  onTripUpdate,
  onOrderUpdate,
  onStopUpdate,
  onMessage,
  onStatusChange,
}: UseRealtimeUpdatesOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const updateStatus = useCallback((newStatus: WebSocketStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const connect = useCallback(() => {
    // Skip connection if disabled or not in browser
    if (!enabled || typeof window === "undefined") return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    updateStatus("connecting");

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("[WS] Connected to real-time updates");
        reconnectAttemptsRef.current = 0;
        updateStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);

          // Route to specific handlers based on message type
          switch (message.type) {
            case "trip:update":
              onTripUpdate?.(message.payload as TripUpdate);
              break;
            case "order:update":
              onOrderUpdate?.(message.payload as OrderUpdate);
              break;
            case "stop:update":
              onStopUpdate?.(message.payload as StopUpdate);
              break;
            case "ping":
              // Respond to keep-alive ping
              ws.send(JSON.stringify({ type: "pong" }));
              break;
          }
        } catch (err) {
          console.error("[WS] Failed to parse message:", err);
        }
      };

      ws.onerror = () => {
        // Silently handle - WebSocket server may not be available yet
        // Only log on first attempt to avoid console spam
        if (reconnectAttemptsRef.current === 0) {
          console.warn("[WS] Connection failed - WebSocket server not available. Real-time updates disabled.");
        }
        updateStatus("error");
      };

      ws.onclose = () => {
        updateStatus("disconnected");

        // Auto-reconnect logic with reduced attempts
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch {
      // Silently fail - WS server not available
      updateStatus("disconnected");
    }
  }, [url, enabled, autoReconnect, reconnectInterval, maxReconnectAttempts, updateStatus, onMessage, onTripUpdate, onOrderUpdate, onStopUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    updateStatus("disconnected");
  }, [updateStatus]);

  const send = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  // Subscribe to specific trip updates
  const subscribeTripUpdates = useCallback((tripId: string) => {
    send("subscribe:trip", { tripId });
  }, [send]);

  // Subscribe to specific order updates
  const subscribeOrderUpdates = useCallback((orderId: string) => {
    send("subscribe:order", { orderId });
  }, [send]);

  // Unsubscribe from trip updates
  const unsubscribeTripUpdates = useCallback((tripId: string) => {
    send("unsubscribe:trip", { tripId });
  }, [send]);

  // Unsubscribe from order updates
  const unsubscribeOrderUpdates = useCallback((orderId: string) => {
    send("unsubscribe:order", { orderId });
  }, [send]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    status,
    isConnected: status === "connected",
    lastMessage,
    connect,
    disconnect,
    send,
    subscribeTripUpdates,
    subscribeOrderUpdates,
    unsubscribeTripUpdates,
    unsubscribeOrderUpdates,
  };
}

/**
 * Hook for subscribing to specific trip updates
 * 
 * Usage:
 * const { data, isStale } = useTripRealtimeUpdates(tripId, initialData);
 */
export function useTripRealtimeUpdates<T extends { id: string }>(
  tripId: string | null,
  initialData: T | null,
  onUpdate?: (data: T) => void
) {
  const [data, setData] = useState<T | null>(initialData);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdateSource, setLastUpdateSource] = useState<string | null>(null);

  const handleTripUpdate = useCallback((update: TripUpdate) => {
    if (update.tripId !== tripId) return;

    setData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [update.field]: update.value } as T;
      onUpdate?.(updated);
      return updated;
    });
    setIsStale(false);
    setLastUpdateSource(update.source);
  }, [tripId, onUpdate]);

  const handleStopUpdate = useCallback((update: StopUpdate) => {
    if (update.tripId !== tripId) return;
    // Mark data as potentially stale - consumer should refetch
    setIsStale(true);
    setLastUpdateSource("driver");
  }, [tripId]);

  const { subscribeTripUpdates, unsubscribeTripUpdates, isConnected } = useRealtimeUpdates({
    enabled: false, // Enable when WebSocket server is set up
    onTripUpdate: handleTripUpdate,
    onStopUpdate: handleStopUpdate,
  });

  // Subscribe to trip when tripId changes
  useEffect(() => {
    if (tripId && isConnected) {
      subscribeTripUpdates(tripId);
      return () => unsubscribeTripUpdates(tripId);
    }
  }, [tripId, isConnected, subscribeTripUpdates, unsubscribeTripUpdates]);

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
    setIsStale(false);
  }, [initialData]);

  return {
    data,
    isStale,
    lastUpdateSource,
    isConnected,
    markFresh: () => setIsStale(false),
  };
}

/**
 * Hook for subscribing to specific order updates
 */
export function useOrderRealtimeUpdates<T extends { id: string }>(
  orderId: string | null,
  initialData: T | null,
  onUpdate?: (data: T) => void
) {
  const [data, setData] = useState<T | null>(initialData);
  const [isStale, setIsStale] = useState(false);

  const handleOrderUpdate = useCallback((update: OrderUpdate) => {
    if (update.orderId !== orderId) return;

    setData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [update.field]: update.value } as T;
      onUpdate?.(updated);
      return updated;
    });
    setIsStale(false);
  }, [orderId, onUpdate]);

  const { subscribeOrderUpdates, unsubscribeOrderUpdates, isConnected } = useRealtimeUpdates({
    enabled: false, // Enable when WebSocket server is set up
    onOrderUpdate: handleOrderUpdate,
  });

  // Subscribe to order when orderId changes
  useEffect(() => {
    if (orderId && isConnected) {
      subscribeOrderUpdates(orderId);
      return () => unsubscribeOrderUpdates(orderId);
    }
  }, [orderId, isConnected, subscribeOrderUpdates, unsubscribeOrderUpdates]);

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
    setIsStale(false);
  }, [initialData]);

  return {
    data,
    isStale,
    isConnected,
    markFresh: () => setIsStale(false),
  };
}
