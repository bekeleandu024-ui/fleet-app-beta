'use client';

import { useState } from 'react';
import { AIInsights } from './AIInsights';
import { InteractiveMap } from './InteractiveMap';
import { UnitsTable } from './UnitsTable';
import { DriversTable } from './DriversTable';
import { mockUnits, mockDrivers } from '../mockData';
import { UnitDetails } from './UnitDetails';
import { Unit } from '../types';

export function UnitsView() {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(mockUnits[0].id);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'units' | 'drivers'>('units');

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnit(unitId);
  };

  const unitData = mockUnits.find((u) => u.id === selectedUnit);
  const driverData = mockDrivers.find((d) => d.id === selectedDriver);

  return (
    <div className="space-y-6">
      <AIInsights />
      <div className="flex items-center justify-end">
        <div className="inline-flex rounded-md overflow-hidden border border-[var(--color-fleet-border)]">
          <button
            onClick={() => setViewMode('units')}
            className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors ${viewMode === 'units' ? 'bg-[var(--color-fleet-bg-tertiary)] text-[var(--color-fleet-text-primary)]' : 'bg-[var(--color-fleet-bg-secondary)] text-[var(--color-fleet-text-secondary)] hover:text-[var(--color-fleet-text-primary)]'}`}
          >Units</button>
          <button
            onClick={() => setViewMode('drivers')}
            className={`px-4 py-2 text-xs font-medium tracking-wide transition-colors border-l border-[var(--color-fleet-border)] ${viewMode === 'drivers' ? 'bg-[var(--color-fleet-bg-tertiary)] text-[var(--color-fleet-text-primary)]' : 'bg-[var(--color-fleet-bg-secondary)] text-[var(--color-fleet-text-secondary)] hover:text-[var(--color-fleet-text-primary)]'}`}
          >Drivers</button>
        </div>
      </div>
      <div className="panel p-4">
        <h3 className="text-lg font-semibold text-[var(--color-fleet-text-primary)] mb-4">{viewMode === 'units' ? 'Fleet Units' : 'Drivers'}</h3>
        {viewMode === 'units' ? (
          <UnitsTable units={mockUnits} selectedUnit={selectedUnit} onSelectUnit={handleSelectUnit} />
        ) : (
          <DriversTable
            selectedDriver={selectedDriver}
            onSelectDriver={(id: string) => setSelectedDriver(id)}
            onViewDetails={() => {}}
          />
        )}
      </div>
      {viewMode === 'units' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 panel p-4">
            <h3 className="text-lg font-semibold text-[var(--color-fleet-text-primary)] mb-4">Live Fleet Map & Status</h3>
            <div className="fleet-map-container overflow-hidden rounded-lg">
              <InteractiveMap units={mockUnits} drivers={mockDrivers} selectedUnitId={selectedUnit} onSelectUnit={handleSelectUnit} />
            </div>
          </div>
          <div>{unitData && <UnitDetails unit={unitData} />}</div>
        </div>
      )}
    </div>
  );
}
