import React, { useState } from 'react';
import { XIcon, UserIcon, BarChartIcon, ClockIcon } from 'lucide-react';
export const DriverDetailsModal = ({
  driver,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg w-full max-w-2xl overflow-hidden relative">
        <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={onClose}>
          <XIcon className="h-5 w-5" />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">Driver Details</h2>
          <p className="text-gray-400 text-sm">
            Comprehensive overview for {driver.name}.
          </p>
          <div className="flex border-b border-gray-700 mt-4">
            <button className={`flex items-center px-4 py-2 mr-2 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-gray-300'}`} onClick={() => setActiveTab('profile')}>
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </button>
            <button className={`flex items-center px-4 py-2 mr-2 ${activeTab === 'performance' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-gray-300'}`} onClick={() => setActiveTab('performance')}>
              <BarChartIcon className="h-4 w-4 mr-2" />
              Performance
            </button>
            <button className={`flex items-center px-4 py-2 mr-2 ${activeTab === 'hos' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400 hover:text-gray-300'}`} onClick={() => setActiveTab('hos')}>
              <ClockIcon className="h-4 w-4 mr-2" />
              HOS Tracking
            </button>
          </div>
          <div className="mt-6">
            {activeTab === 'profile' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm">License:</p>
                    <p className="font-medium">AZ-654321</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm">Expires:</p>
                    <p className="font-medium">2025-10-20</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm">Certs:</p>
                    <p className="font-medium">Doubles/Triples</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Pay:</p>
                    <p className="font-medium">25% of revenue</p>
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="mb-4">
                    <p className="text-blue-400 font-medium mb-2">
                      AI Insight:
                    </p>
                    <p className="text-sm">Top performer in Zone 2</p>
                  </div>
                </div>
              </div>}
            {activeTab === 'performance' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm">Weekly Revenue:</p>
                    <p className="font-medium">$5,200</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm">Fuel Efficiency:</p>
                    <p className="font-medium">7.2 MPG</p>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm">Cost Per Mile:</p>
                    <p className="font-medium">$1.98</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm">On-Time %:</p>
                    <p className="font-medium">99%</p>
                  </div>
                </div>
                <div className="md:col-span-2 bg-gray-800 p-4 rounded-lg">
                  <p className="text-blue-400 font-medium mb-2">AI Insights:</p>
                  <p className="text-sm">
                    CPM is 5% better than fleet average. Recommend coaching on
                    hard braking events.
                  </p>
                </div>
              </div>}
            {activeTab === 'hos' && <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Drive Time:</p>
                      <p className="font-medium">4h 30m</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Cycle Time:</p>
                      <p className="font-medium">32h 10m</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-900 bg-opacity-30 p-4 rounded-lg border border-amber-700">
                  <p className="text-amber-500 font-medium mb-1">
                    AI Prediction:
                  </p>
                  <p className="text-sm text-amber-400">
                    Potential violation in 48h
                  </p>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </div>;
};