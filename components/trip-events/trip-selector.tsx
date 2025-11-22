"use client";

import { MapPin, User, Truck, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

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

interface TripSelectorProps {
  trips: Trip[];
  selectedTripId: string;
  onTripSelect: (tripId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function TripSelector({
  trips,
  selectedTripId,
  onTripSelect,
  isLoading = false,
  className = "",
}: TripSelectorProps) {
  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
      case "active":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "created":
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "at risk":
      case "delayed":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    }
  };

  return (
    <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <div className="mb-3">
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          Select Active Trip
        </label>
        <select
          className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          value={selectedTripId}
          onChange={(e) => onTripSelect(e.target.value)}
          disabled={isLoading || trips.length === 0}
        >
          <option value="">Choose a trip...</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id}>
              {trip.tripNumber} | {trip.driver} | {trip.unit} | {trip.status}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Trip Details */}
      {selectedTrip ? (
        <div className="space-y-3 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">Trip #{selectedTrip.tripNumber}</h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                selectedTrip.status
              )}`}
            >
              {selectedTrip.status}
            </span>
          </div>

          <div className="grid gap-2 text-xs">
            <div className="flex items-center gap-2 text-neutral-400">
              <User className="h-3 w-3" />
              <span className="font-medium text-neutral-300">{selectedTrip.driver}</span>
            </div>

            <div className="flex items-center gap-2 text-neutral-400">
              <Truck className="h-3 w-3" />
              <span className="font-medium text-neutral-300">{selectedTrip.unit}</span>
            </div>

            <div className="flex items-center gap-2 text-neutral-400">
              <MapPin className="h-3 w-3" />
              <span className="text-neutral-300">
                {selectedTrip.pickup} → {selectedTrip.delivery}
              </span>
            </div>

            {selectedTrip.eta && (
              <div className="flex items-center gap-2 text-neutral-400">
                <Clock className="h-3 w-3" />
                <span className="text-neutral-300">ETA: {selectedTrip.eta}</span>
              </div>
            )}

            {selectedTrip.lastPing && (
              <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] text-blue-400">
                Last update: {new Date(selectedTrip.lastPing).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 pt-3 text-center text-xs text-neutral-500">
          {trips.length === 0 ? "No active trips available" : "Select a trip to view details"}
        </div>
      )}
    </Card>
  );
}

