// Mock data for Fleet & Driver Monitoring high-level placeholders
export interface FleetAsset {
  id: string;
  status: 'idle' | 'enroute' | 'maintenance' | 'delayed';
  location: string;
  etaMinutes?: number;
}

export interface DriverStatus {
  id: string;
  name: string;
  duty: 'on-duty' | 'off-duty' | 'driving' | 'rest-break';
  currentTrip?: string;
  violationsToday: number;
}

export interface AlertItem {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string; // ISO string
}

export const fleetAssets: FleetAsset[] = [
  { id: 'TRK-102', status: 'enroute', location: 'I-65 N / IN', etaMinutes: 45 },
  { id: 'TRK-215', status: 'idle', location: 'Chicago Yard' },
  { id: 'TRK-334', status: 'maintenance', location: 'Shop Bay 3' },
  { id: 'TRK-412', status: 'delayed', location: 'Gary IN', etaMinutes: 120 },
];

export const driverStatuses: DriverStatus[] = [
  { id: 'DRV-01', name: 'J. Carter', duty: 'driving', currentTrip: 'ORD → IND', violationsToday: 0 },
  { id: 'DRV-02', name: 'M. Singh', duty: 'on-duty', currentTrip: 'STL → ORD', violationsToday: 1 },
  { id: 'DRV-03', name: 'A. Lopez', duty: 'rest-break', currentTrip: 'KC → STL', violationsToday: 0 },
  { id: 'DRV-04', name: 'R. Chen', duty: 'off-duty', violationsToday: 0 },
];

export const alerts: AlertItem[] = [
  { id: 'AL-1', severity: 'critical', message: 'HOS violation risk: DRV-02 nearing limit', timestamp: new Date().toISOString() },
  { id: 'AL-2', severity: 'warning', message: 'Delay reported: TRK-412 arrival pushed +120m', timestamp: new Date(Date.now() - 5*60*1000).toISOString() },
  { id: 'AL-3', severity: 'info', message: 'New maintenance ticket opened for TRK-334', timestamp: new Date(Date.now() - 30*60*1000).toISOString() },
];

export const kpiSnapshot = {
  onTimePct: 92.4,
  utilizationPct: 76.1,
  avgDelayMin: 14,
  activeDrivers: driverStatuses.filter(d => d.duty !== 'off-duty').length,
};
