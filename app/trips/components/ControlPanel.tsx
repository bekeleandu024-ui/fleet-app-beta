"use client";

import { Calendar, Filter, Users, TrendingUp, Sparkles } from "lucide-react";
import { DriverType, DispatchFilters } from "../types";

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
  const capacityColor = capacityPct > 80 ? "#FF4D4D" : capacityPct > 50 ? "#FFC857" : "#24D67B";

  return (
    <div className="bg-[#0A0F1E] border-b border-[#1E2638] px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Filters */}
        <div className="flex items-center gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#6C7484]" />
            <input
              type="date"
              value={filters.date}
              onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
              className="h-9 px-3 bg-[#141C2F] border border-[#1E2638] rounded-md text-sm text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA]"
            />
          </div>

          {/* Driver Type Filter */}
          <div className="flex items-center gap-2 pl-4 border-l border-[#1E2638]">
            <Users className="h-4 w-4 text-[#6C7484]" />
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
                      ? "bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/40"
                      : "bg-[#141C2F] text-[#9AA4B2] border border-[#1E2638] hover:border-[#60A5FA]/20"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-2 pl-4 border-l border-[#1E2638]">
            <Filter className="h-4 w-4 text-[#6C7484]" />
            <select
              value={filters.region}
              onChange={(e) => onFiltersChange({ ...filters, region: e.target.value })}
              className="h-9 px-3 bg-[#141C2F] border border-[#1E2638] rounded-md text-sm text-[#E6EAF2] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/40 focus:border-[#60A5FA]"
            >
              <option value="all" className="bg-[#141C2F]">All Regions</option>
              <option value="ontario" className="bg-[#141C2F]">Ontario</option>
              <option value="midwest" className="bg-[#141C2F]">Midwest US</option>
              <option value="northeast" className="bg-[#141C2F]">Northeast US</option>
            </select>
          </div>
        </div>

        {/* Right: Capacity & AI Toggle */}
        <div className="flex items-center gap-6">
          {/* Capacity Indicator */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[#141C2F] border border-[#1E2638] rounded-md">
            <TrendingUp className="h-4 w-4 text-[#6C7484]" />
            <div className="flex flex-col">
              <span className="text-xs text-[#6C7484]">Capacity</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-[#E6EAF2]">
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
                ? "bg-[#60A5FA]/10 border-[#60A5FA] text-[#60A5FA]"
                : "bg-[#141C2F] border-[#1E2638] text-[#9AA4B2] hover:border-[#60A5FA]/40"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI Auto-Dispatch</span>
            <div
              className={`w-10 h-5 rounded-full transition-colors relative ${
                autoDispatchEnabled ? "bg-[#60A5FA]" : "bg-[#1E2638]"
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
