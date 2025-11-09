import { Clock, MapPin, Truck, Calendar, Flag } from 'lucide-react';
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
    <div className="fleet-info-card h-full flex flex-col p-6">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-[var(--color-fleet-text-primary)]">Unit {unit.id}</h3>
        <span className="status-pill status-pill--active">On Trip</span>
      </div>
      <div className="space-y-4 text-sm">
        <div className="flex items-start">
          <Clock className="h-5 w-5 mr-3 text-blue-400 mt-0.5" />
          <div>
            <p className="text-[10px] tracking-wide text-[var(--color-fleet-text-muted)] mb-1">Trip Started</p>
            <p className="text-[var(--color-fleet-text-primary)] font-medium">{mockTripData.tripStarted}</p>
          </div>
        </div>
        <div className="flex items-start">
          <Flag className="h-5 w-5 mr-3 text-blue-400 mt-0.5" />
          <div>
            <p className="text-[10px] tracking-wide text-[var(--color-fleet-text-muted)] mb-1">Origin</p>
            <p className="text-[var(--color-fleet-text-primary)] font-medium">{mockTripData.origin}</p>
          </div>
        </div>
        <div className="flex items-start">
          <Truck className="h-5 w-5 mr-3 text-blue-400 mt-0.5" />
          <div>
            <p className="text-[10px] tracking-wide text-[var(--color-fleet-text-muted)] mb-1">Next Destination</p>
            <p className="text-[var(--color-fleet-text-primary)] font-medium">{mockTripData.nextDestination}</p>
          </div>
        </div>
        <div className="flex items-start">
          <Calendar className="h-5 w-5 mr-3 text-blue-400 mt-0.5" />
          <div>
            <p className="text-[10px] tracking-wide text-[var(--color-fleet-text-muted)] mb-1">Projected End Date</p>
            <p className="text-[var(--color-fleet-text-primary)] font-medium">{mockTripData.projectedEndDate}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 bg-[var(--color-fleet-bg-tertiary)] rounded-lg p-4 border border-[var(--color-fleet-border)]">
        <p className="text-[10px] tracking-wide text-[var(--color-fleet-text-muted)] mb-1">Current Location</p>
        <div className="flex items-center">
          <MapPin className="h-5 w-5 mr-3 text-blue-400" />
          <p className="text-[var(--color-fleet-text-primary)] font-semibold text-base">{mockTripData.currentLocation}</p>
        </div>
      </div>
    </div>
  );
}