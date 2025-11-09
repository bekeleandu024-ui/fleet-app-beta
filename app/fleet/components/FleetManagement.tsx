import React, { useState } from 'react';
import { NavigationBar } from './NavigationBar';
import { AIInsights } from './AIInsights';
import { UnitsTable } from './UnitsTable';
import { DriversTable } from './DriversTable';
import { DriverDetailsModal } from './DriverDetailsModal';
import { InteractiveMap } from './InteractiveMap';
import { InfoCard } from './InfoCard';
export const FleetManagement = () => {
  const [activeTab, setActiveTab] = useState('units');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDriverForModal, setSelectedDriverForModal] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const handleViewDetails = driver => {
    setSelectedDriverForModal(driver);
  };
  const handleCloseModal = () => {
    setSelectedDriverForModal(null);
  };
  const handleSelectUnit = unitId => {
    setSelectedUnit(unitId);
  };
  const handleSelectDriver = driverId => {
    setSelectedDriver(driverId);
  };
  return <div className="min-h-screen bg-gray-900">
      <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="p-6 max-w-7xl mx-auto">
        <AIInsights />
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {activeTab === 'units' ? 'Fleet Units' : 'Fleet Drivers'}
          </h3>
          {activeTab === 'drivers' ? <DriversTable selectedDriver={selectedDriver} onSelectDriver={handleSelectDriver} onViewDetails={handleViewDetails} /> : <UnitsTable selectedUnit={selectedUnit} onSelectUnit={handleSelectUnit} />}
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Live Fleet Map & Status
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <InteractiveMap selectedUnit={selectedUnit} selectedDriver={selectedDriver} activeTab={activeTab} onSelectUnit={handleSelectUnit} />
            </div>
            <div className="lg:col-span-1">
              <InfoCard selectedUnit={selectedUnit} selectedDriver={selectedDriver} activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>
      {selectedDriverForModal && <DriverDetailsModal driver={selectedDriverForModal} onClose={handleCloseModal} />}
    </div>;
};