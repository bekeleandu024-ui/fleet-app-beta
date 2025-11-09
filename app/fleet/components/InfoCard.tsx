import React from 'react';
import { MapPinIcon, ClockIcon, CalendarIcon, TruckIcon } from 'lucide-react';
import { mockUnits as unitsData, mockDrivers as driversData } from '../mockData';
export const InfoCard = ({
  selectedUnit,
  selectedDriver,
  activeTab
}: any) => {
  let data = null;
  let title = '';
  if (activeTab === 'units' && selectedUnit) {
  data = unitsData.find((u: any) => u.id === selectedUnit);
    title = `Unit ${selectedUnit}`;
  } else if (activeTab === 'drivers' && selectedDriver) {
  data = driversData.find((d: any) => d.id === selectedDriver);
    title = data?.name || '';
  }
  if (!data) {
    return <div className="bg-gray-800 rounded-lg p-6 h-full flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          Select a {activeTab === 'units' ? 'unit' : 'driver'} to view details
        </p>
      </div>;
  }
  // For current mock data we don't have trip/station info; simulate based on status
  const isOnTrip = data.status === 'active';
  return <div className="bg-gray-800 rounded-lg p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${isOnTrip ? 'bg-green-900 bg-opacity-50 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
          {isOnTrip ? 'On Trip' : 'Stationed'}
        </span>
      </div>
      {isOnTrip ? (
        <div className="space-y-4">
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Trip Started</p>
              <p className="text-white font-medium">2024-01-15 08:00 AM</p>
            </div>
          </div>
          <div className="flex items-start">
            <MapPinIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Origin</p>
              <p className="text-white font-medium">{data.location}</p>
            </div>
          </div>
          <div className="flex items-start">
            <TruckIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Next Destination</p>
              <p className="text-white font-medium">Windsor, ON</p>
            </div>
          </div>
          <div className="flex items-start">
            <CalendarIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Projected End Date</p>
              <p className="text-white font-medium">2024-01-16 06:00 PM</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 mt-6">
            <p className="text-xs text-gray-400 mb-1">Current Location</p>
            <p className="text-white font-medium">{data.location}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Duration at Spot</p>
              <p className="text-white font-medium">18h 30m</p>
            </div>
          </div>
          <div className="flex items-start">
            <MapPinIcon className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Current Location</p>
              <p className="text-white font-medium">{data.location}</p>
            </div>
          </div>
          <div className="flex items-start">
            <CalendarIcon className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Last Activity</p>
              <p className="text-white font-medium">2024-01-15 11:00 PM</p>
            </div>
          </div>
          <div className="flex items-start">
            <TruckIcon className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 mb-1">Next Trip Booked</p>
              <p className="text-white font-medium">2024-01-16 09:00 AM</p>
            </div>
          </div>
          <div className="bg-amber-900 bg-opacity-20 rounded-lg p-4 mt-6 border border-amber-700">
            <p className="text-xs text-amber-400">
              Vehicle has been stationed for an extended period
            </p>
          </div>
        </div>
      )}
    </div>;
};