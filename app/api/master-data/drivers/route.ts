import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fleet",
});

type DriverRecord = {
  id: string;
  name: string;
  unitNumber: string;
  driverType: string;
  driverCategory: string;
  status: string;
  currentStatus: string;
  hosHoursRemaining: number;
  baseWageCpm: number;
  effectiveWageCpm: number;
  availableAt: string | null;
  lastShiftEnd: string | null;
  isActive: boolean;
  updated: string;
};

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        dp.driver_id,
        dp.driver_name,
        dp.unit_number,
        dp.driver_type,
        dp.driver_category,
        dp.status,
        dp.current_status,
        dp.hos_hours_remaining,
        dp.base_wage_cpm,
        dp.effective_wage_cpm,
        dp.available_to_start_at,
        dp.last_shift_end_at,
        dp.is_active,
        dp.updated_at,
        COALESCE(c.name, 'Home Base') as current_location
      FROM driver_profiles dp
      LEFT JOIN unit_profiles up ON dp.unit_number = up.unit_number
      LEFT JOIN customers c ON up.current_location_id = c.customer_id
      ORDER BY dp.driver_name
    `);
    
    const drivers = transformDrivers(result.rows);
    return NextResponse.json(buildDriverResponse(drivers));
  } catch (error) {
    console.error("Error fetching drivers from database", error);
    return NextResponse.json({ error: "Failed to load drivers" }, { status: 500 });
  }
}

function transformDrivers(records: Array<Record<string, any>>): DriverRecord[] {
  return records.map((driver, index) => {
    const rawId = driver.driver_id ?? driver.id;
    const id = rawId && String(rawId).trim() !== "" ? String(rawId) : `driver-${index}`;

    return {
      id,
      name: driver.driver_name ?? "Driver",
      unitNumber: driver.unit_number ?? "-",
      driverType: driver.driver_type ?? "Company",
      driverCategory: driver.driver_category ?? "Highway",
      status: driver.status ?? "Active",
      currentStatus: driver.current_status ?? "Off Duty",
      hosHoursRemaining: parseFloat(driver.hos_hours_remaining) || 11,
      baseWageCpm: parseFloat(driver.base_wage_cpm) || 0,
      effectiveWageCpm: parseFloat(driver.effective_wage_cpm) || 0,
      availableAt: driver.available_to_start_at,
      lastShiftEnd: driver.last_shift_end_at,
      isActive: driver.is_active !== false,
      updated: driver.updated_at ?? new Date().toISOString(),
    };
  });
}

function buildDriverResponse(drivers: DriverRecord[]) {
  const categories = Array.from(new Set(drivers.map((d) => d.driverCategory))).sort();
  const statuses = Array.from(new Set(drivers.map((d) => d.currentStatus))).sort();
  const types = Array.from(new Set(drivers.map((d) => d.driverType))).sort();

  return {
    filters: {
      categories: ["All", ...categories],
      statuses: ["All", ...statuses],
      types: ["All", ...types],
    },
    data: drivers,
    summary: {
      total: drivers.length,
      active: drivers.filter(d => d.isActive).length,
      available: drivers.filter(d => d.currentStatus === "Off Duty" && d.hosHoursRemaining >= 8).length,
      lowHos: drivers.filter(d => d.hosHoursRemaining < 4).length,
    }
  };
}

