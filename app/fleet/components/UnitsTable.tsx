import { Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Unit } from '../types';

interface UnitsTableProps {
  units: Unit[];
  selectedUnit: string | null;
  onSelectUnit: (unitId: string) => void;
}

const getStatusVariant = (status: 'active' | 'maintenance' | 'out-of-service'): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'active':
      return 'default';
    case 'maintenance':
      return 'secondary';
    case 'out-of-service':
      return 'destructive';
    default:
      return 'default';
  }
};

export function UnitsTable({ units, selectedUnit, onSelectUnit }: UnitsTableProps) {
  return (
    <div className="bg-gray-800/40 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800/60">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Unit</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Driver</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Mileage</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Service</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">AI Prediction</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800/40 divide-y divide-gray-700">
            {units.map((unit) => (
              <tr 
                key={unit.id} 
                onClick={() => onSelectUnit(unit.id)}
                className={`cursor-pointer transition-colors ${selectedUnit === unit.id ? 'bg-blue-600/20' : 'hover:bg-gray-700/40'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-700 rounded-lg">
                      <Truck className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{unit.id}</div>
                      <div className="text-xs text-gray-400">{unit.model}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStatusVariant(unit.status)}>{unit.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{unit.driverName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{unit.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{unit.mileage.toLocaleString()} mi</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{new Date(unit.lastService).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400">{unit.aiMaintenancePredictor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}