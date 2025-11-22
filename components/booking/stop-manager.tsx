"use client";

import { Plus, X, GripVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface TripStop {
  id: string;
  stopType: string;
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal: string;
  scheduledAt: string;
  lat?: number;
  lon?: number;
}

interface StopManagerProps {
  stops: TripStop[];
  onStopsChange: (stops: TripStop[]) => void;
  className?: string;
}

export function StopManager({ stops, onStopsChange, className = "" }: StopManagerProps) {
  const addStop = () => {
    const newStop: TripStop = {
      id: `stop-${Date.now()}`,
      stopType: "Other",
      name: "",
      street: "",
      city: "",
      state: "",
      country: "US",
      postal: "",
      scheduledAt: "",
    };
    onStopsChange([...stops, newStop]);
  };

  const removeStop = (id: string) => {
    if (stops.length > 2) {
      // Keep at least pickup and delivery
      onStopsChange(stops.filter((s) => s.id !== id));
    }
  };

  const updateStop = (id: string, field: keyof TripStop, value: any) => {
    onStopsChange(stops.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const moveStop = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === stops.length - 1)
    ) {
      return;
    }

    const newStops = [...stops];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
    onStopsChange(newStops);
  };

  return (
    <Card className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">Trip Stops</h3>
        <Button
          type="button"
          size="sm"
          variant="subtle"
          onClick={addStop}
          className="flex items-center gap-2 text-xs"
        >
          <Plus className="h-3 w-3" />
          Add Stop
        </Button>
      </div>

      <div className="space-y-3">
        {stops.map((stop, idx) => (
          <div
            key={stop.id}
            className="group relative rounded-lg border border-white/10 bg-black/20 p-3 transition-colors hover:border-white/20"
          >
            {/* Header with sequence number and controls */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Drag Handle */}
                <div className="flex flex-col gap-0">
                  <button
                    type="button"
                    onClick={() => moveStop(idx, "up")}
                    disabled={idx === 0}
                    className="cursor-pointer text-neutral-600 hover:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <GripVertical className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStop(idx, "down")}
                    disabled={idx === stops.length - 1}
                    className="cursor-pointer text-neutral-600 hover:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <GripVertical className="h-3 w-3 rotate-180" />
                  </button>
                </div>

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {idx + 1}
                </span>
                <span className="text-xs font-medium text-neutral-400">
                  {idx === 0 ? "First Stop" : idx === stops.length - 1 ? "Final Stop" : `Stop ${idx + 1}`}
                </span>
              </div>

              {stops.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeStop(stop.id)}
                  className="text-rose-400 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Stop Fields */}
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-white/60">Stop Type</label>
                <select
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={stop.stopType}
                  onChange={(e) => updateStop(stop.id, "stopType", e.target.value)}
                >
                  <option value="Pickup">Pickup</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Drop & Hook">Drop & Hook</option>
                  <option value="Border">Border Crossing</option>
                  <option value="Fuel">Fuel Stop</option>
                  <option value="Rest">Rest Break</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-white/60">Location Name</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={stop.name}
                  onChange={(e) => updateStop(stop.id, "name", e.target.value)}
                  placeholder="e.g., ACME Warehouse"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-white/60">Street Address</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={stop.street}
                  onChange={(e) => updateStop(stop.id, "street", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-white/60">City</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={stop.city}
                  onChange={(e) => updateStop(stop.id, "city", e.target.value)}
                  placeholder="Chicago"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-white/60">State/Province</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={stop.state}
                  onChange={(e) => updateStop(stop.id, "state", e.target.value)}
                  placeholder="IL"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-white/60">Postal Code</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={stop.postal}
                  onChange={(e) => updateStop(stop.id, "postal", e.target.value)}
                  placeholder="60601"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-white/60">
                  <Clock className="h-3 w-3" />
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  value={stop.scheduledAt ? new Date(stop.scheduledAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) => updateStop(stop.id, "scheduledAt", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {stops.length < 2 && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          At least 2 stops (pickup and delivery) are required
        </div>
      )}
    </Card>
  );
}

