import React from 'react';
export const TabSelector = ({
  activeTab,
  setActiveTab
}) => {
  return <div className="inline-flex rounded-md overflow-hidden border border-gray-700">
      <button className={`px-4 py-2 text-sm font-medium ${activeTab === 'drivers' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`} onClick={() => setActiveTab('drivers')}>
        Drivers
      </button>
      <button className={`px-4 py-2 text-sm font-medium ${activeTab === 'units' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`} onClick={() => setActiveTab('units')}>
        Units
      </button>
    </div>;
};