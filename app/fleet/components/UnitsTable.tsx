import React from 'react';
import { TruckIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { unitsData } from '../data/mockData';
export const UnitsTable = ({
  selectedUnit,
  onSelectUnit
}) => {
  return <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Mileage
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Last Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                AI Prediction
              </th>
            </tr>
          </thead>
          <tbody>
            {unitsData.map(unit => <tr key={unit.id} onClick={() => onSelectUnit(unit.id)} className={`border-b border-gray-700 cursor-pointer transition-colors ${selectedUnit === unit.id ? 'bg-blue-900 bg-opacity-30 border-l-4 border-l-blue-500' : 'hover:bg-gray-700'}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="bg-gray-700 p-2 rounded mr-3">
                      <TruckIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Unit {unit.id}</p>
                      <p className="text-xs text-gray-400">{unit.model}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={unit.status} />
                </td>
                <td className="px-4 py-4 text-white">{unit.driver}</td>
                <td className="px-4 py-4 text-gray-300">{unit.location}</td>
                <td className="px-4 py-4 text-white">
                  {unit.mileage.toLocaleString()} mi
                </td>
                <td className="px-4 py-4 text-gray-300">{unit.lastService}</td>
                <td className="px-4 py-4">
                  <div className="text-xs text-amber-400 max-w-xs">
                    {unit.aiPrediction}
                  </div>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};