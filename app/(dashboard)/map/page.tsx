"use client";

import { useState, useEffect, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Truck, MapPin, Navigation, Warehouse, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fallback coordinates for regions if specific unit coordinates are missing
const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Southern Ontario": { lat: 43.6532, lng: -79.3832 },
  "Greater Toronto Area": { lat: 43.7000, lng: -79.4000 },
  "Eastern Ontario": { lat: 45.4215, lng: -75.6972 },
  "Northern Ontario": { lat: 46.4917, lng: -80.9930 },
  "Western Ontario": { lat: 42.9849, lng: -81.2453 },
  "Quebec": { lat: 45.5017, lng: -73.5673 },
  "Montreal": { lat: 45.5017, lng: -73.5673 },
};

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [fleetLocations, setFleetLocations] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"all" | "trips" | "staged">("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fleetRes, unitsRes] = await Promise.all([
          fetch("/api/map/fleet"),
          fetch("/api/master-data/units")
        ]);
        
        const fleetData = await fleetRes.json();
        const unitsData = await unitsRes.json();

        if (fleetData.fleet) {
          setFleetLocations(fleetData.fleet);
        }
        if (unitsData.data) {
          setUnits(unitsData.data);
        }
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Filter staged units (available and not currently on a trip)
  const stagedUnits = useMemo(() => {
    const activeUnitIds = new Set(fleetLocations.map(t => t.unitId || t.unitNumber));
    return units.filter(u => 
      u.status === "Available" && 
      !activeUnitIds.has(u.id) && 
      !activeUnitIds.has(u.name)
    ).map(u => {
      // Assign coordinates based on region if missing
      const coords = u.lat && u.lng 
        ? { lat: u.lat, lng: u.lng } 
        : REGION_COORDINATES[u.region] || { lat: 43.6532, lng: -79.3832 }; // Default to Toronto
      
      return {
        ...u,
        lat: coords.lat,
        lng: coords.lng,
        type: "staged"
      };
    });
  }, [units, fleetLocations]);

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-black text-zinc-300 p-8 flex items-center justify-center">
        <Card className="max-w-md p-6 bg-zinc-900 border-zinc-800 text-center">
          <MapPin className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Map Configuration Required</h2>
          <p className="text-zinc-400 mb-4">
            Please add your Google Maps API key to <code className="bg-zinc-800 px-1 py-0.5 rounded">.env.local</code> as:
          </p>
          <code className="block bg-black p-3 rounded text-sm text-blue-400 mb-4">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
          </code>
          <p className="text-xs text-zinc-500">
            Make sure to enable Maps JavaScript API in your Google Cloud Console.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black">
      <div className="flex-1 relative">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
            defaultZoom={4}
            mapId="fleet-map"
            className="w-full h-full"
            disableDefaultUI={true}
            zoomControl={true}
            styles={[
                {
                  elementType: "geometry",
                  stylers: [{ color: "#242f3e" }],
                },
                {
                  elementType: "labels.text.stroke",
                  stylers: [{ color: "#242f3e" }],
                },
                {
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#746855" }],
                },
                {
                  featureType: "administrative.locality",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#d59563" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "geometry",
                  stylers: [{ color: "#263c3f" }],
                },
                {
                  featureType: "poi.park",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#6b9a76" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212a37" }],
                },
                {
                  featureType: "road",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#9ca5b3" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry",
                  stylers: [{ color: "#746855" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#1f2835" }],
                },
                {
                  featureType: "road.highway",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#f3d19c" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#17263c" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.fill",
                  stylers: [{ color: "#515c6d" }],
                },
                {
                  featureType: "water",
                  elementType: "labels.text.stroke",
                  stylers: [{ color: "#17263c" }],
                },
              ]}
          >
            {(viewMode === "all" || viewMode === "trips") && fleetLocations.map((truck) => (
              truck.lat && truck.lng ? (
                <AdvancedMarker
                  key={truck.id}
                  position={{ lat: truck.lat, lng: truck.lng }}
                  onClick={() => setSelectedItem(truck)}
                >
                  <div className="relative group">
                    <div className={`p-2 rounded-full border-2 ${
                      truck.status === "in_transit" || truck.status === "en_route_to_pickup"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                        : "bg-amber-500/20 border-amber-500 text-amber-400"
                    } transition-transform hover:scale-110`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
                  </div>
                </AdvancedMarker>
              ) : null
            ))}

            {(viewMode === "all" || viewMode === "staged") && stagedUnits.map((unit) => (
              <AdvancedMarker
                key={unit.id}
                position={{ lat: unit.lat, lng: unit.lng }}
                onClick={() => setSelectedItem(unit)}
              >
                <div className="relative group">
                  <div className="p-2 rounded-full border-2 bg-blue-500/20 border-blue-500 text-blue-400 transition-transform hover:scale-110">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
                </div>
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>

        {/* Overlay Panel */}
        <div className="absolute top-4 left-4 w-80 space-y-4">
          <Card className="bg-zinc-900/90 backdrop-blur border-zinc-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold text-white">Fleet Map</h1>
              <div className="flex bg-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${viewMode === "all" ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-300"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setViewMode("trips")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${viewMode === "trips" ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-300"}`}
                >
                  Trips
                </button>
                <button
                  onClick={() => setViewMode("staged")}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${viewMode === "staged" ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-300"}`}
                >
                  Staged
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Moving ({fleetLocations.filter(t => t.status === "in_transit" || t.status === "en_route_to_pickup").length})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Stopped ({fleetLocations.filter(t => t.status !== "in_transit" && t.status !== "en_route_to_pickup").length})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Staged ({stagedUnits.length})</span>
              </div>
            </div>
          </Card>

          {selectedItem && (
            <Card className="bg-zinc-900/90 backdrop-blur border-zinc-800 p-4 shadow-xl animate-in slide-in-from-left-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {selectedItem.type === "staged" ? (
                    <Warehouse className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Truck className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-semibold text-white">
                    {selectedItem.unitNumber || selectedItem.name}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Status</span>
                  <Chip tone={
                    selectedItem.status === "in_transit" ? "ok" : 
                    selectedItem.status === "Available" ? "brand" : "warn"
                  }>
                    {selectedItem.status}
                  </Chip>
                </div>
                
                {selectedItem.driverName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Driver</span>
                    <span className="text-zinc-200">{selectedItem.driverName}</span>
                  </div>
                )}

                {selectedItem.region && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Region</span>
                    <span className="text-zinc-200">{selectedItem.region}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Last Update</span>
                  <span className="text-zinc-200">
                    {selectedItem.lastUpdate || selectedItem.updated ? new Date(selectedItem.lastUpdate || selectedItem.updated).toLocaleTimeString() : "N/A"}
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-800">
                  <div className="flex items-start gap-2 text-xs text-zinc-400">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{selectedItem.location}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
