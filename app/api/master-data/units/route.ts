import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fleet",
});

type UnitRecord = {
  id: string;
  unitNumber: string;
  driverName: string | null;
  unitType: string;
  configuration: string;
  status: string;
  currentLocation: string;
  maxWeight: number;
  maxVolume: number;
  palletPositions: number;
  fuelConsumption: number;
  weeklyCost: number;
  attachedTrailer: string | null;
  isActive: boolean;
  updated: string;
};

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        up.unit_id,
        up.unit_number,
        up.unit_type,
        up.current_configuration,
        up.max_weight_lbs,
        up.max_volume_cuft,
        up.pallet_positions,
        up.avg_fuel_consumption,
        up.total_weekly_cost,
        up.current_trailer_id,
        up.is_active,
        up.updated_at,
        dp.driver_name,
        COALESCE(c.name, 'Home Base - Guelph') as current_location,
        t.unit_number as trailer_number
      FROM unit_profiles up
      LEFT JOIN driver_profiles dp ON up.driver_id = dp.driver_id
      LEFT JOIN customers c ON up.current_location_id = c.customer_id
      LEFT JOIN trailers t ON up.current_trailer_id = t.trailer_id
      ORDER BY up.unit_number
    `);
    
    const units = transformUnits(result.rows);
    return NextResponse.json(buildUnitResponse(units));
  } catch (error) {
    console.error("Error fetching units from database", error);
    return NextResponse.json({ error: "Failed to load units" }, { status: 500 });
  }
}

function transformUnits(records: Array<Record<string, any>>): UnitRecord[] {
  return records.map((unit, index) => {
    const rawId = unit.unit_id ?? unit.id;
    const id = rawId && String(rawId).trim() !== "" ? String(rawId) : `unit-${index}`;

    return {
      id,
      unitNumber: unit.unit_number ?? "-",
      driverName: unit.driver_name || null,
      unitType: unit.unit_type ?? "Unknown",
      configuration: unit.current_configuration ?? "Bobtail",
      status: unit.is_active !== false ? "Available" : "Maintenance",
      currentLocation: unit.current_location ?? "Home Base",
      maxWeight: parseInt(unit.max_weight_lbs) || 45000,
      maxVolume: parseInt(unit.max_volume_cuft) || 3000,
      palletPositions: unit.pallet_positions || 26,
      fuelConsumption: parseFloat(unit.avg_fuel_consumption) || 6.5,
      weeklyCost: parseFloat(unit.total_weekly_cost) || 0,
      attachedTrailer: unit.trailer_number || null,
      isActive: unit.is_active !== false,
      updated: unit.updated_at ?? new Date().toISOString(),
    };
  });
}

function buildUnitResponse(units: UnitRecord[]) {
  const types = Array.from(new Set(units.map((u) => u.unitType))).sort();
  const configurations = Array.from(new Set(units.map((u) => u.configuration))).sort();
  const locations = Array.from(new Set(units.map((u) => u.currentLocation))).sort();

  return {
    filters: {
      types: ["All", ...types],
      configurations: ["All", ...configurations],
      locations: ["All", ...locations],
    },
    data: units,
    summary: {
      total: units.length,
      active: units.filter(u => u.isActive).length,
      bobtail: units.filter(u => u.configuration === "Bobtail").length,
      coupled: units.filter(u => u.configuration === "Coupled").length,
      totalWeeklyCost: units.reduce((sum, u) => sum + u.weeklyCost, 0),
    }
  };
}

