import React from 'react';
import { UserIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { driversData } from '../data/mockData';
export const DriversTable = ({
  selectedDriver,
  onSelectDriver,
  onViewDetails
}) => {
  return <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Assigned Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                On-Time %
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Avg. Margin
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                AI Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {driversData.map(driver => <tr key={driver.id} onClick={() => onSelectDriver(driver.id)} className={`border-b border-gray-700 cursor-pointer transition-colors ${selectedDriver === driver.id ? 'bg-blue-900 bg-opacity-30 border-l-4 border-l-blue-500' : 'hover:bg-gray-700'}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="bg-gray-700 rounded-full w-10 h-10 mr-3 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-xs text-gray-400">ID: {driver.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={driver.status} />
                </td>
                <td className="px-4 py-4 text-gray-300">{driver.location}</td>
                <td className="px-4 py-4 text-white">{driver.assignedUnit}</td>
                <td className="px-4 py-4 text-white">
                  {driver.onTimePercentage}%
                </td>
                <td className="px-4 py-4 text-white">{driver.avgMargin}%</td>
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="text-white font-medium mr-2">
                      {driver.aiScore}
                    </div>
                    <div className="text-xs text-gray-400">/100</div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <button onClick={e => {
                e.stopPropagation();
                onViewDetails(driver);
              }} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs">
                    View Details
                  </button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};