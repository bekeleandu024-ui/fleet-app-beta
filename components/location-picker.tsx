"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationPickerProps {
  value?: { lat: number; lon: number; address?: string };
  onChange: (location: { lat: number; lon: number; address?: string }) => void;
  label?: string;
  placeholder?: string;
  showGPSButton?: boolean;
  className?: string;
}

export function LocationPicker({
  value,
  onChange,
  label = "Location",
  placeholder = "Enter address or coordinates",
  showGPSButton = true,
  className,
}: LocationPickerProps) {
  const [address, setAddress] = useState(value?.address || "");
  const [coordinates, setCoordinates] = useState(
    value ? `${value.lat}, ${value.lon}` : ""
  );
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setIsCapturingGPS(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        setCoordinates(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
        onChange({ lat, lon, address: address || `GPS: ${lat.toFixed(6)}, ${lon.toFixed(6)}` });
        setIsCapturingGPS(false);
      },
      (error) => {
        setGpsError(error.message);
        setIsCapturingGPS(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCoordinatesChange = (value: string) => {
    setCoordinates(value);
    
    // Try to parse coordinates (format: "lat, lon" or "lat,lon")
    const parts = value.split(',').map(s => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        onChange({ lat, lon, address });
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-300">{label}</label>
      )}

      {/* Address Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <Input
          type="text"
          placeholder={placeholder}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (value) {
              onChange({ ...value, address: e.target.value });
            }
          }}
          className="pl-10"
        />
      </div>

      {/* Coordinates Input */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Latitude, Longitude"
          value={coordinates}
          onChange={(e) => handleCoordinatesChange(e.target.value)}
          className="flex-1"
        />
        
        {showGPSButton && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCaptureGPS}
            disabled={isCapturingGPS}
            className="px-3"
          >
            <Navigation className={cn(
              "h-4 w-4",
              isCapturingGPS && "animate-pulse"
            )} />
          </Button>
        )}
      </div>

      {/* GPS Error */}
      {gpsError && (
        <p className="text-xs text-red-400">{gpsError}</p>
      )}

      {/* Coordinates Display */}
      {value && (
        <p className="text-xs text-neutral-500">
          📍 {value.lat.toFixed(6)}, {value.lon.toFixed(6)}
        </p>
      )}
    </div>
  );
}

// Simple coordinate input variant
interface CoordinateInputProps {
  lat?: number;
  lon?: number;
  onChange: (lat: number, lon: number) => void;
  className?: string;
}

export function CoordinateInput({ lat, lon, onChange, className }: CoordinateInputProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <div>
        <label className="text-xs text-neutral-500 mb-1 block">Latitude</label>
        <Input
          type="number"
          step="0.000001"
          placeholder="43.653226"
          value={lat || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0, lon || 0)}
        />
      </div>
      <div>
        <label className="text-xs text-neutral-500 mb-1 block">Longitude</label>
        <Input
          type="number"
          step="0.000001"
          placeholder="-79.383184"
          value={lon || ""}
          onChange={(e) => onChange(lat || 0, parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

