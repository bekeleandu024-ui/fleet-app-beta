import { NextResponse } from "next/server";

const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE || 'http://localhost:4001';

export async function GET() {
  try {
    const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/drivers`);
    if (!response.ok) {
      throw new Error('Failed to fetch drivers');
    }
    
    const data = await response.json();
    const drivers = data.drivers || [];
    
    // Transform to frontend format
    const transformedDrivers = drivers.map((d: any) => ({
      id: d.driver_id,
      name: d.driver_name,
      status: d.is_active ? 'Ready' : 'Off Duty',
      region: d.region || 'Unknown',
      hoursAvailable: 8,
      updated: new Date().toISOString(),
    }));
    
    const regions = Array.from(new Set(transformedDrivers.map((driver: any) => driver.region))).sort();
    const statuses = Array.from(new Set(transformedDrivers.map((driver: any) => driver.status))).sort();

    return NextResponse.json({
      filters: {
        regions: ["All", ...regions],
        statuses,
      },
      data: transformedDrivers,
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Failed to load drivers' }, { status: 500 });
  }
}
