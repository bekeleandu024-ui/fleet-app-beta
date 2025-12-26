"use client";

import { useState, useEffect } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { MapIcon, Maximize2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchFleetLocations } from "@/lib/api";

type FleetItem = {
  id: string;
  type: "trip" | "staged";
  status: string;
  lat: number;
  lng: number;
  unitNumber?: string;
  driverName?: string;
};

const PIN_SVG_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

function FleetMarker({ item }: { item: FleetItem }) {
  const [icon, setIcon] = useState<google.maps.Symbol | undefined>(undefined);

  useEffect(() => {
    if (typeof google === 'undefined' || !google.maps) return;
    
    let color = "#64748B"; // Slate-500 (default)
    
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
      fillOpacity: 0.9,
      strokeColor: "#FFFFFF",
      strokeWeight: 1,
      scale: 0.8,
      anchor: new google.maps.Point(12, 24),
    });
  }, [item.status]);

  if (!item.lat || !item.lng || item.lat === 0 || item.lng === 0) return null;

  return (
    <Marker
      position={{ lat: item.lat, lng: item.lng }}
      icon={icon}
      title={item.unitNumber || item.driverName}
    />
  );
}

export function DashboardMap() {
  const [fleetLocations, setFleetLocations] = useState<FleetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter] = useState({ lat: 43.6532, lng: -79.3832 }); // Toronto area

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
        }));
        setFleetLocations(items);
      } catch (error) {
        console.error("Failed to load fleet data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFleetData();
    // Refresh every 30 seconds
    const interval = setInterval(loadFleetData, 30000);
    return () => clearInterval(interval);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey) {
    return (
      <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-zinc-500" />
            Live Network
          </h3>
          <Button variant="plain" size="sm" className="h-6 text-xs text-blue-400 hover:text-blue-300" asChild>
            <Link href="/map">Full Map</Link>
          </Button>
        </div>
        <div className="relative flex-1 bg-[#0B0E14]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6 rounded-lg bg-black/60 backdrop-blur-sm border border-zinc-800">
              <MapIcon className="mx-auto h-8 w-8 text-zinc-500 mb-2" />
              <p className="text-sm text-zinc-400">Configure Google Maps API key to enable map</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col min-h-[300px]">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <MapIcon className="h-4 w-4 text-zinc-500" />
          Live Network
          {!isLoading && (
            <span className="text-xs text-zinc-500">
              ({fleetLocations.filter(i => i.lat && i.lng && i.lat !== 0 && i.lng !== 0).length} units)
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span>At Stop</span>
            </div>
          </div>
          <Button variant="plain" size="sm" className="h-6 text-xs text-blue-400 hover:text-blue-300" asChild>
            <Link href="/map" className="flex items-center gap-1">
              <Maximize2 className="h-3 w-3" />
              Full Map
            </Link>
          </Button>
        </div>
      </div>
      <div className="relative flex-1">
        {isLoading ? (
          <div className="absolute inset-0 bg-[#0B0E14] flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="mx-auto h-8 w-8 text-zinc-500 mb-2 animate-pulse" />
              <p className="text-sm text-zinc-400">Loading fleet locations...</p>
            </div>
          </div>
        ) : (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultZoom={7}
              defaultCenter={mapCenter}
              disableDefaultUI={true}
              zoomControl={false}
              mapTypeControl={false}
              scaleControl={false}
              streetViewControl={false}
              rotateControl={false}
              fullscreenControl={false}
              gestureHandling={'none'}
              minZoom={4}
              maxZoom={18}
              className="w-full h-full"
              styles={[
                {
                  featureType: "all",
                  elementType: "labels",
                  stylers: [{ visibility: "simplified" }]
                }
              ]}
            >
              {fleetLocations.map((item) => (
                <FleetMarker key={item.id} item={item} />
              ))}
            </Map>
          </APIProvider>
        )}
      </div>
    </div>
  );
}
