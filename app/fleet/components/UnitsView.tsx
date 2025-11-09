'use client';

import { useState } from 'react';
import { AIInsights } from './AIInsights';
import { InteractiveMap } from './InteractiveMap';
import { UnitsTable } from './UnitsTable';
import { mockUnits, mockDrivers } from '../mockData';
import { UnitDetails } from './UnitDetails';
import { Unit } from '../types';

export function UnitsView() {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(mockUnits[0].id);

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnit(unitId);
  };

  const unitData = mockUnits.find((u) => u.id === selectedUnit);

  return (
    <div className="space-y-6">
      <AIInsights />
      <div className="bg-gray-800/40 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Fleet Units</h3>
        <UnitsTable units={mockUnits} selectedUnit={selectedUnit} onSelectUnit={handleSelectUnit} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800/40 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Live Fleet Map & Status</h3>
          <InteractiveMap units={mockUnits} drivers={mockDrivers} selectedUnitId={selectedUnit} onSelectUnit={handleSelectUnit} />
        </div>
        <div className="bg-gray-800/40 rounded-lg p-4">
          {unitData && <UnitDetails unit={unitData} />}
        </div>
      </div>
    </div>
  );
}
