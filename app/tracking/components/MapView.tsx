"use client";

import { ActiveTrip } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const STATUS_BADGES: Record<ActiveTrip["status"], string> = {
  "on-time": "bg-fleet-success/20 text-fleet-success border-fleet-success/20",
  "at-risk": "bg-fleet-warning/20 text-fleet-warning border-fleet-warning/20",
  "delayed": "bg-fleet-danger/20 text-fleet-danger border-fleet-danger/20",
};

const STATUS_STROKE_COLOR: Record<ActiveTrip["status"], string> = {
  "on-time": "var(--color-fleet-success)",
  "at-risk": "var(--color-fleet-warning)",
  "delayed": "var(--color-fleet-danger)",
};

const STATUS_LABEL: Record<ActiveTrip["status"], string> = {
  "on-time": "On-Time",
  "at-risk": "At Risk",
  "delayed": "Delayed",
};

interface MapViewProps {
  trips: ActiveTrip[];
  selectedTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  focusTripIds?: string[];
  showTraffic: boolean;
  showWeather: boolean;
  onToggleTraffic: () => void;
  onToggleWeather: () => void;
}

export function MapView({
  trips,
  selectedTripId,
  onSelectTrip,
  focusTripIds,
  showTraffic,
  showWeather,
  onToggleTraffic,
  onToggleWeather,
}: MapViewProps) {
  const statusCounts = useMemo(() => {
    return trips.reduce(
      (acc, trip) => {
        acc[trip.status] += 1;
        return acc;
      },
      { "on-time": 0, "at-risk": 0, delayed: 0 } as Record<ActiveTrip["status"], number>
    );
  }, [trips]);

  const focusSet = useMemo(() => new Set(focusTripIds ?? []), [focusTripIds]);
  const dimNonFocused = focusSet.size > 0 && focusSet.size !== trips.length;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-card">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.35),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[80px_80px] opacity-40" />

      {showWeather && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.25),transparent_45%),radial-gradient(circle_at_75%_40%,rgba(59,130,246,0.2),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.2),transparent_45%)]" />
      )}

      {showTraffic && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_60%,rgba(248,113,113,0.2),transparent_50%),radial-gradient(circle_at_70%_30%,rgba(251,191,36,0.18),transparent_45%)] mix-blend-screen" />
      )}

      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-3">
        {(
          Object.keys(statusCounts) as Array<keyof typeof statusCounts>
        ).map((key) => (
          <div
            key={key}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1 text-xs uppercase tracking-wide text-foreground/80"
          >
            <span
              className={cn("h-2.5 w-2.5 rounded-full", {
                "bg-fleet-success": key === "on-time",
                "bg-fleet-warning": key === "at-risk",
                "bg-fleet-danger": key === "delayed",
              })}
            />
            {STATUS_LABEL[key]} • {statusCounts[key]}
          </div>
        ))}
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          size="sm"
          variant={showTraffic ? "default" : "outline"}
          onClick={onToggleTraffic}
          aria-pressed={showTraffic}
          className={cn(
            "border border-border bg-card/80 text-foreground transition-colors hover:bg-card/90",
            showTraffic && "bg-fleet-success text-fleet-primary hover:opacity-90"
          )}
        >
          Traffic Layer
        </Button>
        <Button
          size="sm"
          variant={showWeather ? "default" : "outline"}
          onClick={onToggleWeather}
          aria-pressed={showWeather}
          className={cn(
            "border border-border bg-card/80 text-foreground transition-colors hover:bg-card/90",
            showWeather && "bg-fleet-info text-fleet-primary hover:opacity-90"
          )}
        >
          Weather Layer
        </Button>
      </div>

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {trips.map((trip) => {
          const isFocused = !dimNonFocused || focusSet.has(trip.id);
          const strokeColor = STATUS_STROKE_COLOR[trip.status];
          const baseOpacity = trip.status === "on-time" ? 0.55 : 0.75;
          const strokeOpacity = isFocused ? baseOpacity : baseOpacity * 0.35;
          return (
            <polyline
              key={`${trip.id}-route`}
              points={trip.trail.map((pt) => `${pt.x},${pt.y}`).join(" ")}
              fill="none"
              stroke={strokeColor}
              strokeOpacity={strokeOpacity}
              strokeWidth={selectedTripId === trip.id ? 2.2 : 1.4}
              strokeDasharray={trip.status === "on-time" ? "" : "6 3"}
            />
          );
        })}
      </svg>

      {trips.map((trip) => {
        const isSelected = selectedTripId === trip.id;
        const isFocused = !dimNonFocused || focusSet.has(trip.id);
        const shouldDim = !isFocused && !isSelected;
        return (
          <button
            key={trip.id}
            type="button"
            onClick={() => onSelectTrip(trip.id)}
            className={cn(
              "group absolute -translate-x-1/2 -translate-y-full rounded-lg border px-3 py-2 text-left text-xs font-medium text-foreground shadow-lg transition-all",
              "border-border bg-card/90 backdrop-blur",
              isSelected && "ring-1 ring-ring bg-card",
              shouldDim && "opacity-45"
            )}
            style={{ left: `${trip.position.x}%`, top: `${trip.position.y}%` }}
          >
            <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide text-foreground/80">
              <span>{trip.orderId}</span>
              <Badge
                variant="outline"
                className={cn(
                  "border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                  STATUS_BADGES[trip.status]
                )}
              >
                {STATUS_LABEL[trip.status]}
              </Badge>
            </div>
            <div className="mt-1 text-[13px] font-semibold text-foreground">{trip.driverName}</div>
            <div className="text-[11px] text-muted-foreground">{trip.locationSummary}</div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-foreground/80">
              <span>{trip.speedMph} mph</span>
              <span>ETA {trip.eta}</span>
            </div>
          </button>
        );
      })}

      <div className="pointer-events-none absolute bottom-4 left-4 max-w-xs rounded-lg border border-border/60 bg-card/80 p-4 text-xs text-foreground shadow-lg">
        <p className="text-[11px] uppercase tracking-wider text-foreground/80">AI Network Synopsis</p>
        <p className="mt-2 leading-relaxed text-foreground">
          Watching weather system near Des Moines and construction along I-35. Recommendations will auto-refresh every 2 minutes.
        </p>
      </div>
    </div>
  );
}
