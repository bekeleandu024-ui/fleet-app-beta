"use client";

import { useState } from "react";
import { Check, User, Truck, Clock, MapPin, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Driver {
  id: string;
  name: string;
  homeBase?: string;
  hoursAvailableToday?: number;
  onTimeScore?: number;
  status?: string;
}

interface Unit {
  id: string;
  code: string;
  type?: string;
  homeBase?: string;
  status?: string;
}

interface DriverUnitSelectorProps {
  drivers: Driver[];
  units: Unit[];
  selectedDriverId: string;
  selectedUnitId: string;
  recommendedDriverId?: string | null;
  recommendedUnitId?: string | null;
  onDriverSelect: (driverId: string) => void;
  onUnitSelect: (unitId: string) => void;
  className?: string;
}

export function DriverUnitSelector({
  drivers,
  units,
  selectedDriverId,
  selectedUnitId,
  recommendedDriverId,
  recommendedUnitId,
  onDriverSelect,
  onUnitSelect,
  className = "",
}: DriverUnitSelectorProps) {
  const [driverSearchTerm, setDriverSearchTerm] = useState("");
  const [unitSearchTerm, setUnitSearchTerm] = useState("");

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(driverSearchTerm.toLowerCase())
  );

  const filteredUnits = units.filter(
    (u) =>
      u.code.toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
      u.type?.toLowerCase().includes(unitSearchTerm.toLowerCase())
  );

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {/* Driver Selection */}
      <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-neutral-200">Select Driver</h3>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search drivers..."
          className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none"
          value={driverSearchTerm}
          onChange={(e) => setDriverSearchTerm(e.target.value)}
        />

        {/* Driver List */}
        <div className="max-h-[300px] space-y-2 overflow-y-auto">
          {filteredDrivers.map((driver) => {
            const isRecommended = driver.id === recommendedDriverId;
            const isSelected = driver.id === selectedDriverId;

            return (
              <button
                key={driver.id}
                type="button"
                onClick={() => onDriverSelect(driver.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-950/30"
                    : isRecommended
                    ? "border-emerald-800/50 bg-emerald-950/20 hover:bg-emerald-950/30"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{driver.name}</p>
                  {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                  {isRecommended && !isSelected && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                  {driver.homeBase && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {driver.homeBase}
                    </span>
                  )}
                  {driver.hoursAvailableToday !== undefined && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {driver.hoursAvailableToday}h available
                    </span>
                  )}
                  {driver.onTimeScore !== undefined && (
                    <span className={driver.onTimeScore >= 90 ? "text-emerald-400" : "text-amber-400"}>
                      {driver.onTimeScore}% on-time
                    </span>
                  )}
                  {driver.status && driver.status !== "Active" && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      {driver.status}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredDrivers.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-500">No drivers found</div>
          )}
        </div>
      </Card>

      {/* Unit Selection */}
      <Card className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-neutral-200">Select Unit</h3>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search units..."
          className="mb-3 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
          value={unitSearchTerm}
          onChange={(e) => setUnitSearchTerm(e.target.value)}
        />

        {/* Unit List */}
        <div className="max-h-[300px] space-y-2 overflow-y-auto">
          {filteredUnits.map((unit) => {
            const isRecommended = unit.id === recommendedUnitId;
            const isSelected = unit.id === selectedUnitId;

            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => onUnitSelect(unit.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-amber-500 bg-amber-950/30"
                    : isRecommended
                    ? "border-amber-800/50 bg-amber-950/20 hover:bg-amber-950/30"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{unit.code}</p>
                  {isSelected && <Check className="h-4 w-4 text-amber-400" />}
                  {isRecommended && !isSelected && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-400">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                  {unit.type && <span>{unit.type}</span>}
                  {unit.homeBase && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {unit.homeBase}
                    </span>
                  )}
                  {unit.status && unit.status !== "Available" && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      {unit.status}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredUnits.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-500">No units found</div>
          )}
        </div>
      </Card>
    </div>
  );
}
