import { NextResponse } from "next/server";

const MASTER_DATA_SERVICE = process.env.MASTER_DATA_SERVICE || 'http://localhost:4001';

export async function GET() {
  try {
    const response = await fetch(`${MASTER_DATA_SERVICE}/api/metadata/units`);
    if (!response.ok) {
      throw new Error('Failed to fetch units');
    }
    
    const data = await response.json();
    const units = data.units || [];
    
    // Transform to frontend format
    const transformedUnits = units.map((u: any) => ({
      id: u.unit_id,
      name: u.unit_number,
      status: u.is_active ? 'Available' : 'Maintenance',
      region: u.region || 'Unknown',
      updated: new Date().toISOString(),
      type: u.unit_type || 'Unknown',
      location: u.current_location || 'Fleet Yard',
    }));
    
    const regions = Array.from(new Set(transformedUnits.map((unit: any) => unit.region))).sort();
    const statuses = Array.from(new Set(transformedUnits.map((unit: any) => unit.status))).sort();

    return NextResponse.json({
      filters: {
        regions: ["All", ...regions],
        statuses,
      },
      data: transformedUnits,
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ error: 'Failed to load units' }, { status: 500 });
  }
}
