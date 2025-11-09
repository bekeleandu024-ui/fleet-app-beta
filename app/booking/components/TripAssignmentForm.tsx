"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DriverOption, UnitOption, BookingRecommendation } from "../types";

interface TripAssignmentFormProps {
  drivers: DriverOption[];
  units: UnitOption[];
  recommendation: BookingRecommendation;
  onBook: (assignment: TripAssignment) => void;
}

export interface TripAssignment {
  driverId: string;
  driverName: string;
  unitId: string;
  unitCode: string;
  rate: string;
  tripType: string;
  tripZone: string;
  miles: string;
}

export function TripAssignmentForm({
  drivers,
  units,
  recommendation,
  onBook,
}: TripAssignmentFormProps) {
  const [selectedDriver, setSelectedDriver] = useState(recommendation.driver.id);
  const [selectedUnit, setSelectedUnit] = useState(recommendation.unit.id);
  const [rate, setRate] = useState(
    `${recommendation.rate.type} - ${recommendation.rate.zone} - ${recommendation.rate.ratePerMile.toFixed(2)} CPM`
  );
  const [tripZone, setTripZone] = useState(recommendation.rate.zone);
  const [miles, setMiles] = useState(recommendation.miles.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const driver = drivers.find((d) => d.id === selectedDriver);
    const unit = units.find((u) => u.id === selectedUnit);
    
    if (!driver || !unit) return;

    onBook({
      driverId: selectedDriver,
      driverName: driver.name,
      unitId: selectedUnit,
      unitCode: unit.unitNumber,
      rate,
      tripType: recommendation.rate.type,
      tripZone,
      miles,
    });
  };

  return (
    <div className="bg-[#0B1020] border border-[#1E2638] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#E6EAF2] mb-1">
            Trip Assignment & Dispatch Overrides
          </h2>
          <p className="text-xs text-[#6C7484]">
            Align drivers, equipment, economics, and routing commitments before
            launching the trip.
          </p>
        </div>
        <span className="px-3 py-1 bg-[#24D67B]/10 border border-[#24D67B]/30 rounded-md text-xs font-medium text-[#24D67B]">
          ACTIVE LOAD
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trip Assignment Section */}
        <div>
          <div className="text-xs font-medium text-[#6C7484] mb-4">
            TRIP ASSIGNMENT
          </div>
          <p className="text-xs text-[#9AA4B2] mb-4">
            Align resources, economics, and guardrails before booking.
          </p>

          <div className="space-y-4">
            {/* Driver Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6C7484] mb-2">
                  DRIVER
                </label>
                <div className="relative">
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full bg-[#0F1420] border border-[#1E2638] rounded-md px-3 py-2 text-sm text-[#E6EAF2] appearance-none cursor-pointer focus:outline-none focus:border-[#60A5FA] transition-colors"
                  >
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C7484] pointer-events-none" />
                </div>
                <div className="text-xs text-[#6C7484] mt-1">
                  {drivers.find((d) => d.id === selectedDriver)?.homeTerminal}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6C7484] mb-2">
                  DRIVER NAME (MANIFEST)
                </label>
                <input
                  type="text"
                  value={drivers.find((d) => d.id === selectedDriver)?.name || ""}
                  readOnly
                  className="w-full bg-[#0F1420] border border-[#1E2638] rounded-md px-3 py-2 text-sm text-[#E6EAF2] focus:outline-none focus:border-[#60A5FA] transition-colors"
                />
              </div>
            </div>

            {/* Unit Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6C7484] mb-2">
                  UNIT
                </label>
                <div className="relative">
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full bg-[#0F1420] border border-[#1E2638] rounded-md px-3 py-2 text-sm text-[#E6EAF2] appearance-none cursor-pointer focus:outline-none focus:border-[#60A5FA] transition-colors"
                  >
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C7484] pointer-events-none" />
                </div>
                <div className="text-xs text-[#6C7484] mt-1">
                  {units.find((u) => u.id === selectedUnit)?.class} -{" "}
                  {units.find((u) => u.id === selectedUnit)?.homeTerminal}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6C7484] mb-2">
                  UNIT CODE (BOL)
                </label>
                <input
                  type="text"
                  value={units.find((u) => u.id === selectedUnit)?.unitNumber || ""}
                  readOnly
                  className="w-full bg-[#0F1420] border border-[#1E2638] rounded-md px-3 py-2 text-sm text-[#E6EAF2] focus:outline-none focus:border-[#60A5FA] transition-colors"
                />
              </div>
            </div>

            {/* Rate Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6C7484] mb-2">
                  RATE
                </label>
                <div className="relative">
                  <select
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-[#0F1420] border border-[#1E2638] rounded-md px-3 py-2 text-sm text-[#E6EAF2] appearance-none cursor-pointer focus:outline-none focus:border-[#60A5FA] transition-colors"
                  >
                    <option value={rate}>{rate}</option>
                    <option value="COM - REGIONAL - 1.45 CPM">
                      COM - REGIONAL - 1.45 CPM
                    </option>
                    <option value="EXPEDITE - URGENT - 2.15 CPM">
                      EXPEDITE - URGENT - 2.15 CPM
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C7484] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6C7484] mb-2">
                  TRIP TYPE
                </label>
                <input
                  type="text"
                  value={recommendation.rate.type}
                  readOnly
                  className="w-full bg-[#0F1420] border border-[#1E2638] rounded-md px-3 py-2 text-sm text-[#E6EAF2] focus:outline-none"
                />
              </div>
            </div>

            {/* Trip Zone & Miles */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6C7484] mb-2">
                  TRIP ZONE
                </label>
                <div className="relative">
                  <select
                    value={tripZone}
                    onChange={(e) => setTripZone(e.target.value)}
                    className="w-full bg-[#0F1420] border border-[#1E2638] rounded-md px-3 py-2 text-sm text-[#E6EAF2] appearance-none cursor-pointer focus:outline-none focus:border-[#60A5FA] transition-colors"
                  >
                    <option value="GLOBAL">GLOBAL</option>
                    <option value="REGIONAL">REGIONAL</option>
                    <option value="LOCAL">LOCAL</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6C7484] pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6C7484] mb-2">
                  MILES
                </label>
                <input
                  type="text"
                  value={miles}
                  onChange={(e) => setMiles(e.target.value)}
                  className="w-full bg-[#0F1420] border border-[#1E2638] rounded-md px-3 py-2 text-sm text-[#E6EAF2] focus:outline-none focus:border-[#60A5FA] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end pt-4 border-t border-[#1E2638]">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#60A5FA] hover:bg-[#60A5FA]/90 rounded-md text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:ring-offset-2 focus:ring-offset-[#0B1020]"
          >
            Launch Booking
          </button>
        </div>
      </form>
    </div>
  );
}
