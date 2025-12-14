"use client";

import { useState, useEffect, useMemo } from "react";
import { APIProvider, Map, Marker, useMap, useMapsLibrary, InfoWindow } from "@vis.gl/react-google-maps";
import { 
  Truck, 
  MapPin, 
  Warehouse, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  AlertTriangle,
  Layers,
  Maximize2,
  Minimize2,
  Navigation,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Constants & Types ---

const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Southern Ontario": { lat: 43.6532, lng: -79.3832 },
  "Greater Toronto Area": { lat: 43.7000, lng: -79.4000 },
  "GTA": { lat: 43.7000, lng: -79.4000 },
  "Eastern Ontario": { lat: 45.4215, lng: -75.6972 },
  "Northern Ontario": { lat: 46.4917, lng: -80.9930 },
  "Western Ontario": { lat: 42.9849, lng: -81.2453 },
  "South West": { lat: 42.9849, lng: -81.2453 },
  "Quebec": { lat: 45.5017, lng: -73.5673 },
  "Montreal": { lat: 45.5017, lng: -73.5673 },
};

type FleetItem = {
  id: string;
  type: "trip" | "staged";
  status: string;
  lat: number;
  lng: number;
  unitNumber?: string;
  name?: string;
  driverName?: string;
  location?: string;
  lastUpdate?: string;
  deliveryLocation?: { lat: number; lng: number };
  deliveryLat?: number;
  deliveryLng?: number;
  customs?: any;
  region?: string;
};

// --- Helper Components ---

function FleetMarker({ item, onClick }: { item: FleetItem, onClick: () => void }) {
  const map = useMap();
  const [icon, setIcon] = useState<google.maps.Symbol | undefined>(undefined);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps || !google.maps.Point) return;
    
    const color = item.type === "staged" ? "#3b82f6" : 
                  item.status === "in_transit" ? "#10b981" : 
                  "#f59e0b";

    setIcon({
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#ffffff",
      scale: 1.5,
      anchor: new google.maps.Point(12, 24),
    });
  }, [map, item.type, item.status]);

  if (!icon) return null;

  return (
    <Marker
      position={{ lat: item.lat, lng: item.lng }}
      onClick={onClick}
      icon={icon}
    />
  );
}

function Directions({ 
  origin, 
  destination,
  onRouteFound 
}: { 
  origin: { lat: number; lng: number }, 
  destination: { lat: number; lng: number } | string,
  onRouteFound?: (result: google.maps.DirectionsResult) => void
}) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    const ds = new routesLibrary.DirectionsService();
    const dr = new routesLibrary.DirectionsRenderer({ 
      map,
      suppressMarkers: true,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: "#10b981", // Emerald-500
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    setDirectionsService(ds);
    setDirectionsRenderer(dr);

    return () => {
      dr.setMap(null);
    };
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !google.maps) return;

    directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    }).then(response => {
      directionsRenderer.setDirections(response);
      if (onRouteFound) onRouteFound(response);
    }).catch(e => console.error("Directions request failed", e));
  }, [directionsService, directionsRenderer, origin, destination, onRouteFound]);

  return null;
}

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo(center);
    }
  }, [map, center]);
  return null;
}

// --- Main Page Component ---

export default function MapPage() {
  // State
  const [fleetLocations, setFleetLocations] = useState<FleetItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FleetItem | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 43.6532, lng: -79.3832 });
  const [viewMode, setViewMode] = useState<"all" | "trips" | "staged">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; eta: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mock Data Generation
  useEffect(() => {
    const generateMockData = () => {
      const items: FleetItem[] = [];
      
      // Active Trips
      for (let i = 0; i < 15; i++) {
        items.push({
          id: `trip-${i}`,
          type: "trip",
          status: Math.random() > 0.2 ? "in_transit" : "delayed",
          lat: 43.0 + Math.random() * 2,
          lng: -80.0 + Math.random() * 4,
          unitNumber: `TR-${1000 + i}`,
          driverName: ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"][i % 4],
          location: "Hwy 401 near London",
          lastUpdate: new Date().toISOString(),
          deliveryLat: 45.5017,
          deliveryLng: -73.5673,
        });
      }

      // Staged Units
      Object.entries(REGION_COORDINATES).forEach(([region, coords], idx) => {
        if (idx > 4) return; // Limit regions
        const count = Math.floor(Math.random() * 5) + 1;
        for (let j = 0; j < count; j++) {
          items.push({
            id: `staged-${region}-${j}`,
            type: "staged",
            status: "Available",
            lat: coords.lat + (Math.random() - 0.5) * 0.1,
            lng: coords.lng + (Math.random() - 0.5) * 0.1,
            unitNumber: `ST-${5000 + idx * 10 + j}`,
            region: region,
            location: `${region} Yard`,
            lastUpdate: new Date().toISOString(),
          });
        }
      });

      setFleetLocations(items);
    };

    generateMockData();
  }, []);

  // Filtering
  const filteredItems = useMemo(() => {
    return fleetLocations.filter(item => {
      const matchesMode = viewMode === "all" || 
        (viewMode === "trips" && item.type === "trip") || 
        (viewMode === "staged" && item.type === "staged");
      
      const matchesSearch = !searchQuery || 
        (item.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (item.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      return matchesMode && matchesSearch;
    });
  }, [fleetLocations, viewMode, searchQuery]);

  // Handlers
  const handleItemSelect = (item: FleetItem) => {
    setSelectedItem(item);
    setMapCenter({ lat: item.lat, lng: item.lng });
    setShowRoute(false);
    setRouteInfo(null);
    if (!isSidebarOpen) setIsSidebarOpen(true);
  };

  const handleRouteFound = (result: google.maps.DirectionsResult) => {
    if (result.routes[0] && result.routes[0].legs[0]) {
      const leg = result.routes[0].legs[0];
      setRouteInfo({
        distance: leg.distance?.text || "N/A",
        duration: leg.duration?.text || "N/A",
        eta: new Date(Date.now() + (leg.duration?.value || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  };



  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-zinc-950 border border-zinc-800 rounded-lg shadow-sm">
      
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? "w-80" : "w-0"} flex flex-col border-r border-zinc-800 bg-zinc-900/50 transition-all duration-300 overflow-hidden relative`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              Fleet Assets
            </h2>
            <div className="flex items-center gap-2">
               <span className="text-xs font-mono text-zinc-500">{filteredItems.length} Units</span>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search unit or driver..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-sm border border-zinc-800 bg-black pl-8 pr-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
            <div className="flex gap-1 p-1 bg-black rounded-md border border-zinc-800">
              {(["all", "trips", "staged"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 px-2 py-1 text-[10px] font-medium rounded-sm transition-colors uppercase ${
                    viewMode === mode 
                      ? "bg-zinc-800 text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Asset List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-zinc-800/50">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className={`p-3 cursor-pointer transition-colors hover:bg-zinc-800/50 ${
                  selectedItem?.id === item.id ? "bg-blue-900/10 border-l-2 border-blue-500" : "border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {item.type === "trip" ? (
                      <Truck className={`h-3.5 w-3.5 ${item.status === "in_transit" ? "text-emerald-500" : "text-amber-500"}`} />
                    ) : (
                      <Warehouse className="h-3.5 w-3.5 text-blue-500" />
                    )}
                    <span className="text-xs font-bold text-zinc-200">{item.unitNumber}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${
                    item.status === "in_transit" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    item.status === "Available" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 ml-5">
                  {item.driverName && (
                    <span className="text-[11px] text-zinc-400">{item.driverName}</span>
                  )}
                  <span className="text-[10px] text-zinc-600 truncate">{item.location}</span>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No assets found matching filters.
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Selected Item Details Panel (Bottom of Sidebar) */}
        {selectedItem && (
          <div className="border-t border-zinc-800 bg-zinc-900 p-4 animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Selected Asset</h3>
              <button onClick={() => setSelectedItem(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-black border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Unit</div>
                  <div className="text-sm font-mono text-zinc-200">{selectedItem.unitNumber}</div>
                </div>
                <div className="p-2 rounded bg-black border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">Type</div>
                  <div className="text-sm text-zinc-200 capitalize">{selectedItem.type}</div>
                </div>
              </div>

              {selectedItem.type === "trip" && (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="subtle"
                    className={`w-full h-8 text-xs justify-between ${showRoute ? "bg-emerald-900/20 border-emerald-800 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-300"}`}
                    onClick={() => setShowRoute(!showRoute)}
                  >
                    <span>{showRoute ? "Hide Route" : "Show Route"}</span>
                    <Navigation className="h-3 w-3" />
                  </Button>
                  
                  {showRoute && routeInfo && (
                    <div className="grid grid-cols-3 gap-1 text-center p-2 rounded bg-emerald-950/30 border border-emerald-900/50">
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase">Dist</div>
                        <div className="text-xs font-bold text-emerald-400">{routeInfo.distance}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase">Time</div>
                        <div className="text-xs font-bold text-emerald-400">{routeInfo.duration}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase">ETA</div>
                        <div className="text-xs font-bold text-emerald-400">{routeInfo.eta}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-zinc-900">
        {/* Sidebar Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-10 p-2 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white shadow-lg backdrop-blur-sm"
        >
          {isSidebarOpen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        {/* Stats Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-px rounded-md border border-zinc-800 bg-zinc-900/90 shadow-xl backdrop-blur-sm overflow-hidden">
          <div className="px-3 py-1.5 border-r border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase mr-2">Total</span>
            <span className="text-xs font-bold text-white">{fleetLocations.length}</span>
          </div>
          <div className="px-3 py-1.5 border-r border-zinc-800">
            <span className="text-[10px] text-zinc-500 uppercase mr-2">Active</span>
            <span className="text-xs font-bold text-emerald-400">
              {fleetLocations.filter(i => i.type === "trip" && i.status === "in_transit").length}
            </span>
          </div>
          <div className="px-3 py-1.5">
            <span className="text-[10px] text-zinc-500 uppercase mr-2">Staged</span>
            <span className="text-xs font-bold text-blue-400">
              {fleetLocations.filter(i => i.type === "staged").length}
            </span>
          </div>
        </div>

        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
          <Map
            zoom={7}
            center={mapCenter}
            mapId="fleet-map-dark"
            disableDefaultUI={true}
            className="w-full h-full"
            styles={[
              { elementType: "geometry", stylers: [{ color: "#18181b" }] }, // zinc-950
              { elementType: "labels.text.stroke", stylers: [{ color: "#18181b" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] }, // zinc-400
              {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#e4e4e7" }], // zinc-200
              },
              {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#71717a" }], // zinc-500
              },
              {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#27272a" }], // zinc-800
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#3f3f46" }], // zinc-700
              },
              {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#27272a" }], // zinc-800
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#52525b" }], // zinc-600
              },
              {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#27272a" }], // zinc-800
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#09090b" }], // zinc-950 (darker)
              },
              {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#52525b" }], // zinc-600
              },
            ]}
          >
            <MapUpdater center={mapCenter} />
            
            {/* Route Rendering */}
            {selectedItem && showRoute && selectedItem.type === "trip" && selectedItem.status === "in_transit" && 
             (selectedItem.deliveryLocation || (selectedItem.deliveryLat && selectedItem.deliveryLng)) && 
             selectedItem.lat && selectedItem.lng && (
               <Directions 
                 origin={{ lat: selectedItem.lat, lng: selectedItem.lng }}
                 destination={
                   (selectedItem.deliveryLat && selectedItem.deliveryLng) 
                     ? { lat: selectedItem.deliveryLat, lng: selectedItem.deliveryLng }
                     : selectedItem.deliveryLocation!
                 }
                 onRouteFound={handleRouteFound}
               />
            )}
            
            {/* Markers */}
            {filteredItems.map((item) => (
              item.lat && item.lng ? (
                <FleetMarker
                  key={item.id}
                  item={item}
                  onClick={() => handleItemSelect(item)}
                />
              ) : null
            ))}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
