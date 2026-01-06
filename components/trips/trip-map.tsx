"use client";

import { useEffect, useState, useMemo } from "react";
import {
  MapPin,
  Navigation,
  Truck,
  Clock,
  Loader2,
  AlertCircle,
  Route,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TripMapProps {
  tripId: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  currentLat?: number;
  currentLng?: number;
  lastPingAt?: string;
  distanceMiles?: number;
  status?: string;
  className?: string;
}

interface LocationPoint {
  lat: number;
  lng: number;
  label: string;
  type: "pickup" | "dropoff" | "current";
}

export function TripMap({
  tripId,
  pickupLocation,
  dropoffLocation,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  currentLat,
  currentLng,
  lastPingAt,
  distanceMiles,
  status,
  className,
}: TripMapProps) {
  const [eta, setEta] = useState<string | null>(null);
  const [remainingMiles, setRemainingMiles] = useState<number | null>(null);

  // Calculate points for display
  const points = useMemo(() => {
    const pts: LocationPoint[] = [];

    if (pickupLat && pickupLng) {
      pts.push({
        lat: pickupLat,
        lng: pickupLng,
        label: pickupLocation || "Pickup",
        type: "pickup",
      });
    }

    if (dropoffLat && dropoffLng) {
      pts.push({
        lat: dropoffLat,
        lng: dropoffLng,
        label: dropoffLocation || "Dropoff",
        type: "dropoff",
      });
    }

    if (currentLat && currentLng) {
      pts.push({
        lat: currentLat,
        lng: currentLng,
        label: "Current Position",
        type: "current",
      });
    }

    return pts;
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng, currentLat, currentLng, pickupLocation, dropoffLocation]);

  // Calculate ETA based on remaining distance and average speed
  useEffect(() => {
    if (currentLat && currentLng && dropoffLat && dropoffLng) {
      // Simple haversine distance calculation for remaining
      const R = 3959; // Earth radius in miles
      const dLat = ((dropoffLat - currentLat) * Math.PI) / 180;
      const dLon = ((dropoffLng - currentLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((currentLat * Math.PI) / 180) *
          Math.cos((dropoffLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const remaining = R * c;

      setRemainingMiles(Math.round(remaining));

      // Assume average speed of 55 mph for trucks
      const avgSpeed = 55;
      const hoursRemaining = remaining / avgSpeed;
      const minutesRemaining = Math.round(hoursRemaining * 60);

      if (minutesRemaining < 60) {
        setEta(`${minutesRemaining} min`);
      } else {
        const hours = Math.floor(minutesRemaining / 60);
        const mins = minutesRemaining % 60;
        setEta(`${hours}h ${mins}m`);
      }
    } else {
      setRemainingMiles(null);
      setEta(null);
    }
  }, [currentLat, currentLng, dropoffLat, dropoffLng]);

  const hasCoordinates = points.length > 0;
  const hasLivePosition = currentLat && currentLng;
  const isInTransit = status?.toLowerCase().includes("transit") || status?.toLowerCase().includes("en route");

  // Generate static map URL (using OpenStreetMap or placeholder)
  const getStaticMapUrl = () => {
    if (!hasCoordinates) return null;

    // Create bounds for the map
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Use OpenStreetMap static image service (free)
    const zoom = 6; // Approximate zoom for typical trip distances
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng - 1},${minLat - 1},${maxLng + 1},${maxLat + 1}&layer=mapnik&marker=${centerLat},${centerLng}`;
  };

  return (
    <Card className={cn("border-neutral-800/70 bg-neutral-900/60", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Route className="h-4 w-4 text-blue-400" />
            Trip Route
          </CardTitle>
          {hasLivePosition && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Tracking
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Map Container */}
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-neutral-800/50 mb-3">
          {hasCoordinates ? (
            <>
              {/* Static Map Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900">
                {/* Simplified route visualization */}
                <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines for map feel */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="rgba(100,100,100,0.1)"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Route line */}
                  {points.length >= 2 && (
                    <path
                      d={`M 30 90 Q 100 30 170 90`}
                      fill="none"
                      stroke="rgba(147, 51, 234, 0.5)"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                    />
                  )}

                  {/* Pickup marker */}
                  {points.find((p) => p.type === "pickup") && (
                    <g transform="translate(30, 90)">
                      <circle r="8" fill="#22c55e" opacity="0.3" />
                      <circle r="5" fill="#22c55e" />
                      <text
                        x="12"
                        y="4"
                        className="text-[8px] fill-neutral-400"
                      >
                        P
                      </text>
                    </g>
                  )}

                  {/* Current position marker */}
                  {hasLivePosition && (
                    <g transform="translate(100, 60)">
                      <circle r="10" fill="#3b82f6" opacity="0.3">
                        <animate
                          attributeName="r"
                          values="10;15;10"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.3;0.1;0.3"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle r="6" fill="#3b82f6" />
                      <path
                        d="M 0 -4 L 3 4 L 0 2 L -3 4 Z"
                        fill="white"
                        transform="rotate(45)"
                      />
                    </g>
                  )}

                  {/* Dropoff marker */}
                  {points.find((p) => p.type === "dropoff") && (
                    <g transform="translate(170, 90)">
                      <circle r="8" fill="#ef4444" opacity="0.3" />
                      <circle r="5" fill="#ef4444" />
                      <text
                        x="12"
                        y="4"
                        className="text-[8px] fill-neutral-400"
                      >
                        D
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Overlay info */}
              {eta && (
                <div className="absolute top-2 right-2 bg-neutral-900/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-neutral-700">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3 w-3 text-blue-400" />
                    <span className="text-neutral-200 font-medium">ETA: {eta}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <MapPin className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs">No location data available</p>
            </div>
          )}
        </div>

        {/* Location Details */}
        <div className="space-y-2">
          {/* Pickup */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-neutral-800/30">
            <div className="p-1 rounded-full bg-emerald-500/20">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500">Pickup</p>
              <p className="text-sm text-neutral-200 truncate">
                {pickupLocation || "Location pending"}
              </p>
            </div>
          </div>

          {/* Current Position (if live) */}
          {hasLivePosition && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="p-1 rounded-full bg-blue-500/20">
                <Truck className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-400">Current Position</p>
                  {lastPingAt && (
                    <p className="text-xs text-neutral-500">
                      {new Date(lastPingAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <p className="text-sm text-neutral-200">
                  {remainingMiles ? `${remainingMiles} mi remaining` : "In transit"}
                </p>
              </div>
            </div>
          )}

          {/* Dropoff */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-neutral-800/30">
            <div className="p-1 rounded-full bg-red-500/20">
              <Navigation className="h-3.5 w-3.5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-500">Dropoff</p>
              <p className="text-sm text-neutral-200 truncate">
                {dropoffLocation || "Location pending"}
              </p>
            </div>
          </div>
        </div>

        {/* Distance Summary */}
        {distanceMiles && (
          <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-500">Total Distance</span>
            <span className="text-neutral-200 font-medium">{Math.round(distanceMiles)} miles</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
