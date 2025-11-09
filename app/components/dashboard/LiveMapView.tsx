"use client";

import { useState } from "react";
import { MapPin, Navigation, AlertTriangle, Layers } from "lucide-react";

interface TruckLocation {
  id: string;
  driver: string;
  lat: number;
  lng: number;
  status: "on-time" | "at-risk" | "delayed";
  eta: string;
}

export default function LiveMapView() {
  const [showTraffic, setShowTraffic] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showZones, setShowZones] = useState(false);

  // Mock truck locations
  const trucks: TruckLocation[] = [
    { id: "T001", driver: "John Smith", lat: 43.65, lng: -79.38, status: "on-time", eta: "2:30 PM" },
    { id: "T002", driver: "Sarah Johnson", lat: 43.7, lng: -79.42, status: "at-risk", eta: "3:15 PM" },
    { id: "T003", driver: "Mike Wilson", lat: 43.6, lng: -79.35, status: "delayed", eta: "4:00 PM" },
  ];

  const getStatusColor = (status: TruckLocation["status"]) => {
    switch (status) {
      case "on-time":
        return "bg-green-500";
      case "at-risk":
        return "bg-yellow-500";
      case "delayed":
        return "bg-red-500";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg shadow-md transition-colors ${
            showTraffic
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Navigation className="h-4 w-4" />
          Traffic
        </button>
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg shadow-md transition-colors ${
            showRoutes
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Layers className="h-4 w-4" />
          Routes
        </button>
        <button
          onClick={() => setShowZones(!showZones)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg shadow-md transition-colors ${
            showZones
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Zones
        </button>
      </div>

      {/* Map Placeholder - In production, integrate Mapbox or Google Maps */}
      <div className="relative h-[500px] bg-gradient-to-br from-blue-50 to-gray-100">
        {/* Map background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Truck markers */}
        <div className="absolute inset-0 flex items-center justify-center">
          {trucks.map((truck, index) => (
            <div
              key={truck.id}
              className="absolute group"
              style={{
                left: `${30 + index * 20}%`,
                top: `${40 + index * 10}%`,
              }}
            >
              {/* Truck marker */}
              <div className={`${getStatusColor(truck.status)} h-4 w-4 rounded-full shadow-lg border-2 border-white animate-pulse`} />
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                  <div className="font-semibold">{truck.id} - {truck.driver}</div>
                  <div className="text-gray-300">ETA: {truck.eta}</div>
                  <div className={`capitalize ${
                    truck.status === "on-time" ? "text-green-400" :
                    truck.status === "at-risk" ? "text-yellow-400" :
                    "text-red-400"
                  }`}>
                    {truck.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Exception alerts overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">
                  2 Active Alerts
                </p>
                <p className="text-xs text-red-700 mt-1">
                  • Late pickup: Order #1234 (15 min delay)
                </p>
                <p className="text-xs text-red-700">
                  • Border delay: Truck T003 (30 min wait)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map center indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 text-xs font-medium">
            Live Map View - Toronto, ON
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-gray-600">On-Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-gray-600">At Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-gray-600">Delayed</span>
            </div>
          </div>
          <div className="text-gray-500">
            {trucks.length} active trucks • Updated just now
          </div>
        </div>
      </div>
    </div>
  );
}
