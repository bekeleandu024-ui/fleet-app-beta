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
  X,
  Package
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { fetchFleetLocations, fetchOrders } from "@/lib/api";
import { OrderListItem } from "@/lib/types";

// --- Constants & Types ---

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
  deliveryLocation?: { lat: number; lng: number } | string;
  deliveryLat?: number;
  deliveryLng?: number;
  customs?: any;
  region?: string;
  currentWeight?: number;
  maxWeight?: number;
  utilizationPercent?: number;
  limitingFactor?: string;
};

// --- Helper Components ---

// Standard Map Pin Path
const PIN_SVG_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

function FleetMarker({ item, onClick, isDimmed, isSelected }: { item: FleetItem, onClick: (pos: { lat: number; lng: number }) => void, isDimmed?: boolean, isSelected?: boolean }) {
  const map = useMap();
  const geocodingLib = useMapsLibrary("geocoding");
  const [icon, setIcon] = useState<google.maps.Symbol | undefined>(undefined);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    item.lat !== 0 && item.lng !== 0 ? { lat: item.lat, lng: item.lng } : null
  );
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (item.lat !== 0 && item.lng !== 0) {
      setPosition({ lat: item.lat, lng: item.lng });
    } else if (item.location && geocodingLib) {
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ address: item.location }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          setPosition({ lat: loc.lat(), lng: loc.lng() });
        }
      });
    }
  }, [item.lat, item.lng, item.location, geocodingLib]);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps || !google.maps.Point) return;
    
    // Standard Pin Colors
    let color = "#64748B"; // Slate-500 (Idle/Available)
    
    if (item.status === "in_transit" || item.status === "departed_pickup") {
      color = "#3B82F6"; // Blue-500 (Active)
    } else if (item.status === "at_pickup" || item.status === "at_delivery") {
      color = "#8B5CF6"; // Violet-500
    } else if (item.status === "delayed") {
      color = "#EF4444"; // Red-500
    } else if (item.status === "Available" || item.status === "staged") {
      color = "#10B981"; // Emerald-500
    }

    setIcon({
      path: PIN_SVG_PATH,
      fillColor: color,
      fillOpacity: isDimmed ? 0.5 : 1,
      strokeWeight: 1,
      strokeColor: "#ffffff",
      scale: isSelected ? 2 : (isHovered ? 1.8 : 1.5),
      anchor: new google.maps.Point(12, 24),
    });
  }, [map, item.status, isDimmed, isSelected, isHovered]);

  if (!icon || !position) return null;

  return (
    <>
      <Marker
        position={position}
        onClick={() => onClick(position)}
        onMouseOver={() => setIsHovered(true)}
        onMouseOut={() => setIsHovered(false)}
        icon={icon}
        zIndex={isSelected ? 100 : (isHovered ? 90 : 10)}
        label={isSelected || isHovered ? {
            text: item.unitNumber || "",
            color: "white",
            fontSize: "11px",
            fontWeight: "bold",
            className: "bg-black/70 px-1.5 py-0.5 rounded mt-8"
        } : undefined}
      />
    </>
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
        strokeColor: "#3B82F6", // Blue-500
        strokeWeight: 4,
        strokeOpacity: 0.8,
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
  }, [directionsService, directionsRenderer, JSON.stringify(origin), JSON.stringify(destination)]); // Removed onRouteFound from deps to avoid loop

  return null;
}

function MapController({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      const current = map.getCenter();
      if (!current) return;
      
      const latDiff = Math.abs(current.lat() - center.lat);
      const lngDiff = Math.abs(current.lng() - center.lng);
      
      // Only pan if difference is significant to avoid fighting with user drag
      if (latDiff > 0.0001 || lngDiff > 0.0001) {
        map.panTo(center);
      }
    }
  }, [map, center]);
  
  return null;
}

function DestinationMarker({ position }: { position: { lat: number; lng: number } }) {
  const [icon, setIcon] = useState<google.maps.Symbol | undefined>(undefined);

  useEffect(() => {
    if (typeof google === 'undefined' || !google.maps || !google.maps.Point) return;

    // Standard Red Pin for Destination
    setIcon({
      path: PIN_SVG_PATH,
      fillColor: "#EF4444", // Red-500
      fillOpacity: 1,
      strokeWeight: 1,
      strokeColor: "#ffffff",
      scale: 1.5,
      anchor: new google.maps.Point(12, 24),
    });
  }, []);

  if (!icon) return null;

  return (
    <Marker
      position={position}
      icon={icon}
      zIndex={100}
    />
  );
}

function OrderMarker({ order, type }: { order: OrderListItem, type: "pickup" | "delivery" }) {
  const geocodingLib = useMapsLibrary("geocoding");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [icon, setIcon] = useState<google.maps.Symbol | undefined>(undefined);

  const address = type === "pickup" ? order.pickup : order.delivery;

  useEffect(() => {
    if (address && geocodingLib) {
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          setPosition({ lat: loc.lat(), lng: loc.lng() });
        }
      });
    }
  }, [address, geocodingLib]);

  useEffect(() => {
      if (typeof google === 'undefined' || !google.maps) return;
      
      // Standard Pins for Orders
      if (type === "pickup") {
        setIcon({
            path: PIN_SVG_PATH,
            fillColor: "#10B981", // Emerald-500 (Green)
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#ffffff",
            scale: 1.5,
            anchor: new google.maps.Point(12, 24),
        });
      } else {
        setIcon({
            path: PIN_SVG_PATH,
            fillColor: "#EF4444", // Red-500
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#ffffff",
            scale: 1.5,
            anchor: new google.maps.Point(12, 24),
        });
      }
  }, [type]);

  if (!position || !icon) return null;

  return (
    <>
        <Marker
            position={position}
            icon={icon}
            onMouseOver={() => setIsHovered(true)}
            onMouseOut={() => setIsHovered(false)}
            zIndex={20}
        />
        {isHovered && (
            <InfoWindow
                position={position}
                pixelOffset={[0, -30]}
                headerContent={
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${type === "pickup" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="font-bold text-black">
                            {order.orderNumber || order.reference} ({type === "pickup" ? "Pickup" : "Delivery"})
                        </span>
                    </div>
                }
            >
                <div className="text-xs text-zinc-800 min-w-[150px]">
                    <div className="font-semibold mb-1">{order.customer}</div>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-zinc-500">Loc:</span> {address}
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                        order.status === 'New' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        order.status === 'In Transit' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                        {order.status}
                    </span>
                </div>
            </InfoWindow>
        )}
    </>
  );
}

// --- Main Page Component ---

export default function MapPage() {
  // State
  const [fleetLocations, setFleetLocations] = useState<FleetItem[]>([]);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FleetItem | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 43.6532, lng: -79.3832 });
  const [zoom, setZoom] = useState(7);
  const [viewMode, setViewMode] = useState<"all" | "trips" | "staged">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | "all">("all");
  const [showRoute, setShowRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; eta: string } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data Fetching
  useEffect(() => {
    const loadFleetData = async () => {
      try {
        const response = await fetchFleetLocations();
        const items: FleetItem[] = response.fleet.map((item) => ({
          id: item.id,
          type: item.status === 'staged' ? "staged" : "trip",
          status: item.status,
          lat: item.lat || 0,
          lng: item.lng || 0,
          unitNumber: item.unitNumber || undefined,
          driverName: item.driverName || undefined,
          location: item.location || undefined,
          lastUpdate: item.lastUpdate || undefined,
          deliveryLocation: item.deliveryLocation || undefined,
          deliveryLat: item.deliveryLat || undefined,
          deliveryLng: item.deliveryLng || undefined,
          customs: item.customs,
          region: item.region,
          currentWeight: item.currentWeight,
          maxWeight: item.maxWeight,
          utilizationPercent: item.utilizationPercent,
          limitingFactor: item.limitingFactor,
        }));

        setFleetLocations(items);
      } catch (error) {
        console.error("Failed to load fleet data", error);
      }
    };

    const loadOrders = async () => {
      try {
        const response = await fetchOrders();
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to load orders", error);
      }
    };

    loadFleetData();
    loadOrders();
  }, []);

  const regions = useMemo(() => {
    const uniqueRegions = new Set(fleetLocations.map(item => item.region).filter(Boolean));
    return Array.from(uniqueRegions).sort() as string[];
  }, [fleetLocations]);

  // Filtering
  const filteredItems = useMemo(() => {
    return fleetLocations.filter(item => {
      const matchesMode = viewMode === "all" || 
        (viewMode === "trips" && item.type === "trip") || 
        (viewMode === "staged" && item.type === "staged");
      
      const matchesSearch = !searchQuery || 
        (item.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (item.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesRegion = selectedRegion === "all" || item.region === selectedRegion;

      return matchesMode && matchesSearch && matchesRegion;
    });
  }, [fleetLocations, viewMode, searchQuery, selectedRegion]);

  // Handlers
  const handleItemSelect = (item: FleetItem, pos?: { lat: number; lng: number }) => {
    // Set initial state to show the panel immediately
    setSelectedItem(item);
    setShowRoute(false);
    setRouteInfo(null);
    setDestinationCoords(null);
    if (!isSidebarOpen) setIsSidebarOpen(true);

    let targetPos = pos;
    if (!targetPos && item.lat !== 0 && item.lng !== 0) {
      targetPos = { lat: item.lat, lng: item.lng };
    }

    if (targetPos) {
      setMapCenter(targetPos);
      setZoom(15);
      // Ensure selected item has the coords
      setSelectedItem({ ...item, lat: targetPos.lat, lng: targetPos.lng });
    } else if (item.location && typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
      // Geocode if we don't have coords but have a location string
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: item.location }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          const newPos = { lat: loc.lat(), lng: loc.lng() };
          // Update selected item with resolved coords if it's still the selected item
          setSelectedItem(prev => prev && prev.id === item.id ? { ...prev, lat: newPos.lat, lng: newPos.lng } : prev);
          setMapCenter(newPos);
          setZoom(15);
        }
      });
    }
  };

  const handleRouteFound = (result: google.maps.DirectionsResult) => {
    if (result.routes[0] && result.routes[0].legs[0]) {
      const leg = result.routes[0].legs[0];
      setRouteInfo({
        distance: leg.distance?.text || "N/A",
        duration: leg.duration?.text || "N/A",
        eta: new Date(Date.now() + (leg.duration?.value || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      if (leg.end_location) {
        setDestinationCoords({ lat: leg.end_location.lat(), lng: leg.end_location.lng() });
      }
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

            {/* Region Filter */}
            {regions.length > 0 && (
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="h-8 w-full rounded-sm border border-zinc-800 bg-black px-3 text-xs text-zinc-200 focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-900 appearance-none"
                >
                  <option value="all">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500 rotate-90 pointer-events-none" />
              </div>
            )}
            
            {/* Order Toggle */}
            <button
                onClick={() => setShowOrders(!showOrders)}
                className={`w-full flex items-center justify-center gap-2 px-2 py-1.5 text-[10px] font-medium rounded-sm transition-colors uppercase border ${
                    showOrders 
                        ? "bg-violet-900/20 border-violet-800 text-violet-400" 
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                }`}
            >
                <Package className="h-3 w-3" />
                {showOrders ? "Hide Orders" : "Show Orders"}
            </button>
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
              <button onClick={() => {
                setSelectedItem(null);
                setZoom(7);
              }} className="text-zinc-500 hover:text-zinc-300">
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-black border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">Driver</div>
                      <div className="text-xs text-zinc-200 truncate">{selectedItem.driverName || "Unassigned"}</div>
                    </div>
                    <div className="p-2 rounded bg-black border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">Status</div>
                      <div className="text-xs text-zinc-200 capitalize">{selectedItem.status.replace(/_/g, " ")}</div>
                    </div>
                  </div>
                  
                  <div className="p-2 rounded bg-black border border-zinc-800">
                    <div className="text-[10px] text-zinc-500">Current Location</div>
                    <div className="text-xs text-zinc-200 truncate">{selectedItem.location || "Unknown"}</div>
                  </div>

                  {(selectedItem.utilizationPercent !== undefined) && (
                    <div className="p-2 rounded bg-black border border-zinc-800">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-[10px] text-zinc-500">Capacity</div>
                        <div className="text-[10px] font-bold text-zinc-300">{Math.round(selectedItem.utilizationPercent)}%</div>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-1">
                        <div 
                          className={`h-1.5 rounded-full ${
                            selectedItem.utilizationPercent > 90 ? 'bg-orange-500' : 
                            selectedItem.utilizationPercent > 70 ? 'bg-yellow-500' : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${Math.min(100, selectedItem.utilizationPercent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-500">
                        <span>{selectedItem.currentWeight?.toLocaleString()} lbs</span>
                        <span>{selectedItem.limitingFactor ? `Limit: ${selectedItem.limitingFactor}` : ''}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="subtle"
                      className={`flex-1 h-8 text-xs justify-between ${showRoute ? "bg-cyan-900/20 border-cyan-800 text-cyan-400" : "bg-zinc-800 border-zinc-700 text-zinc-300"}`}
                      onClick={() => setShowRoute(!showRoute)}
                    >
                      <span>{showRoute ? "Hide Route" : "Show Route"}</span>
                      <Navigation className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="subtle"
                      className={`flex-1 h-8 text-xs justify-between ${showOrders ? "bg-violet-900/20 border-violet-800 text-violet-400" : "bg-zinc-800 border-zinc-700 text-zinc-300"}`}
                      onClick={() => setShowOrders(!showOrders)}
                    >
                      <span>{showOrders ? "Hide Orders" : "Show Orders"}</span>
                      <Package className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {showRoute && routeInfo && (
                    <div className="grid grid-cols-3 gap-1 text-center p-2 rounded bg-cyan-950/30 border border-cyan-900/50">
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase">Dist</div>
                        <div className="text-xs font-bold text-cyan-400">{routeInfo.distance}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase">Time</div>
                        <div className="text-xs font-bold text-cyan-400">{routeInfo.duration}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase">ETA</div>
                        <div className="text-xs font-bold text-cyan-400">{routeInfo.eta}</div>
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
            defaultZoom={7}
            defaultCenter={mapCenter}
            zoom={zoom}
            onZoomChanged={(ev) => setZoom(ev.detail.zoom)}
            onCenterChanged={(ev) => setMapCenter(ev.detail.center)}
            disableDefaultUI={false}
            zoomControl={true}
            mapTypeControl={false}
            scaleControl={false}
            streetViewControl={false}
            rotateControl={false}
            fullscreenControl={true}
            gestureHandling={'greedy'}
            minZoom={4}
            maxZoom={18}
            restriction={{
              latLngBounds: {
                north: 85,
                south: -85,
                west: -180,
                east: 180
              }
            }}
            className="w-full h-full"
          >
            <MapController center={mapCenter} />
            
            {/* Route Rendering */}
            {selectedItem && showRoute && selectedItem.type === "trip" && 
             (selectedItem.deliveryLocation || (selectedItem.deliveryLat && selectedItem.deliveryLng)) && 
             (selectedItem.lat !== 0 || selectedItem.lng !== 0) && (
               <>
                 <Directions 
                   origin={{ lat: selectedItem.lat, lng: selectedItem.lng }}
                   destination={
                     (selectedItem.deliveryLat && selectedItem.deliveryLng) 
                       ? { lat: selectedItem.deliveryLat, lng: selectedItem.deliveryLng }
                       : selectedItem.deliveryLocation!
                   }
                   onRouteFound={handleRouteFound}
                 />
                 {destinationCoords && <DestinationMarker position={destinationCoords} />}
               </>
            )}

            {/* Order Markers */}
            {showOrders && orders.flatMap((order) => [
                <OrderMarker 
                    key={`${order.id}-pickup`} 
                    order={order} 
                    type="pickup"
                />,
                <OrderMarker 
                    key={`${order.id}-delivery`} 
                    order={order} 
                    type="delivery"
                />
            ])}
            
            {/* Markers */}
            {filteredItems.map((item) => {
              const isSelected = selectedItem ? item.id === selectedItem.id : false;
              const isDimmed = selectedItem ? !isSelected : false;
              return (item.lat && item.lng) || item.location ? (
                <FleetMarker
                  key={item.id}
                  item={item}
                  onClick={(pos) => handleItemSelect(item, pos)}
                  isDimmed={isDimmed}
                  isSelected={isSelected}
                />
              ) : null;
            })}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
