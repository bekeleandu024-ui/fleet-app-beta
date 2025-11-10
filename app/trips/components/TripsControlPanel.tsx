"use client";

import { Calendar, Filter, Activity, Users, BarChart3 } from "lucide-react";
import { DispatchFilters, DriverType } from "../types";

const fleetTokens = {
  bgPrimary: "bg-fleet-primary",
  bgSecondary: "bg-fleet-secondary",
  bgTertiary: "bg-fleet-tertiary",
  bgBorder: "bg-fleet-border",
  borderColor: "border-fleet",
  textPrimary: "text-fleet-primary",
  textSecondary: "text-fleet-secondary",
  textMuted: "text-fleet-muted",
  subtleBorderHover:
    "hover:border-fleet-accent/40",
};

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
    <div className={`${fleetTokens.bgSecondary} border-b ${fleetTokens.borderColor} px-6 py-4`}>
      <div className="flex items-center justify-between">
        {/* Left: Filters */}
        <div className="flex items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Calendar className={`h-4 w-4 ${fleetTokens.textMuted}`} />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
              className={`${fleetTokens.bgPrimary} border ${fleetTokens.borderColor} rounded-md px-3 py-1.5 text-sm ${fleetTokens.textPrimary} focus:outline-none focus:border-fleet-accent transition-colors`}
            />
          </div>

          {/* Driver Type Filter */}
          <div className="flex items-center gap-2">
            <Users className={`h-4 w-4 ${fleetTokens.textMuted}`} />
            <div className="flex gap-2">
              {(["company", "rental", "owner_operator"] as DriverType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleDriverTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filters.driverTypes.includes(type)
                      ? "bg-fleet-accent text-white border border-fleet-accent"
                      : `${fleetTokens.bgPrimary} ${fleetTokens.textSecondary} border ${fleetTokens.borderColor} ${fleetTokens.subtleBorderHover}`
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
            <Filter className={`h-4 w-4 ${fleetTokens.textMuted}`} />
            <select
              value={filters.region}
              onChange={(e) => onFiltersChange({ ...filters, region: e.target.value })}
              className={`${fleetTokens.bgPrimary} border ${fleetTokens.borderColor} rounded-md px-3 py-1.5 text-sm ${fleetTokens.textPrimary} focus:outline-none focus:border-fleet-accent transition-colors cursor-pointer`}
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
          <div className={`flex items-center gap-2 px-4 py-2 ${fleetTokens.bgPrimary} border ${fleetTokens.borderColor} rounded-md`}>
            <Activity className="h-4 w-4 text-fleet-accent" />
            <div>
              <div className={`text-xs ${fleetTokens.textMuted}`}>Active Trips</div>
              <div className={`text-lg font-semibold ${fleetTokens.textPrimary}`}>{activeTrips}</div>
            </div>
          </div>

          {/* Available Drivers */}
          <div className={`flex items-center gap-2 px-4 py-2 ${fleetTokens.bgPrimary} border ${fleetTokens.borderColor} rounded-md`}>
            <Users className="h-4 w-4 text-fleet-success" />
            <div>
              <div className={`text-xs ${fleetTokens.textMuted}`}>Available Drivers</div>
              <div className={`text-lg font-semibold ${fleetTokens.textPrimary}`}>{availableDrivers}</div>
            </div>
          </div>
        </div>

        {/* Right: AI Toggle */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-fleet-insight" />
          <span className={`text-sm ${fleetTokens.textPrimary}`}>AI Monitoring</span>
          <button
            onClick={() => onAiToggle(!aiEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              aiEnabled
                ? "bg-fleet-accent"
                : `${fleetTokens.bgBorder}`
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
