"use client";

import { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Truck, MapPin, Navigation } from "lucide-react";

// Mock data for fleet - in a real app, this would come from your API


export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [fleetLocations, setFleetLocations] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const response = await fetch("/api/map/fleet");
        const data = await response.json();
        if (data.fleet) {
          setFleetLocations(data.fleet);
        }
      } catch (error) {
        console.error("Error fetching fleet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
    const interval = setInterval(fetchFleetData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

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
            {fleetLocations.map((truck) => (
              truck.lat && truck.lng ? (
                <AdvancedMarker
                  key={truck.id}
                  position={{ lat: truck.lat, lng: truck.lng }}
                  onClick={() => setSelectedTruck(truck)}
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
          </Map>
        </APIProvider>

        {/* Overlay Panel */}
        <div className="absolute top-4 left-4 w-80 space-y-4">
          <Card className="bg-zinc-900/90 backdrop-blur border-zinc-800 p-4 shadow-xl">
            <h1 className="text-lg font-semibold text-white mb-1">Fleet Map</h1>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Moving ({fleetLocations.filter(t => t.status === "in_transit" || t.status === "en_route_to_pickup").length})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Stopped ({fleetLocations.filter(t => t.status !== "in_transit" && t.status !== "en_route_to_pickup").length})</span>
              </div>
            </div>
          </Card>

          {selectedTruck && (
            <Card className="bg-zinc-900/90 backdrop-blur border-zinc-800 p-4 shadow-xl animate-in slide-in-from-left-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-white">{selectedTruck.unitNumber}</span>
                </div>
                <button 
                  onClick={() => setSelectedTruck(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Status</span>
                  <Chip tone={selectedTruck.status === "in_transit" ? "ok" : "warn"}>
                    {selectedTruck.status}
                  </Chip>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Driver</span>
                  <span className="text-zinc-200">{selectedTruck.driverName}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Last Update</span>
                  <span className="text-zinc-200">
                    {selectedTruck.lastUpdate ? new Date(selectedTruck.lastUpdate).toLocaleTimeString() : "N/A"}
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-800">
                  <div className="flex items-start gap-2 text-xs text-zinc-400">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{selectedTruck.location}</span>
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
