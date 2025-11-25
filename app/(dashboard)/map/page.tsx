"use client";

import { useState, useEffect, useMemo } from "react";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Truck, MapPin, Warehouse, Search, Filter, ChevronRight, Clock, AlertTriangle } from "lucide-react";
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

// Component to handle map camera updates
function MapUpdater({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
      map.setZoom(12);
    }
  }, [map, center]);

  return null;
}

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [fleetLocations, setFleetLocations] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"all" | "trips" | "staged">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

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

  // Combine and filter list items
  const listItems = useMemo(() => {
    let items: any[] = [];
    
    if (viewMode === "all" || viewMode === "trips") {
      items = [...items, ...fleetLocations.map(f => ({ ...f, type: "trip" }))];
    }
    
    if (viewMode === "all" || viewMode === "staged") {
      items = [...items, ...stagedUnits.map(s => ({ ...s, type: "staged" }))];
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => 
        (i.unitNumber || i.name || "").toLowerCase().includes(q) ||
        (i.driverName || "").toLowerCase().includes(q) ||
        (i.location || "").toLowerCase().includes(q)
      );
    }

    return items;
  }, [fleetLocations, stagedUnits, viewMode, searchQuery]);

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    if (item.lat && item.lng) {
      setMapCenter({ lat: item.lat, lng: item.lng });
    }
  };

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
    <div className="h-[calc(100vh-4rem)] flex bg-black overflow-hidden">
      {/* Left Sidebar Panel */}
      <div className="w-96 flex flex-col border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-sm z-10">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-semibold text-white mb-4">Fleet Overview</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
              <div className="text-xs text-zinc-400 uppercase tracking-wider">Moving</div>
              <div className="text-lg font-bold text-emerald-400">
                {fleetLocations.filter(t => t.status === "in_transit" || t.status === "en_route_to_pickup").length}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
              <div className="text-xs text-zinc-400 uppercase tracking-wider">Stopped</div>
              <div className="text-lg font-bold text-amber-400">
                {fleetLocations.filter(t => t.status !== "in_transit" && t.status !== "en_route_to_pickup").length}
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
              <div className="text-xs text-zinc-400 uppercase tracking-wider">Staged</div>
              <div className="text-lg font-bold text-blue-400">
                {stagedUnits.length}
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search units, drivers..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 pl-9 pr-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("all")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "all" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode("trips")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "trips" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Active Trips
              </button>
              <button
                onClick={() => setViewMode("staged")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "staged" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Staged
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {listItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemSelect(item)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedItem?.id === item.id
                  ? "bg-zinc-800 border-zinc-700 shadow-md"
                  : "bg-zinc-900/30 border-transparent hover:bg-zinc-800/50 hover:border-zinc-800"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.type === "staged" ? (
                    <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                      <Warehouse className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className={`p-1.5 rounded ${
                      item.status === "in_transit" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="font-medium text-zinc-200 text-sm">
                    {item.unitNumber || item.name}
                  </span>
                </div>
                <Chip tone={
                  item.status === "in_transit" ? "ok" : 
                  item.status === "Available" ? "brand" : "warn"
                } className="text-[10px] px-1.5 py-0.5 h-auto">
                  {item.status}
                </Chip>
              </div>

              <div className="space-y-1 pl-8">
                {item.driverName && (
                  <p className="text-xs text-zinc-400 truncate">{item.driverName}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{item.location || "Unknown Location"}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <Clock className="w-3 h-3" />
                  <span>
                    {item.lastUpdate ? new Date(item.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "No signal"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {listItems.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No units found matching your filters.
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
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
            <MapUpdater center={mapCenter} />
            
            {(viewMode === "all" || viewMode === "trips") && fleetLocations.map((truck) => (
              truck.lat && truck.lng ? (
                <AdvancedMarker
                  key={truck.id}
                  position={{ lat: truck.lat, lng: truck.lng }}
                  onClick={() => handleItemSelect(truck)}
                >
                  <div className="relative group">
                    <div className={`p-2 rounded-full border-2 ${
                      truck.status === "in_transit" || truck.status === "en_route_to_pickup"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                        : "bg-amber-500/20 border-amber-500 text-amber-400"
                    } transition-transform hover:scale-110 ${selectedItem?.id === truck.id ? "scale-125 ring-2 ring-white" : ""}`}>
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
                onClick={() => handleItemSelect(unit)}
              >
                <div className="relative group">
                  <div className={`p-2 rounded-full border-2 bg-blue-500/20 border-blue-500 text-blue-400 transition-transform hover:scale-110 ${selectedItem?.id === unit.id ? "scale-125 ring-2 ring-white" : ""}`}>
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
                </div>
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>

        {/* Floating Details Card (Only visible when item selected) */}
        {selectedItem && (
          <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 z-20">
            <Card className="bg-zinc-900/95 backdrop-blur border-zinc-800 p-4 shadow-2xl animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedItem.type === "staged" ? "bg-blue-500/20 text-blue-400" : 
                    selectedItem.status === "in_transit" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {selectedItem.type === "staged" ? <Warehouse className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{selectedItem.unitNumber || selectedItem.name}</h3>
                    <p className="text-xs text-zinc-400">{selectedItem.type === "staged" ? "Staged Unit" : "Active Trip"}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)} className="h-8 w-8 text-zinc-500 hover:text-white">
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                    <Chip tone={
                      selectedItem.status === "in_transit" ? "ok" : 
                      selectedItem.status === "Available" ? "brand" : "warn"
                    }>
                      {selectedItem.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Last Update</p>
                    <p className="text-sm text-zinc-300">
                      {selectedItem.lastUpdate ? new Date(selectedItem.lastUpdate).toLocaleTimeString() : "N/A"}
                    </p>
                  </div>
                </div>

                {selectedItem.driverName && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Driver</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400">
                        {selectedItem.driverName.charAt(0)}
                      </div>
                      <p className="text-sm text-zinc-200">{selectedItem.driverName}</p>
                    </div>
                  </div>
                )}

                <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">Current Location</p>
                      <p className="text-sm text-zinc-300 leading-snug">{selectedItem.location || "Unknown Location"}</p>
                      {selectedItem.lat && (
                        <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                          {selectedItem.lat.toFixed(4)}, {selectedItem.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedItem.type === "trip" && (
                  <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700" size="sm" asChild>
                    <a href={`/trips/${selectedItem.id}`}>View Trip Details <ChevronRight className="w-3 h-3 ml-1" /></a>
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
