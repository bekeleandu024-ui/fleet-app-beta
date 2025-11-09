import React, { useEffect, useState, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl, Circle } from 'react-leaflet';
import { mockDrivers as driversData, mockUnits as unitsData } from '../mockData';
import { Layers, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
const locationCoordinates = {
  'Guelph, ON': [43.5448, -80.2482],
  'Windsor, ON': [42.3149, -83.0364],
  'Brampton, ON': [43.7315, -79.7624],
  'Toronto, ON': [43.6532, -79.3832],
  'Ottawa, ON': [45.4215, -75.6972],
  'Montreal, QC': [45.5017, -73.5673],
  'Quebec City, QC': [46.8139, -71.208],
  'Hamilton, ON': [43.2557, -79.8711],
  'London, ON': [42.9849, -81.2453],
  'Sarnia, ON': [42.9746, -82.4066],
  'Detroit, MI': [42.3314, -83.0458]
};
const createCustomIcon = (color: string, isSelected: boolean) => {
  const size = isSelected ? 32 : 24;
  const border = isSelected ? 4 : 3;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${border}px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: all 0.3s ease;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};
const MapController = ({
  selectedUnit,
  selectedDriver,
  activeTab
}) => {
  const map = useMap();
  useEffect(() => {
    let location = null;
    if (activeTab === 'units' && selectedUnit) {
      const unit = unitsData.find(u => u.id === selectedUnit);
      if (unit) {
        location = locationCoordinates[unit.location];
      }
    } else if (activeTab === 'drivers' && selectedDriver) {
      const driver = driversData.find(d => d.id === selectedDriver);
      if (driver) {
        location = locationCoordinates[driver.location];
      }
    }
    if (location) {
      map.setView(location, 11, {
        animate: true,
        duration: 1
      });
    }
  }, [selectedUnit, selectedDriver, activeTab, map]);
  return null;
};
export const InteractiveMap = ({
  selectedUnit,
  selectedDriver,
  activeTab,
  onSelectUnit
}) => {
  const [mapStyle, setMapStyle] = useState('dark');
  const [showTraffic, setShowTraffic] = useState(true);
  const getRoute = (origin: string, destination: string) => {
    const start = locationCoordinates[origin];
    const end = locationCoordinates[destination];
    if (start && end) {
      return [start, end];
    }
    return null;
  };
  return <div className="bg-gray-800 rounded-lg overflow-hidden relative shadow-xl" style={{
    height: '550px'
  }}>
      <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
        <button onClick={() => setMapStyle(mapStyle === 'dark' ? 'light' : 'dark')} className="bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-lg shadow-lg transition-all hover:scale-105" title="Toggle Map Style">
          <Layers className="h-5 w-5" />
        </button>
        <button onClick={() => setShowTraffic(!showTraffic)} className={`${showTraffic ? 'bg-blue-600' : 'bg-gray-900'} hover:bg-gray-800 text-white p-3 rounded-lg shadow-lg transition-all hover:scale-105`} title="Toggle Traffic Layer">
          <Navigation className="h-5 w-5" />
        </button>
      </div>
      <div className="absolute top-4 left-4 z-[1000] bg-gray-900 bg-opacity-90 rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-white">Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-white">Maintenance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-white">Route</span>
          </div>
        </div>
      </div>
      <MapContainer center={[43.6532, -79.3832]} zoom={7} style={{
      height: '100%',
      width: '100%'
    }} zoomControl={false}>
        <ZoomControl position="bottomright" />
        <TileLayer url={mapStyle === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        <MapController selectedUnit={selectedUnit} selectedDriver={selectedDriver} activeTab={activeTab} />
        {unitsData.map(unit => {
        const coords = locationCoordinates[unit.location as keyof typeof locationCoordinates];
        if (!coords) return null;
        const color = unit.status === 'active' ? '#10b981' : '#f59e0b';
        // FIX: match selected driver ID to unit's driver ID
        const selectedDriverObj = driversData.find(d => d.id === selectedDriver);
        const isSelected = 
          (activeTab === 'units' && selectedUnit === unit.id) || 
          (activeTab === 'drivers' && selectedDriverObj && unit.driverId === selectedDriverObj.id);
        const route = null; // Removed tripInfo as it doesn't exist in Unit type
        return <Fragment key={unit.id}>
              {showTraffic && isSelected && <Circle center={coords} radius={15000} pathOptions={{
            fillColor: color,
            fillOpacity: 0.1,
            color: color,
            weight: 2,
            opacity: 0.4
          }} />}
              <Marker position={coords} icon={createCustomIcon(color, !!isSelected)} eventHandlers={{
            click: () => onSelectUnit(unit.id)
          }}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-base mb-1">Unit {unit.id}</p>
                    <p className="text-gray-700">{unit.make} {unit.model}</p>
                    <p className="text-gray-700">Driver: {unit.driverName || 'Unassigned'}</p>
                    <p className="text-gray-700">
                      Status:{' '}
                      <span className="font-semibold">{unit.status}</span>
                    </p>
                    <p className="text-gray-700">Location: {unit.location}</p>
                  </div>
                </Popup>
              </Marker>
              {route && <Polyline positions={route} pathOptions={{
            color: '#3b82f6',
            weight: 4,
            opacity: isSelected ? 0.9 : 0.5,
            dashArray: '10, 10'
          }} />}
            </Fragment>;
      })}
      </MapContainer>
    </div>;
};