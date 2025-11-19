"use client";

import { useState, useEffect } from "react";
import { MapPin, Crosshair, Loader2, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GPSCaptureProps {
  onLocationCapture: (location: { lat: number; lon: number; address?: string }) => void;
  className?: string;
}

export function GPSCapture({ onLocationCapture, className = "" }: GPSCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState<{
    lat: number;
    lon: number;
    address?: string;
  } | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [error, setError] = useState<string | null>(null);

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsCapturing(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          address: undefined,
        };
        setCapturedLocation(location);
        onLocationCapture(location);
        setIsCapturing(false);
      },
      (err) => {
        setError(err.message || "Failed to get location");
        setIsCapturing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleManualEntry = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      setError("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90");
      return;
    }

    if (lon < -180 || lon > 180) {
      setError("Longitude must be between -180 and 180");
      return;
    }

    const location = { lat, lon, address: undefined };
    setCapturedLocation(location);
    onLocationCapture(location);
    setError(null);
  };

  return (
    <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-neutral-200">GPS Location</h3>
      </div>

      {/* Auto Capture */}
      <div className="mb-4">
        <Button
          type="button"
          onClick={captureGPS}
          disabled={isCapturing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500/20 px-4 py-3 text-sm font-medium text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
        >
          {isCapturing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Capturing Location...
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4" />
              Capture Current GPS
            </>
          )}
        </Button>
      </div>

      {/* Captured Location Display */}
      {capturedLocation && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
            <div className="flex-1 text-xs">
              <p className="font-medium text-emerald-300">Location Captured</p>
              <p className="mt-1 font-mono text-emerald-400">
                {capturedLocation.lat.toFixed(6)}, {capturedLocation.lon.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-rose-400" />
            <p className="flex-1 text-xs text-rose-300">{error}</p>
          </div>
        </div>
      )}

      {/* Manual Entry */}
      <div className="border-t border-white/10 pt-4">
        <p className="mb-2 text-xs font-medium text-neutral-400">Or enter manually</p>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="43.6532"
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="-79.3832"
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              value={manualLon}
              onChange={(e) => setManualLon(e.target.value)}
            />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleManualEntry}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-xs text-neutral-300 hover:bg-black/30"
        >
          Set Manual Location
        </Button>
      </div>
    </Card>
  );
}
