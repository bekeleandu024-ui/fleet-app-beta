import { Truck } from 'lucide-react';
import { Unit } from '../types';

interface UnitsTableProps {
  units: Unit[];
  selectedUnit: string | null;
  onSelectUnit: (unitId: string) => void;
}

const statusClass = (status: 'active' | 'maintenance' | 'out-of-service') => {
  switch (status) {
    case 'active':
      return 'status-pill status-pill--active';
    case 'maintenance':
      return 'status-pill status-pill--maintenance';
    case 'out-of-service':
      return 'status-pill status-pill--out';
    default:
      return 'status-pill';
  }
};

export function UnitsTable({ units, selectedUnit, onSelectUnit }: UnitsTableProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--color-fleet-border)]">
      <div className="overflow-x-auto">
        <table className="fleet-table min-w-full divide-y divide-[var(--color-fleet-border)]">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-semibold tracking-wider text-[var(--color-fleet-text-secondary)] uppercase">Unit</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-semibold tracking-wider text-[var(--color-fleet-text-secondary)] uppercase">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-semibold tracking-wider text-[var(--color-fleet-text-secondary)] uppercase">Driver</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-semibold tracking-wider text-[var(--color-fleet-text-secondary)] uppercase">Location</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-semibold tracking-wider text-[var(--color-fleet-text-secondary)] uppercase">Mileage</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-semibold tracking-wider text-[var(--color-fleet-text-secondary)] uppercase">Last Service</th>
              <th scope="col" className="px-6 py-3 text-left text-[10px] font-semibold tracking-wider text-[var(--color-fleet-text-secondary)] uppercase">AI Prediction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-fleet-border)]">
            {units.map((unit) => (
              <tr 
                key={unit.id} 
                onClick={() => onSelectUnit(unit.id)}
                className={`cursor-pointer ${selectedUnit === unit.id ? 'is-selected' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--color-fleet-bg-tertiary)] border border-[var(--color-fleet-border)]">
                      <Truck className="h-6 w-6 text-[var(--color-fleet-text-secondary)]" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-[var(--color-fleet-text-primary)]">{unit.id}</div>
                      <div className="text-[11px] text-[var(--color-fleet-text-muted)]">{unit.model}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={statusClass(unit.status)}>{unit.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-fleet-text-primary)]">{unit.driverName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-fleet-text-primary)]">{unit.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-fleet-text-primary)]">{unit.mileage.toLocaleString()} mi</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-fleet-text-primary)]">{new Date(unit.lastService).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-300">{unit.aiMaintenancePredictor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}