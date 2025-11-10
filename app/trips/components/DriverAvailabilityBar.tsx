"use client";

import { MapPin, Clock } from "lucide-react";
import { Driver } from "../types";

interface DriverAvailabilityBarProps {
  drivers: Driver[];
  onDriverClick: (driver: Driver) => void;
}

export function DriverAvailabilityBar({ drivers, onDriverClick }: DriverAvailabilityBarProps) {
  const getStatusColor = (status: Driver["status"]) => {
    switch (status) {
      case "available":
        return "bg-fleet-success border-fleet-success";
      case "on_trip":
        return "bg-fleet-accent border-fleet-accent";
      case "hos_break":
        return "bg-fleet-warning border-fleet-warning";
      case "off_duty":
        return "bg-fleet-muted border-fleet-muted";
    }
  };

  const getStatusLabel = (status: Driver["status"]) => {
    switch (status) {
      case "available":
        return "Available";
      case "on_trip":
        return "On Trip";
      case "hos_break":
        return "HOS Break";
      case "off_duty":
        return "Off Duty";
    }
  };

  const getDriverTypeBadge = (type: Driver["type"]) => {
    switch (type) {
      case "company":
  return { label: "COM", color: "text-fleet-accent bg-fleet-accent/20 border border-fleet-accent/20" };
      case "rental":
  return { label: "RNR", color: "text-fleet-warning bg-fleet-warning/20 border border-fleet-warning/20" };
      case "owner_operator":
        return { label: "O/O", color: "text-fleet-insight bg-fleet-insight/10 border border-fleet-insight/20" };
    }
  };

  return (
    <div className="bg-fleet-primary border-t border-fleet p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-fleet-primary">Driver Availability</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fleet-success" />
            <span className="text-fleet-muted">Available ({drivers.filter((d) => d.status === "available").length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fleet-accent" />
            <span className="text-fleet-muted">On Trip ({drivers.filter((d) => d.status === "on_trip").length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-fleet-warning" />
            <span className="text-fleet-muted">HOS Break ({drivers.filter((d) => d.status === "hos_break").length})</span>
          </div>
        </div>
      </div>

      {/* Driver Cards Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {drivers.map((driver) => {
          const typeBadge = getDriverTypeBadge(driver.type);
          const hosColor =
            driver.hosRemaining < 3
              ? "var(--fleet-alert)"
              : driver.hosRemaining < 6
              ? "var(--fleet-warning)"
              : "var(--fleet-success)";

          return (
            <div
              key={driver.id}
              onClick={() => onDriverClick(driver)}
              className="flex-shrink-0 w-64 bg-fleet-tertiary border border-fleet rounded-lg p-3 cursor-pointer hover:border-fleet-accent/40 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-fleet-accent/20 flex items-center justify-center text-fleet-accent text-xs font-medium">
                    {driver.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-fleet-primary">{driver.name}</div>
                    <div className="text-[10px] text-fleet-muted">{driver.id}</div>
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${typeBadge.color}`}>
                  {typeBadge.label}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(driver.status).split(" ")[0]}`} />
                <span className="text-xs text-fleet-secondary">{getStatusLabel(driver.status)}</span>
              </div>

              {/* Location */}
              {driver.currentLocation && (
                <div className="flex items-center gap-1 text-xs text-fleet-secondary mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{driver.currentLocation}</span>
                </div>
              )}

              {/* HOS */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-fleet-muted">HOS Remaining</span>
                <span className="font-medium" style={{ color: hosColor }}>
                  {driver.hosRemaining.toFixed(1)}h
                </span>
              </div>

              {/* Unit */}
              {driver.assignedUnit && (
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-fleet-muted">Unit</span>
                  <span className="text-fleet-secondary">{driver.assignedUnit}</span>
                </div>
              )}

              {/* Next Available / AI Score */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-fleet">
                {driver.nextAvailable ? (
                  <>
                    <span className="text-fleet-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Next Available
                    </span>
                    <span className="text-fleet-warning">
                      {new Date(driver.nextAvailable).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-fleet-muted">AI Efficiency</span>
                    <span className="text-fleet-accent">{driver.aiEfficiencyScore}/100</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
