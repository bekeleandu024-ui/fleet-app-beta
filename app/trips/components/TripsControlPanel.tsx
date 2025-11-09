"use client";

import { Calendar, Filter, Activity, Users, BarChart3 } from "lucide-react";
import { DispatchFilters, DriverType } from "../types";

interface TripsControlPanelProps {
  filters: DispatchFilters;
  onFiltersChange: (filters: DispatchFilters) => void;
  activeTrips: number;
  availableDrivers: number;
  aiEnabled: boolean;
  onAiToggle: (enabled: boolean) => void;
}

export function TripsControlPanel({
  filters,
  onFiltersChange,
  activeTrips,
  availableDrivers,
  aiEnabled,
  onAiToggle,
}: TripsControlPanelProps) {
  const handleDriverTypeToggle = (type: DriverType) => {
    const current = filters.driverTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, driverTypes: updated });
  };

  return (
    <div className="bg-[#0F1420] border-b border-[#1E2638] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Filters */}
        <div className="flex items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#6C7484]" />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
              className="bg-[#0B1020] border border-[#1E2638] rounded-md px-3 py-1.5 text-sm text-[#E6EAF2] focus:outline-none focus:border-[#60A5FA] transition-colors"
            />
          </div>

          {/* Driver Type Filter */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#6C7484]" />
            <div className="flex gap-2">
              {(["company", "rental", "owner_operator"] as DriverType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleDriverTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filters.driverTypes.includes(type)
                      ? "bg-[#60A5FA] text-white border border-[#60A5FA]"
                      : "bg-[#0B1020] text-[#9AA4B2] border border-[#1E2638] hover:border-[#2A3548]"
                  }`}
                >
                  {type === "company"
                    ? "COM"
                    : type === "rental"
                    ? "RNR"
                    : "O/O"}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#6C7484]" />
            <select
              value={filters.region}
              onChange={(e) => onFiltersChange({ ...filters, region: e.target.value })}
              className="bg-[#0B1020] border border-[#1E2638] rounded-md px-3 py-1.5 text-sm text-[#E6EAF2] focus:outline-none focus:border-[#60A5FA] transition-colors cursor-pointer"
            >
              <option value="All Regions">All Regions</option>
              <option value="Midwest">Midwest</option>
              <option value="Northeast">Northeast</option>
              <option value="South">South</option>
              <option value="West">West</option>
            </select>
          </div>
        </div>

        {/* Center: Stats */}
        <div className="flex items-center gap-6">
          {/* Active Trips */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0B1020] border border-[#1E2638] rounded-md">
            <Activity className="h-4 w-4 text-[#60A5FA]" />
            <div>
              <div className="text-xs text-[#6C7484]">Active Trips</div>
              <div className="text-lg font-semibold text-[#E6EAF2]">{activeTrips}</div>
            </div>
          </div>

          {/* Available Drivers */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0B1020] border border-[#1E2638] rounded-md">
            <Users className="h-4 w-4 text-[#24D67B]" />
            <div>
              <div className="text-xs text-[#6C7484]">Available Drivers</div>
              <div className="text-lg font-semibold text-[#E6EAF2]">{availableDrivers}</div>
            </div>
          </div>
        </div>

        {/* Right: AI Toggle */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-[#A78BFA]" />
          <span className="text-sm text-[#E6EAF2]">AI Monitoring</span>
          <button
            onClick={() => onAiToggle(!aiEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              aiEnabled ? "bg-[#60A5FA]" : "bg-[#1E2638]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                aiEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
