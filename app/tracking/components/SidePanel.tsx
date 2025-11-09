"use client";

import { ActiveTrip, TripStatus } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SidePanelProps {
  filteredTrips: ActiveTrip[];
  selectedTrip: ActiveTrip | null;
  onSelectTrip: (tripId: string) => void;
  filter: TripStatus | "all";
  onFilterChange: (value: TripStatus | "all") => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const FILTERS: Array<{ label: string; value: SidePanelProps["filter"] }> = [
  { label: "All", value: "all" },
  { label: "On-Time", value: "on-time" },
  { label: "At-Risk", value: "at-risk" },
  { label: "Delayed", value: "delayed" },
];

const STATUS_INDICATOR: Record<TripStatus, string> = {
  "on-time": "bg-emerald-400",
  "at-risk": "bg-amber-400",
  delayed: "bg-rose-500",
};

const STATUS_BADGE: Record<TripStatus, string> = {
  "on-time": "border-emerald-300/70 bg-emerald-400/90 text-emerald-950",
  "at-risk": "border-amber-300/80 bg-amber-400/90 text-slate-900",
  delayed: "border-rose-300/80 bg-rose-500/90 text-slate-100",
};

export function SidePanel({
  filteredTrips,
  selectedTrip,
  onSelectTrip,
  filter,
  onFilterChange,
  searchTerm,
  onSearchTermChange,
  isOpen,
  onToggleOpen,
}: SidePanelProps) {
  if (!isOpen) {
    return (
      <div className="flex h-full w-12 items-center justify-center border-l border-slate-800/60 bg-[#0c142b]/70">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleOpen}
          className="-rotate-90 text-xs font-semibold text-slate-200 hover:bg-transparent"
        >
          Open ▸
        </Button>
      </div>
    );
  }

  return (
    <aside className="flex h-full w-[380px] flex-col border-l border-slate-800/60 bg-[#0b1328] text-slate-100 shadow-[0_0_35px_rgba(8,12,24,0.45)]">
      <div className="flex items-start justify-between border-b border-slate-800/70 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Active Trips</h2>
          <p className="text-xs text-slate-400">Filter, inspect, and take action on live shipments.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggleOpen} className="text-xs text-slate-400">
          Close ▾
        </Button>
      </div>

      <div className="space-y-3 border-b border-slate-800/70 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={option.value === filter ? "default" : "outline"}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                "border-slate-700/70 bg-slate-900/60 text-xs text-slate-200 hover:bg-slate-800",
                option.value === filter && "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <div className="relative">
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search order, driver, or lane"
            className="h-9 w-full rounded-md border border-slate-700/70 bg-slate-900/40 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/60"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wide text-slate-500">⌕</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin scrollbar-track-slate-900/20 scrollbar-thumb-slate-700/60">
        <div className="space-y-3">
          {filteredTrips.length === 0 && (
            <div className="rounded-md border border-slate-800/80 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
              No trips match your filters.
            </div>
          )}
          {filteredTrips.map((trip) => {
            const isSelected = trip.id === selectedTrip?.id;
            return (
              <button
                key={trip.id}
                type="button"
                onClick={() => onSelectTrip(trip.id)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left transition-all",
                  "border-slate-800/70 bg-slate-900/40 hover:border-emerald-400/60 hover:bg-slate-900/70",
                  isSelected && "border-emerald-400/80 bg-emerald-500/10"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{trip.orderId}</p>
                    <p className="text-xs text-slate-400">{trip.route.origin} → {trip.route.destination}</p>
                  </div>
                  <Badge
                    className={cn(
                      "flex items-center gap-1 border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                      STATUS_BADGE[trip.status]
                    )}
                    variant="outline"
                  >
                    {trip.status === "on-time"
                      ? "On-Time"
                      : trip.status === "at-risk"
                      ? "At Risk"
                      : "Delayed"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_INDICATOR[trip.status])} aria-hidden />
                    {trip.driverName}
                  </span>
                  <span>{trip.eta} ETA</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  {trip.route.milesRemaining} miles remaining • {trip.speedMph} mph
                </div>
                <div className="mt-3">
                  <Progress value={trip.route.percentageComplete} className="h-1.5 bg-slate-800/80" />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{trip.route.percentageComplete}% complete</span>
                    <span>{trip.stopsRemaining} stops left</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-800/70 px-5 py-5">
        {selectedTrip ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Trip Detail</p>
              <h3 className="text-lg font-semibold text-white">{selectedTrip.orderId}</h3>
              <p className="text-sm text-slate-300">Driver {selectedTrip.driverName} · {selectedTrip.driverType}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
                <p className="uppercase tracking-wide text-[10px] text-slate-500">Current Location</p>
                <p className="mt-1 text-sm text-white">{selectedTrip.locationSummary}</p>
                <p className="text-[11px] text-slate-400">Next: {selectedTrip.nextStop}</p>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
                <p className="uppercase tracking-wide text-[10px] text-slate-500">ETA Confidence</p>
                <p className="mt-1 text-sm text-white">{Math.round(selectedTrip.etaConfidence * 100)}%</p>
                <Progress value={selectedTrip.etaConfidence * 100} className="mt-2 h-1.5 bg-slate-800" />
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
                <p className="uppercase tracking-wide text-[10px] text-slate-500">Speed</p>
                <p className="mt-1 text-sm text-white">{selectedTrip.speedMph} mph</p>
                <p className="text-[11px] text-slate-400">{selectedTrip.route.milesRemaining} miles to go</p>
              </div>
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
                <p className="uppercase tracking-wide text-[10px] text-slate-500">Stops Remaining</p>
                <p className="mt-1 text-sm text-white">{selectedTrip.stopsRemaining}</p>
                <p className="text-[11px] text-slate-400">Vehicle {selectedTrip.vehicleId}</p>
              </div>
            </div>

            {selectedTrip.exceptionAlerts.length > 0 && (
              <div className="space-y-2 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Exception Alerts</p>
                <div className="space-y-1 text-sm text-amber-100">
                  {selectedTrip.exceptionAlerts.map((alert) => (
                    <p key={alert}>• {alert}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-lg border border-slate-800/80 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Timeline</p>
              <div className="space-y-3">
                {selectedTrip.timeline.map((event) => (
                  <div key={`${selectedTrip.id}-${event.time}`} className="flex gap-3">
                    <div className="relative">
                      <span className={cn("block h-2 w-2 rounded-full", event.type === "alert" ? "bg-rose-400" : event.type === "success" ? "bg-emerald-400" : "bg-slate-400")} />
                      <span className="absolute -bottom-5 left-1/2 hidden h-12 w-px -translate-x-1/2 bg-slate-700/60 last:hidden sm:block" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-200">{event.time} — {event.label}</p>
                      {event.detail && (
                        <p className="text-[11px] text-slate-400">{event.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              <p className="text-xs uppercase tracking-wide text-emerald-200">AI Insight</p>
              <p className="mt-1 text-sm text-emerald-100">{selectedTrip.aiPrediction}</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                size="sm"
                asChild
                className="flex-1 bg-emerald-500 text-slate-900 hover:bg-emerald-400"
              >
                <a href={`tel:${selectedTrip.contact.driverPhone.replace(/[^0-9]/g, "")}`}>
                  Contact Driver
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-slate-700/70 bg-slate-900/50 text-slate-200 hover:bg-slate-800"
                onClick={() => onSelectTrip(selectedTrip.id)}
              >
                Center on Map
              </Button>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-300">
              <p className="uppercase tracking-wide text-[10px] text-slate-500">Dispatch Channel</p>
              <p className="mt-1 text-sm text-slate-200">{selectedTrip.contact.dispatchChannel}</p>
              <p className="text-[11px] text-slate-400">Phone {selectedTrip.contact.driverPhone}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-slate-800/80 bg-slate-900/50 px-4 py-16 text-center text-sm text-slate-400">
            Select a trip to see detailed telemetry.
          </div>
        )}
      </div>
    </aside>
  );
}
