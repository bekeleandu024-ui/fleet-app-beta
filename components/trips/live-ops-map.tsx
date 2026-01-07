"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { APIProvider, Map, Marker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { 
  AlertTriangle, 
  Clock, 
  Crosshair, 
  MapPin, 
  Radio, 
  RefreshCw,
  Satellite,
  Send,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type TruckStatus = "moving" | "stationary" | "hos_violation" | "offline";

export interface GeofencePolygon {
  id: string;
  name: string;
  type: "pickup" | "delivery" | "yard" | "border";
  coordinates: Array<{ lat: number; lng: number }>;
  bufferZone?: Array<{ lat: number; lng: number }>;
}

export interface GpsPing {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
  heading?: number;
}

export interface TruckPosition {
  lat: number;
  lng: number;
  status: TruckStatus;
  speed: number;
  heading: number;
  lastPingTime: string;
  hosRemaining?: number;
  eldConnected: boolean;
}

export interface LiveOpsMapProps {
  tripId: string;
  tripNumber: string;
  driverName?: string;
  powerUnitNumber?: string;
  stops: Array<{
    type: string;
    location: string;
    lat?: number;
    lng?: number;
    sequence: number;
  }>;
  onForcePing?: () => Promise<void>;
  onForceArrive?: (stopId: string) => Promise<void>;
  onSendConfirmPrompt?: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function generateGeofencePolygon(
  center: { lat: number; lng: number },
  radiusMeters: number = 150,
  points: number = 6
): Array<{ lat: number; lng: number }> {
  const coords: Array<{ lat: number; lng: number }> = [];
  const earthRadius = 6371000;
  
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const r = radiusMeters * (0.85 + Math.sin(angle * 3) * 0.15);
    const dLat = (r * Math.cos(angle)) / earthRadius * (180 / Math.PI);
    const dLng = (r * Math.sin(angle)) / (earthRadius * Math.cos(center.lat * Math.PI / 180)) * (180 / Math.PI);
    coords.push({ lat: center.lat + dLat, lng: center.lng + dLng });
  }
  
  return coords;
}

function generateHysteresisZone(
  center: { lat: number; lng: number },
  innerRadius: number = 150,
  bufferMeters: number = 50
): Array<{ lat: number; lng: number }> {
  return generateGeofencePolygon(center, innerRadius + bufferMeters, 8);
}

function getTruckStatusColor(status: TruckStatus): string {
  switch (status) {
    case "moving": return "#22C55E";
    case "stationary": return "#EAB308";
    case "hos_violation": return "#EF4444";
    case "offline": return "#6B7280";
    default: return "#6B7280";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POLYGON & POLYLINE RENDERER (using Google Maps API directly)
// ═══════════════════════════════════════════════════════════════════════════

interface MapOverlaysProps {
  geofences: GeofencePolygon[];
  breadcrumbs: GpsPing[];
  routePath: Array<{ lat: number; lng: number }>;
  showGeofence: boolean;
  showHysteresis: boolean;
  showBreadcrumbs: boolean;
  showRoute: boolean;
}

function MapOverlays({ geofences, breadcrumbs, routePath, showGeofence, showHysteresis, showBreadcrumbs, showRoute }: MapOverlaysProps) {
  const map = useMap();
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing overlays
    polygonsRef.current.forEach(p => p.setMap(null));
    polylinesRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];
    polylinesRef.current = [];

    // Draw hysteresis zones (buffer zones)
    if (showHysteresis) {
      geofences.forEach((fence) => {
        if (fence.bufferZone) {
          const polygon = new google.maps.Polygon({
            paths: fence.bufferZone,
            strokeColor: "#6a5a7a",
            strokeOpacity: 0.4,
            strokeWeight: 1,
            fillColor: "#6a5a7a",
            fillOpacity: 0.1,
            map,
          });
          polygonsRef.current.push(polygon);
        }
      });
    }

    // Draw geofence polygons
    if (showGeofence) {
      geofences.forEach((fence) => {
        // Desaturated enterprise colors
        const color = fence.type === "pickup" ? "#5a7a6b" : "#5a6a8a";
        const polygon = new google.maps.Polygon({
          paths: fence.coordinates,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.2,
          map,
        });
        polygonsRef.current.push(polygon);
      });
    }

    // Draw breadcrumb trail
    if (showBreadcrumbs && breadcrumbs.length > 1) {
      const path = breadcrumbs.map(p => ({ lat: p.lat, lng: p.lng }));
      const polyline = new google.maps.Polyline({
        path,
        strokeColor: "#5a8a8a",
        strokeOpacity: 0.7,
        strokeWeight: 3,
        geodesic: true,
        map,
      });
      polylinesRef.current.push(polyline);
    }

    // Draw planned route
    if (showRoute && routePath.length > 1) {
      const routePolyline = new google.maps.Polyline({
        path: routePath,
        strokeColor: "#5a5a6e",
        strokeOpacity: 0.6,
        strokeWeight: 4,
        geodesic: true,
        icons: [{
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: "#5a5a6e" },
          offset: "50%",
        }],
        map,
      });
      polylinesRef.current.push(routePolyline);
    }

    return () => {
      polygonsRef.current.forEach(p => p.setMap(null));
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [map, geofences, breadcrumbs, routePath, showGeofence, showHysteresis, showBreadcrumbs, showRoute]);

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TELEMATICS OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface TelematicsOverlayProps {
  position: TruckPosition;
  driverName?: string;
  powerUnitNumber?: string;
  onClose: () => void;
  onForcePing: () => void;
  onForceArrive: () => void;
  isForcingPing: boolean;
}

function TelematicsOverlay({ 
  position, 
  driverName, 
  powerUnitNumber,
  onClose, 
  onForcePing,
  onForceArrive,
  isForcingPing,
}: TelematicsOverlayProps) {
  const lastPingAgo = useMemo(() => {
    const pingTime = new Date(position.lastPingTime);
    const now = new Date();
    const diffMs = now.getTime() - pingTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;
    return formatDateTime(position.lastPingTime);
  }, [position.lastPingTime]);
  
  const isStale = useMemo(() => {
    const pingTime = new Date(position.lastPingTime);
    const now = new Date();
    return (now.getTime() - pingTime.getTime()) > 5 * 60000;
  }, [position.lastPingTime]);

  return (
    <div className="bg-[#111114] border border-[#1c1c22] rounded-lg shadow-xl p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1c1c22]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3a3a42]" />
          <span className="text-sm font-semibold text-[#e8e8ed]">
            {powerUnitNumber || "Unit"}
          </span>
        </div>
        <button onClick={onClose} className="text-[#5a5a6e] hover:text-[#e8e8ed]">×</button>
      </div>

      {driverName && (
        <div className="mb-3">
          <p className="text-xs text-[#5a5a6e]">Driver</p>
          <p className="text-sm text-[#e8e8ed] font-medium">{driverName}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-[#5a5a6e]">Current Speed</p>
          <p className="text-lg font-bold text-[#a0a0b0]">{position.speed} mph</p>
        </div>
        <div>
          <p className="text-xs text-[#5a5a6e]">Heading</p>
          <p className="text-lg font-bold text-[#a0a0b0]">{position.heading}°</p>
        </div>
      </div>

      <div className={`p-2 rounded-lg mb-3 ${isStale ? "bg-[#b45353]/10 border border-[#b45353]/30" : "bg-[#1c1c22]"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${isStale ? "text-[#b45353]" : "text-[#5a5a6e]"}`} />
            <span className="text-xs text-[#5a5a6e]">Last Ping</span>
          </div>
          <span className={`text-xs font-medium ${isStale ? "text-[#b45353]" : "text-[#a0a0b0]"}`}>
            {lastPingAgo}
          </span>
        </div>
        {isStale && (
          <p className="text-xs text-[#b45353] mt-1">⚠️ Stale data - consider force ping</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-2">
          <Radio className={`h-3 w-3 ${position.eldConnected ? "text-[#5a7a6b]" : "text-[#b45353]"}`} />
          <span className={position.eldConnected ? "text-[#5a5a6e]" : "text-[#b45353]"}>
            ELD {position.eldConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        {position.hosRemaining !== undefined && (
          <span className={`${position.hosRemaining < 2 ? "text-[#b45353]" : position.hosRemaining < 4 ? "text-[#c97a5a]" : "text-[#a0a0b0]"}`}>
            HOS: {position.hosRemaining}h
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onForcePing}
          disabled={isForcingPing}
          className="flex-1 bg-[#2a2a32] hover:bg-[#3a3a42] text-[#e8e8ed]"
        >
          {isForcingPing ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Satellite className="h-4 w-4 mr-1" />}
          Force Ping
        </Button>
        <Button
          size="sm"
          onClick={onForceArrive}
          variant="subtle"
          className="flex-1 bg-[#b45353] hover:bg-[#c46363] text-white"
        >
          <Crosshair className="h-4 w-4 mr-1" />
          Force Arrive
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MAP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LiveOpsMap({ 
  tripId, 
  tripNumber,
  driverName,
  powerUnitNumber,
  stops,
  onForcePing,
  onForceArrive,
  onSendConfirmPrompt,
}: LiveOpsMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  
  const [truckPosition, setTruckPosition] = useState<TruckPosition | null>(null);
  const [breadcrumbTrail, setBreadcrumbTrail] = useState<GpsPing[]>([]);
  const [geofences, setGeofences] = useState<GeofencePolygon[]>([]);
  const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }>>([]);
  const [tripStatus, setTripStatus] = useState<string>("");
  const [homeBase, setHomeBase] = useState<{ lat: number; lng: number } | null>(null);
  const [showTruckInfo, setShowTruckInfo] = useState(false);
  const [isForcingPing, setIsForcingPing] = useState(false);
  const [isForcing, setIsForcing] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 43.6532, lng: -79.3832 });
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const [showLayers, setShowLayers] = useState({
    geofence: true,
    hysteresis: true,
    breadcrumbs: true,
    route: true,
  });
  
  // Memoize stop markers to prevent re-renders when other state changes
  const stopMarkers = useMemo(() => 
    stops.filter(s => s.lat && s.lng).map((stop, idx) => ({
      key: `stop-${stop.sequence || idx}`,
      position: { lat: stop.lat!, lng: stop.lng! },
      title: `${stop.type}: ${stop.location}`,
    })),
    [stops]
  );

  const fetchTrackingData = useCallback(async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/tracking`);
      if (!response.ok) throw new Error("Failed to fetch tracking data");
      
      const data = await response.json();
      
      if (data.currentPosition) {
        setTruckPosition(data.currentPosition);
        setMapCenter({ lat: data.currentPosition.lat, lng: data.currentPosition.lng });
      }
      
      if (data.breadcrumbs) setBreadcrumbTrail(data.breadcrumbs);
      if (data.geofences) setGeofences(data.geofences);
      if (data.status) setTripStatus(data.status);
      if (data.homeBase) setHomeBase(data.homeBase);
      if (data.routePath) setRoutePath(data.routePath);
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      generateDemoData();
    }
  }, [tripId]);

  const generateDemoData = useCallback(() => {
    const stopWithCoords = stops.find(s => s.lat && s.lng);
    const baseLat = stopWithCoords?.lat || 43.6532;
    const baseLng = stopWithCoords?.lng || -79.3832;
    
    // Demo home base (yard location)
    const demoHomeBase = { lat: baseLat - 0.02, lng: baseLng - 0.025 };
    setHomeBase(demoHomeBase);
    setTripStatus("In Transit");
    
    setTruckPosition({
      lat: baseLat + 0.002,
      lng: baseLng - 0.003,
      status: "moving",
      speed: 45,
      heading: 225,
      lastPingTime: new Date().toISOString(),
      hosRemaining: 7.5,
      eldConnected: true,
    });
    
    const trail: GpsPing[] = [];
    for (let i = 14; i >= 0; i--) {
      trail.push({
        lat: baseLat + 0.002 + (i * 0.0003),
        lng: baseLng - 0.003 - (i * 0.0004),
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        speed: 35 + Math.random() * 20,
      });
    }
    setBreadcrumbTrail(trail);
    
    const fences: GeofencePolygon[] = stops
      .filter(s => s.lat && s.lng)
      .map((stop, idx) => ({
        id: `geofence-${idx}`,
        name: stop.location,
        type: stop.type.toLowerCase() as "pickup" | "delivery",
        coordinates: generateGeofencePolygon({ lat: stop.lat!, lng: stop.lng! }, 100, 6),
        bufferZone: generateHysteresisZone({ lat: stop.lat!, lng: stop.lng! }, 100, 30),
      }));
    
    // Demo delivery location
    const deliveryLat = baseLat + 0.015;
    const deliveryLng = baseLng + 0.02;
    
    if (fences.length === 0) {
      fences.push({
        id: "pickup-demo",
        name: stops[0]?.location || "Pickup Location",
        type: "pickup",
        coordinates: generateGeofencePolygon({ lat: baseLat, lng: baseLng }, 100, 6),
        bufferZone: generateHysteresisZone({ lat: baseLat, lng: baseLng }, 100, 30),
      });
      
      if (stops.length > 1) {
        fences.push({
          id: "delivery-demo",
          name: stops[stops.length - 1]?.location || "Delivery Location",
          type: "delivery",
          coordinates: generateGeofencePolygon({ lat: deliveryLat, lng: deliveryLng }, 100, 6),
          bufferZone: generateHysteresisZone({ lat: deliveryLat, lng: deliveryLng }, 100, 30),
        });
      }
    }
    
    // Generate demo route: home base -> pickup -> delivery
    const demoRoute = [
      demoHomeBase,
      { lat: baseLat, lng: baseLng }, // pickup
      { lat: deliveryLat, lng: deliveryLng }, // delivery
    ];
    setRoutePath(demoRoute);
    
    setGeofences(fences);
    setMapCenter({ lat: baseLat + 0.002, lng: baseLng - 0.003 });
  }, [stops]);

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 15000);
    return () => clearInterval(interval);
  }, [fetchTrackingData]);

  const handleForcePing = async () => {
    setIsForcingPing(true);
    try {
      if (onForcePing) {
        await onForcePing();
      } else {
        await fetch(`/api/trips/${tripId}/force-ping`, { method: "POST" });
      }
      setTimeout(fetchTrackingData, 2000);
    } catch (error) {
      console.error("Force ping failed:", error);
    } finally {
      setIsForcingPing(false);
    }
  };

  const handleForceArrive = async (stopId?: string) => {
    setIsForcing(true);
    try {
      if (onForceArrive && stopId) {
        await onForceArrive(stopId);
      } else {
        await fetch(`/api/trips/${tripId}/force-arrive`, { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stopId: stopId || selectedStop }),
        });
      }
      if (onSendConfirmPrompt) await onSendConfirmPrompt();
    } catch (error) {
      console.error("Force arrive failed:", error);
    } finally {
      setIsForcing(false);
      setShowTruckInfo(false);
    }
  };

  if (!apiKey) {
    return (
      <Card className="border-[#1c1c22] bg-[#111114] p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-[#a0a0b0]" />
          <span className="text-sm font-semibold text-[#e8e8ed]">Live Route Map</span>
        </div>
        <div className="aspect-video bg-[#1c1c22] rounded-lg flex items-center justify-center border border-[#1c1c22]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-[#c97a5a] mx-auto mb-2" />
            <p className="text-[#a0a0b0] font-medium">Map Configuration Required</p>
            <p className="text-xs text-[#5a5a6e] mt-1">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in environment</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-[#1c1c22] bg-[#111114] overflow-hidden">
      {/* Map Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1c1c22]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#2a2a32] border border-[#3a3a42]">
            <MapPin className="h-4 w-4 text-[#a0a0b0]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#e8e8ed]">Live Diagnostic Map</h3>
            <p className="text-xs text-[#5a5a6e]">ISAAC Integration • Real-time Telematics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLayers(l => ({ ...l, geofence: !l.geofence }))}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              showLayers.geofence ? "bg-[#2a2a32] text-[#e8e8ed] border border-[#3a3a42]" : "bg-[#1c1c22] text-[#5a5a6e] border border-[#1c1c22]"
            }`}
          >
            Geofence
          </button>
          <button
            onClick={() => setShowLayers(l => ({ ...l, hysteresis: !l.hysteresis }))}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              showLayers.hysteresis ? "bg-[#2a2a32] text-[#e8e8ed] border border-[#3a3a42]" : "bg-[#1c1c22] text-[#5a5a6e] border border-[#1c1c22]"
            }`}
          >
            Buffer
          </button>
          <button
            onClick={() => setShowLayers(l => ({ ...l, breadcrumbs: !l.breadcrumbs }))}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              showLayers.breadcrumbs ? "bg-[#2a2a32] text-[#e8e8ed] border border-[#3a3a42]" : "bg-[#1c1c22] text-[#5a5a6e] border border-[#1c1c22]"
            }`}
          >
            Trail
          </button>
          <button
            onClick={() => setShowLayers(l => ({ ...l, route: !l.route }))}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              showLayers.route ? "bg-[#2a2a32] text-[#e8e8ed] border border-[#3a3a42]" : "bg-[#1c1c22] text-[#5a5a6e] border border-[#1c1c22]"
            }`}
          >
            Route
          </button>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative h-[400px]">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={mapCenter}
            defaultZoom={14}
            mapId="live-ops-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapTypeId="roadmap"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Custom overlays for polygons and polylines */}
            <MapOverlays
              geofences={geofences}
              breadcrumbs={breadcrumbTrail}
              routePath={routePath}
              showGeofence={showLayers.geofence}
              showHysteresis={showLayers.hysteresis}
              showBreadcrumbs={showLayers.breadcrumbs}
              showRoute={showLayers.route}
            />
            
            {/* Home Base Marker */}
            {homeBase && showLayers.route && (
              <Marker
                position={homeBase}
                title="Home Base / Yard"
              />
            )}
            
            {/* Stop Markers (memoized) */}
            {stopMarkers.map((marker) => (
              <Marker
                key={marker.key}
                position={marker.position}
                title={marker.title}
              />
            ))}
            
            {/* Truck Marker */}
            {truckPosition && (
              <>
                <Marker
                  position={{ lat: truckPosition.lat, lng: truckPosition.lng }}
                  onClick={() => setShowTruckInfo(true)}
                  title={`${powerUnitNumber || "Truck"} - ${truckPosition.speed} mph`}
                />
                
                {showTruckInfo && (
                  <InfoWindow
                    position={{ lat: truckPosition.lat, lng: truckPosition.lng }}
                    onCloseClick={() => setShowTruckInfo(false)}
                  >
                    <TelematicsOverlay
                      position={truckPosition}
                      driverName={driverName}
                      powerUnitNumber={powerUnitNumber}
                      onClose={() => setShowTruckInfo(false)}
                      onForcePing={handleForcePing}
                      onForceArrive={() => handleForceArrive()}
                      isForcingPing={isForcingPing}
                    />
                  </InfoWindow>
                )}
              </>
            )}
          </Map>
        </APIProvider>
        
        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-[#111114]/90 backdrop-blur rounded-lg p-3 border border-[#1c1c22]">
          <p className="text-xs text-[#5a5a6e] font-medium mb-2">Legend</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#5a7a6b] rounded" />
              <span className="text-[#a0a0b0]">Pickup Geofence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#5a6a8a] rounded" />
              <span className="text-[#a0a0b0]">Delivery Geofence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#6a5a7a]/50 rounded" style={{ border: "1px dashed #6a5a7a" }} />
              <span className="text-[#a0a0b0]">Hysteresis Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#5a8a8a] rounded" />
              <span className="text-[#a0a0b0]">GPS Trail (15 min)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#5a5a6e] rounded" />
              <span className="text-[#a0a0b0]">Planned Route</span>
            </div>
          </div>
        </div>
        
        {/* Truck Status Indicator */}
        {truckPosition && (
          <div className="absolute top-4 left-4 bg-[#111114]/90 backdrop-blur rounded-lg p-3 border border-[#1c1c22]">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2a2a32]"
              >
                <Truck className="h-4 w-4 text-[#e8e8ed]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#e8e8ed]">
                  {truckPosition.status === "moving" ? "In Motion" :
                   truckPosition.status === "stationary" ? "Stationary" :
                   truckPosition.status === "hos_violation" ? "HOS Violation" :
                   "Offline"}
                </p>
                <p className="text-xs text-[#a0a0b0]">
                  {truckPosition.speed} mph • {truckPosition.heading}°
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Quick Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            onClick={handleForcePing}
            disabled={isForcingPing}
            className="bg-[#2a2a32] hover:bg-[#3a3a42] text-[#e8e8ed] shadow-lg border border-[#3a3a42]"
          >
            {isForcingPing ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Satellite className="h-4 w-4 mr-1" />}
            Force Ping
          </Button>
          <Button
            size="sm"
            onClick={() => handleForceArrive()}
            disabled={isForcing}
            variant="subtle"
            className="bg-[#b45353] hover:bg-[#c46363] text-white shadow-lg"
          >
            <Crosshair className="h-4 w-4 mr-1" />
            Force Arrive
          </Button>
          {onSendConfirmPrompt && (
            <Button
              size="sm"
              onClick={onSendConfirmPrompt}
              variant="subtle"
              className="bg-[#2a2a32] hover:bg-[#3a3a42] text-[#e8e8ed] shadow-lg border border-[#3a3a42]"
            >
              <Send className="h-4 w-4 mr-1" />
              Send Prompt
            </Button>
          )}
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between p-3 border-t border-[#1c1c22] bg-[#111114]">
        <div className="flex items-center gap-4 text-xs text-[#5a5a6e]">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#5a7a6b]" />
            Live Tracking Active
          </span>
          <span>Trip: {tripNumber}</span>
          {truckPosition && (
            <span>Last Update: {formatDateTime(truckPosition.lastPingTime)}</span>
          )}
        </div>
        <Button
          size="sm"
          variant="subtle"
          onClick={fetchTrackingData}
          className="text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
    </Card>
  );
}
