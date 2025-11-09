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
        return "bg-[#24D67B] border-[#24D67B]";
      case "on_trip":
        return "bg-[#60A5FA] border-[#60A5FA]";
      case "hos_break":
        return "bg-[#FFC857] border-[#FFC857]";
      case "off_duty":
        return "bg-[#6C7484] border-[#6C7484]";
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
        return { label: "COM", color: "text-[#60A5FA] bg-[#60A5FA]/10 border-[#60A5FA]/20" };
      case "rental":
        return { label: "RNR", color: "text-[#FFC857] bg-[#FFC857]/10 border-[#FFC857]/20" };
      case "owner_operator":
        return { label: "O/O", color: "text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/20" };
    }
  };

  return (
    <div className="bg-[#0A0F1E] border-t border-[#1E2638] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#E6EAF2]">Driver Availability</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#24D67B]" />
            <span className="text-[#6C7484]">Available ({drivers.filter((d) => d.status === "available").length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#60A5FA]" />
            <span className="text-[#6C7484]">On Trip ({drivers.filter((d) => d.status === "on_trip").length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFC857]" />
            <span className="text-[#6C7484]">HOS Break ({drivers.filter((d) => d.status === "hos_break").length})</span>
          </div>
        </div>
      </div>

      {/* Driver Cards Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {drivers.map((driver) => {
          const typeBadge = getDriverTypeBadge(driver.type);
          const hosColor = driver.hosRemaining < 3 ? "#FF8A00" : driver.hosRemaining < 6 ? "#FFC857" : "#24D67B";

          return (
            <div
              key={driver.id}
              onClick={() => onDriverClick(driver)}
              className="flex-shrink-0 w-64 bg-[#141C2F] border border-[#1E2638] rounded-lg p-3 cursor-pointer hover:border-[#60A5FA]/40 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[#60A5FA]/20 flex items-center justify-center text-[#60A5FA] text-xs font-medium">
                    {driver.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#E6EAF2]">{driver.name}</div>
                    <div className="text-[10px] text-[#6C7484]">{driver.id}</div>
                  </div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${typeBadge.color}`}>
                  {typeBadge.label}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(driver.status).split(" ")[0]}`} />
                <span className="text-xs text-[#9AA4B2]">{getStatusLabel(driver.status)}</span>
              </div>

              {/* Location */}
              {driver.currentLocation && (
                <div className="flex items-center gap-1 text-xs text-[#9AA4B2] mb-2">
                  <MapPin className="h-3 w-3" />
                  <span>{driver.currentLocation}</span>
                </div>
              )}

              {/* HOS */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[#6C7484]">HOS Remaining</span>
                <span className="font-medium" style={{ color: hosColor }}>
                  {driver.hosRemaining.toFixed(1)}h
                </span>
              </div>

              {/* Unit */}
              {driver.assignedUnit && (
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#6C7484]">Unit</span>
                  <span className="text-[#9AA4B2]">{driver.assignedUnit}</span>
                </div>
              )}

              {/* Next Available / AI Score */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1E2638]">
                {driver.nextAvailable ? (
                  <>
                    <span className="text-[#6C7484] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Next Available
                    </span>
                    <span className="text-[#FFC857]">
                      {new Date(driver.nextAvailable).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[#6C7484]">AI Efficiency</span>
                    <span className="text-[#60A5FA]">{driver.aiEfficiencyScore}/100</span>
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
