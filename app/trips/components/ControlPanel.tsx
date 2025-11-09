"use client";

import { Calendar, Filter, Users, TrendingUp, Sparkles } from "lucide-react";
import { DriverType, DispatchFilters } from "../types";

const fleetTokens = {
  bgPrimary: "bg-fleet-primary",
  bgSecondary: "bg-fleet-secondary",
  bgTertiary: "bg-fleet-tertiary",
  bgBorder: "bg-fleet-border",
  borderColor: "border-fleet",
  textPrimary: "text-fleet-primary",
  textSecondary: "text-fleet-secondary",
  textMuted: "text-fleet-muted",
};

interface ControlPanelProps {
  filters: DispatchFilters;
  onFiltersChange: (filters: DispatchFilters) => void;
  availableDrivers: number;
  pendingOrders: number;
  autoDispatchEnabled: boolean;
  onAutoDispatchToggle: (enabled: boolean) => void;
}

export function ControlPanel({
  filters,
  onFiltersChange,
  availableDrivers,
  pendingOrders,
  autoDispatchEnabled,
  onAutoDispatchToggle,
}: ControlPanelProps) {
  const handleDriverTypeToggle = (type: DriverType) => {
    const current = filters.driverTypes;
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, driverTypes: updated });
  };

  const capacityPct = availableDrivers > 0 ? (pendingOrders / availableDrivers) * 100 : 0;
  const capacityColor =
    capacityPct > 80
      ? "var(--fleet-danger)"
      : capacityPct > 50
      ? "var(--fleet-warning)"
      : "var(--fleet-success)";

  return (
    <div className={`${fleetTokens.bgPrimary} border-b ${fleetTokens.borderColor} px-6 py-4`}>
      <div className="flex items-center justify-between gap-6">
        {/* Left: Filters */}
        <div className="flex items-center gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <Calendar className={`h-4 w-4 ${fleetTokens.textMuted}`} />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
              className={`h-9 px-3 ${fleetTokens.bgTertiary} border ${fleetTokens.borderColor} rounded-md text-sm ${fleetTokens.textPrimary} focus:outline-none focus:ring-2 focus:ring-fleet-accent/40 focus:border-fleet-accent`}
            />
          </div>

          {/* Driver Type Filter */}
          <div className={`flex items-center gap-2 pl-4 border-l ${fleetTokens.borderColor}`}>
            <Users className={`h-4 w-4 ${fleetTokens.textMuted}`} />
            <div className="flex gap-2">
              {[
                { value: "company" as DriverType, label: "Company" },
                { value: "rental" as DriverType, label: "Rental" },
                { value: "owner_operator" as DriverType, label: "O/O" },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleDriverTypeToggle(type.value)}
                  className={`h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                    filters.driverTypes.includes(type.value)
                      ? `bg-fleet-accent/20 text-fleet-accent border border-fleet-accent/40`
                      : `${fleetTokens.bgTertiary} ${fleetTokens.textSecondary} border ${fleetTokens.borderColor} hover:border-fleet-accent/40`
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div className={`flex items-center gap-2 pl-4 border-l ${fleetTokens.borderColor}`}>
            <Filter className={`h-4 w-4 ${fleetTokens.textMuted}`} />
            <select
              value={filters.region}
              onChange={(e) => onFiltersChange({ ...filters, region: e.target.value })}
              className={`h-9 px-3 ${fleetTokens.bgTertiary} border ${fleetTokens.borderColor} rounded-md text-sm ${fleetTokens.textPrimary} focus:outline-none focus:ring-2 focus:ring-fleet-accent/40 focus:border-fleet-accent`}
            >
              <option value="all" className="bg-fleet-tertiary">All Regions</option>
              <option value="ontario" className="bg-fleet-tertiary">Ontario</option>
              <option value="midwest" className="bg-fleet-tertiary">Midwest US</option>
              <option value="northeast" className="bg-fleet-tertiary">Northeast US</option>
            </select>
          </div>
        </div>

        {/* Right: Capacity & AI Toggle */}
        <div className="flex items-center gap-6">
          {/* Capacity Indicator */}
          <div className={`flex items-center gap-3 px-4 py-2 ${fleetTokens.bgTertiary} border ${fleetTokens.borderColor} rounded-md`}>
            <TrendingUp className={`h-4 w-4 ${fleetTokens.textMuted}`} />
            <div className="flex flex-col">
              <span className={`text-xs ${fleetTokens.textMuted}`}>Capacity</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-sm font-medium ${fleetTokens.textPrimary}`}>
                  {availableDrivers} available / {pendingOrders} pending
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: capacityColor }}
                >
                  {capacityPct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* AI Auto-Dispatch Toggle */}
          <button
            onClick={() => onAutoDispatchToggle(!autoDispatchEnabled)}
            className={`flex items-center gap-3 h-10 px-4 rounded-md border transition-all ${
              autoDispatchEnabled
                ? "bg-fleet-accent/15 border-fleet-accent text-fleet-accent"
                : `${fleetTokens.bgTertiary} ${fleetTokens.borderColor} ${fleetTokens.textSecondary} hover:border-fleet-accent/40`
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI Auto-Dispatch</span>
            <div
              className={`w-10 h-5 rounded-full transition-colors relative ${
                autoDispatchEnabled ? "bg-fleet-accent" : `${fleetTokens.bgBorder}`
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  autoDispatchEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
