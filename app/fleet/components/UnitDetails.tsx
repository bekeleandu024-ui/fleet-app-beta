import { Clock, MapPin, Truck, Calendar, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Unit } from '../types';

interface UnitDetailsProps {
  unit: Unit;
}

const mockTripData = {
  tripStarted: '2024-01-15 08:00 AM',
  origin: 'Guelph, ON',
  nextDestination: 'Windsor, ON',
  projectedEndDate: '2024-01-16 06:00 PM',
  currentLocation: 'Guelph, ON',
  status: 'On Trip',
};

export function UnitDetails({ unit }: UnitDetailsProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{unit.id}</h3>
        <Badge variant="default">{mockTripData.status}</Badge>
      </div>
      <div className="space-y-5 text-sm">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-3 text-gray-400" />
          <div>
            <p className="text-gray-400">Trip Started</p>
            <p className="text-white font-medium">{mockTripData.tripStarted}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Flag className="h-4 w-4 mr-3 text-gray-400" />
          <div>
            <p className="text-gray-400">Origin</p>
            <p className="text-white font-medium">{mockTripData.origin}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Truck className="h-4 w-4 mr-3 text-gray-400" />
          <div>
            <p className="text-gray-400">Next Destination</p>
            <p className="text-white font-medium">{mockTripData.nextDestination}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-3 text-gray-400" />
          <div>
            <p className="text-gray-400">Projected End Date</p>
            <p className="text-white font-medium">{mockTripData.projectedEndDate}</p>
          </div>
        </div>
      </div>
      <div className="mt-auto bg-gray-900/70 rounded-lg p-4">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-3 text-gray-400" />
          <div>
            <p className="text-gray-400">Current Location</p>
            <p className="text-white font-bold text-lg">{mockTripData.currentLocation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}