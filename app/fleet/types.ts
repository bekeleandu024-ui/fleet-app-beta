
export interface Driver {
    id: string;
    name: string;
    type: 'COM' | 'RNR' | 'OO';
    status: 'available' | 'on-trip' | 'off-duty' | 'hos-break';
    location: string;
    unitId: string;
    stats: {
      totalTrips: number;
      onTimePercentage: number;
      avgMargin: number;
    };
    aiScore: number;
    avatar: string;
    profile: {
      license: string;
      licenseExpiration: string;
      certifications: string[];
      emergencyContact: string;
      payStructure: string;
    };
    currentTrip?: {
      tripId: string;
      destination: string;
      hosRemaining: string;
      nextAction: string;
    };
    hos: {
      driveTimeRemaining: string;
      cycleTimeRemaining: string;
      predictedViolation: string | null;
    };
    performance: {
      weeklyRevenue: number;
      cpm: number;
      fuelEfficiency: number;
    };
    tripHistory: Trip[];
    documents: Document[];
  }
  
  export interface Unit {
    id: string;
    make: string;
    model: string;
    year: number;
    status: 'active' | 'maintenance' | 'out-of-service';
    driverId?: string;
    driverName?: string;
    location: string;
    mileage: number;
    lastService: string;
    aiMaintenancePredictor: string;
    overview: {
      vin: string;
      licensePlate: string;
      capacity: string;
      ownership: 'owned' | 'leased' | 'oo';
    };
    maintenance: {
      nextService: string;
      history: MaintenanceEvent[];
    };
    costs: {
      weeklyFixed: number;
      cpm: number;
    };
    telematics: {
      fuelEfficiency: number;
      idleTime: number;
      hardBrakingEvents: number;
      speedViolations: number;
    };
  }
  
  export interface Trip {
    id: string;
    date: string;
    origin: string;
    destination: string;
    revenue: number;
    margin: number;
  }
  
  export interface Document {
    id: string;
    name: string;
    type: 'license' | 'med-card' | 'certificate' | 'report';
    url: string;
  }
  
  export interface MaintenanceEvent {
    date: string;
    description: string;
    cost: number;
    mileage: number;
  }
  