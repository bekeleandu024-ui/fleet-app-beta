"use client";

import { useState, useMemo } from "react";
import { TripsTableView } from "./components/TripsTableView";
import { TripsControlPanel } from "./components/TripsControlPanel";
import { AIMonitoringSidebar } from "./components/AIMonitoringSidebar";
import { MOCK_DISPATCH_ORDERS, MOCK_DRIVERS } from "./mockData";
import {
  DispatchOrder,
  Driver,
  DispatchFilters,
} from "./types";

export default function TripsBoardPage() {
  // Filters
  const [filters, setFilters] = useState<DispatchFilters>({
    date: new Date().toISOString().split("T")[0],
    driverTypes: [],
    region: "All Regions",
  });
  const [aiEnabled, setAiEnabled] = useState<boolean>(true);

  // Data
  const [trips] = useState<DispatchOrder[]>(MOCK_DISPATCH_ORDERS);
  const [drivers] = useState<Driver[]>(MOCK_DRIVERS);

  // Filter trips by date and region
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Date filter (simplified - in real app, check pickup date)
      // For demo, just show all trips
      
      // Region filter - skip since origin/destination don't have region field
      // In real app would filter by region

      return true;
    });
  }, [trips, filters.date, filters.region]);

  // Filter drivers by type
  const filteredDrivers = useMemo(() => {
    if (filters.driverTypes.length === 0) return drivers;
    return drivers.filter((d) => filters.driverTypes.includes(d.type));
  }, [drivers, filters.driverTypes]);

  // Active trips count
  const activeTripsCount = useMemo(() => {
    return filteredTrips.filter(
      (t) =>
        t.status !== "unassigned" &&
        t.status !== "completed"
    ).length;
  }, [filteredTrips]);

  // Available drivers count
  const availableDriversCount = useMemo(() => {
    return filteredDrivers.filter((d) => d.status === "available").length;
  }, [filteredDrivers]);

  return (
    <div className="flex h-screen bg-[#0A0F1E] overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Control Panel */}
        <TripsControlPanel
          filters={filters}
          onFiltersChange={setFilters}
          activeTrips={activeTripsCount}
          availableDrivers={availableDriversCount}
          aiEnabled={aiEnabled}
          onAiToggle={setAiEnabled}
        />

        {/* Table View */}
        <div className="flex-1 overflow-hidden">
          <TripsTableView trips={filteredTrips} />
        </div>
      </div>

      {/* AI Monitoring Sidebar */}
      {aiEnabled && (
        <AIMonitoringSidebar trips={filteredTrips} drivers={filteredDrivers} />
      )}
    </div>
  );
}
