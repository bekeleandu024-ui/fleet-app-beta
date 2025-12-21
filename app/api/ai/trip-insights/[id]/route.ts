import { NextRequest, NextResponse } from 'next/server';
import { serviceFetch } from "@/lib/service-client";
import { generateTripInsights } from "@/lib/claude-api";
import { calculateTripCost, type Driver, type TripEvents } from "@/lib/cost-calculator";
import { isCrossBorder } from "@/lib/costing";
import pool from "@/lib/db";

interface TripInsightsContext {
  trip: {
    id: string;
    orderId?: string;
    status: string;
    pickup: string;
    delivery: string;
    plannedStart?: string;
    actualStart?: string;
    estimatedDistance: number;
    estimatedDuration: number;
    onTimePickup?: boolean;
    onTimeDelivery?: boolean;
  };
  order: {
    id: string;
    customer: string;
    commodity?: string;
    serviceLevel: string;
    revenue: number;
  } | null;
  driver: {
    id: string;
    name: string;
    type: string;
    region?: string;
    hoursAvailable?: number;
    location?: string;
    estimatedCost: number;
    onTimeRate?: number;
    rating?: number;
  } | null;
  unit: {
    id: string;
    unitNumber: string;
    type: string;
    region?: string;
    location?: string;
    status: string;
  } | null;
  costing: {
    linehaulCost: number;
    fuelCost: number;
    driverCost: number;
    totalCost: number;
    margin: number;
    recommendedRevenue: number;
  };
  alternatives: Array<{
    driverId: string;
    name: string;
    type: string;
    estimatedCost: number;
    hoursAvailable?: number;
    location?: string;
  }>;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    // Fetch trip directly from DB
    const tripResult = await pool.query(`SELECT * FROM trips WHERE id = $1`, [id]);
    let trip = tripResult.rows.length > 0 ? tripResult.rows[0] : null;

    if (!trip) {
      // Fallback to service fetch if not found in DB (e.g. demo data)
      try {
        trip = await serviceFetch<Record<string, any>>("tracking", `/api/trips/${id}`);
      } catch (e) {
         return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }
    }

    // Fetch drivers directly from DB to ensure we have costs
    const driversQuery = `
      SELECT d.driver_id as id, d.driver_name as name, d.driver_type, d.unit_number, u.truck_weekly_cost as "truckWk", d.region,
             d.status, u.current_location
      FROM driver_profiles d
      LEFT JOIN unit_profiles u ON d.unit_number = u.unit_number
    `;
    const unitsQuery = `SELECT unit_id as id, unit_number, unit_type, truck_weekly_cost, region, is_active, current_location FROM unit_profiles`;

    const [orderResult, driversResult, unitsResult] = await Promise.allSettled([
      trip && trip.order_id
        ? pool.query(`SELECT * FROM orders WHERE id = $1`, [trip.order_id])
        : Promise.resolve({ rows: [] }),
      pool.query(driversQuery),
      pool.query(unitsQuery),
    ]);

    const order = (orderResult.status === "fulfilled" && orderResult.value.rows.length > 0) ? orderResult.value.rows[0] : undefined;
    const drivers = driversResult.status === "fulfilled" ? driversResult.value.rows : [];
    const units = unitsResult.status === "fulfilled" ? unitsResult.value.rows : [];

    const driver = drivers.find((d: any) => String(d.id) === String(trip.driver_id));
    const unit = units.find((u: any) => String(u.id) === String(trip.unit_id));

    const estimatedDistance = Number(trip.distance_miles || trip.actual_miles || trip.planned_miles || 0);
    const estimatedDuration = Number(trip.duration_hours || (estimatedDistance / 55) || 0); // hours, fallback to 55mph average
    const durationDays = estimatedDuration / 24;

    // Calculate costs
    const driverType = driver?.driver_type || "COM";
    
    // Use truck cost from the assigned unit if available, otherwise fallback to driver's default unit
    const assignedUnitCost = unit ? Number(unit.truck_weekly_cost || 0) : 0;
    const driverDefaultUnitCost = driver ? Number(driver.truckWk || 0) : 0;
    const truckWk = assignedUnitCost > 0 ? assignedUnitCost : driverDefaultUnitCost;

    const currentDriver: Driver = {
      id: driver?.id || 'unknown',
      name: driver?.name || 'Unknown',
      type: driverType,
      truckWk: truckWk
    };

    const events: TripEvents = {
      border: isCrossBorder(trip.pickup_location, trip.dropoff_location) ? 1 : 0,
      picks: 1, // Default
      drops: 1  // Default
    };

    const costResult = calculateTripCost(currentDriver, estimatedDistance, durationDays, events);

    const driverCost = costResult.breakdown.labor;
    const linehaulCost = costResult.breakdown.fixed + costResult.breakdown.maintenance + costResult.breakdown.events;
    const fuelCost = costResult.breakdown.fuel;
    const totalCost = costResult.totalCost;
    
    const revenue = Number(order?.quoted_rate || order?.revenue || 2698);
    const margin = revenue > 0 ? Math.round(((revenue - totalCost) / revenue) * 100) : 18;

    // Ensure we have an order object for the AI context, even if it's a placeholder
    const aiOrder = order ? {
        id: order.id,
        customer: order.customer_name || order.customer_id || order.customer,
        commodity: order.special_instructions || order.commodity || "General Freight",
        serviceLevel: order.order_type || order.service_level || order.serviceLevel || "Standard",
        revenue: revenue,
      } : {
        id: "placeholder",
        customer: "Unknown Customer",
        commodity: "General Freight",
        serviceLevel: "Standard",
        revenue: revenue
      };
    const alternatives = drivers
      .filter((d: any) => 
        d.id !== trip.driver_id && 
        d.status === "Ready" &&
        (d.hours_available || 0) >= 12
      )
      .slice(0, 3)
      .map((d: any) => {
        const altDriver: Driver = {
          id: d.id,
          name: d.name,
          type: d.driver_type || "COM",
          truckWk: d.truckWk || 0
        };
        const altCost = calculateTripCost(altDriver, estimatedDistance, durationDays, events);
        
        return {
          driverId: d.id,
          name: d.name,
          type: d.driver_type || "COM",
          estimatedCost: altCost.breakdown.labor, 
          totalEstimatedCost: altCost.totalCost,

          hoursAvailable: 70,
          location: d.current_location || "Unknown",
        };
      });

    // Get ACTUAL stored financial data from the trip record (not recalculated)
    const storedRevenue = Number(trip.revenue) || 0;
    const storedCost = Number(trip.total_cost) || 0;
    const storedMarginPct = Number(trip.margin_pct) || 0;
    
    // Use stored values if available, otherwise use calculated
    const finalRevenue = storedRevenue > 0 ? storedRevenue : revenue;
    const finalCost = storedCost > 0 ? storedCost : totalCost;
    const finalMargin = storedRevenue > 0 ? storedMarginPct : margin;

    // Build context for AI
    const context: TripInsightsContext = {
      trip: {
        id: trip.id,
        orderId: trip.order_id,
        status: trip.status,
        pickup: trip.pickup_location,
        delivery: trip.dropoff_location,
        plannedStart: trip.planned_start,
        actualStart: trip.actual_start,
        estimatedDistance,
        estimatedDuration,
        onTimePickup: trip.on_time_pickup,
        onTimeDelivery: trip.on_time_delivery,
        // Add windows if available, or fallback to order times
        pickupWindowStart: trip.pickup_window_start || order?.pickup_time,
        pickupWindowEnd: trip.pickup_window_end,
        deliveryWindowStart: trip.delivery_window_start || order?.dropoff_time,
        deliveryWindowEnd: trip.delivery_window_end,
        // Add capacity data
        utilizationPercent: Number(trip.utilization_percent) || 0,
        limitingFactor: trip.limiting_factor,
        currentWeight: Number(trip.current_weight) || 0,
        currentCube: Number(trip.current_cube) || 0,
        currentLinearFeet: Number(trip.current_linear_feet) || 0
      },
      order: aiOrder,
      driver: driver ? {
        id: driver.id,
        name: driver.name,
        type: driverType,
        region: driver.region,
        hoursAvailable: 70,
        location: driver.current_location || unit?.current_location,
        estimatedCost: driverCost,
        onTimeRate: 0.98,
        rating: 4.8,
      } : null,
      unit: unit ? {
        id: unit.unit_id || unit.id,
        unitNumber: unit.unit_number || unit.name,
        type: unit.unit_type || unit.type,
        region: unit.region,
        location: unit.current_location || unit.location,
        status: unit.is_active === false ? "Maintenance" : "Available",
      } : null,
      costing: {
        linehaulCost,
        fuelCost,
        driverCost,
        totalCost: finalCost,
        margin: finalMargin,
        recommendedRevenue: Math.round(finalCost * 1.2),
        // Include stored values explicitly for the AI prompt
        storedRevenue: storedRevenue,
        storedCost: storedCost,
        storedMarginPct: storedMarginPct
      },
      alternatives,
    };

    // Generate AI insights using Claude
    let aiInsights;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        aiInsights = await generateTripInsights(context);
      } catch (error) {
        console.error("Failed to generate AI insights, using fallback:", error);
        aiInsights = generateFallbackInsights(context);
      }
    } else {
      aiInsights = generateFallbackInsights(context);
    }

    // Format response in the structure the frontend expects
    const insights = {
      recommendation: aiInsights.driverAnalysis?.recommendation || aiInsights.recommendations?.[0] || "Current assignment is appropriate",
      currentAssignment: {
        driver: driver?.name || "Unknown",
        driverType: driverType,
        unit: unit?.unitNumber || "Unknown",
        effectiveRate: totalCost / estimatedDistance,
        estimatedCost: totalCost,
      },
      alternativeDrivers: [
        // Current driver first
        {
          driverId: driver?.id || "current",
          driverName: driver?.name || "Current Driver",
          unit: unit?.unitNumber || "Unknown",
          driverType: driverType as "RNR" | "COM" | "OO",
          weeklyCost: driverType === "RNR" ? 1800 : driverType === "OO" ? 3200 : 2200, // This seems hardcoded, maybe update?
          baseWage: driverCost / estimatedDistance,
          fuelRate: fuelCost / estimatedDistance,
          reason: aiInsights.driverAnalysis?.currentAssignment || "Currently assigned",
          estimatedCost: totalCost,
          totalCpm: totalCost / estimatedDistance,
        },
        // Then alternatives
        ...alternatives.map((alt: any) => ({
          driverId: alt.driverId,
          driverName: alt.name,
          unit: "Available",
          driverType: alt.type as "RNR" | "COM" | "OO",
          weeklyCost: alt.type === "RNR" ? 1800 : alt.type === "OO" ? 3200 : 2200,
          baseWage: 0, // Simplified
          fuelRate: 0, // Simplified
          reason: alt.type === "RNR" 
            ? `Most cost-effective option. Saves $${Math.round(totalCost - alt.totalEstimatedCost)} per trip.`
            : alt.type === "OO"
            ? "Premium service option for time-sensitive loads."
            : "Alternative driver available",
          estimatedCost: alt.totalEstimatedCost,
          totalCpm: alt.totalEstimatedCost / estimatedDistance,
        })),
      ],
      costAnalysis: {
        linehaulCost,
        fuelCost,
        totalCost,
        recommendedRevenue: context.costing.recommendedRevenue,
        margin,
        driverCost,
      },
      routeOptimization: {
        distance: estimatedDistance,
        duration: `${Math.round(estimatedDuration)} hours`,
        fuelStops: [], // TODO: Calculate actual fuel stops
        warnings: aiInsights.riskFactors || [],
      },
      insights: aiInsights.keyInsights || [
        `✅ ${driver?.name || "Current driver"} is assigned (${driverType})`,
        `💰 Current margin: ${margin}%`,
        alternatives.length > 0 ? `${alternatives.length} alternative drivers available` : "No alternatives currently available",
        `📊 Trip: ${context.trip.pickup} → ${context.trip.delivery}`,
      ],
      // Include full AI insights
      aiAnalysis: aiInsights,
    };

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching trip insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip insights' },
      { status: 500 }
    );
  }
}

// Removed calculateDriverCost as it is replaced by calculateTripCost


function generateFallbackInsights(context: TripInsightsContext): any {
  const { trip, driver, unit, costing, alternatives } = context;
  
  // Use stored financial data
  const revenue = costing.storedRevenue || costing.recommendedRevenue || 0;
  const cost = costing.storedCost || costing.totalCost || 0;
  const margin = costing.storedMarginPct ?? costing.margin ?? 0;
  const profit = revenue - cost;
  
  const insights: string[] = [];
  const riskFactors: string[] = [];
  
  // Build accurate insights based on actual data
  if (driver) {
    insights.push(`✅ Driver ${driver.name} (${driver.type}) is assigned`);
  } else {
    riskFactors.push("No driver assigned");
  }
  
  if (unit) {
    insights.push(`✅ Unit ${unit.unitNumber} (${unit.type}) is assigned`);
  } else {
    riskFactors.push("No unit assigned");
  }
  
  if (revenue > 0 && cost > 0) {
    insights.push(`💰 Revenue: $${revenue.toFixed(2)} | Cost: $${cost.toFixed(2)} | Margin: ${margin.toFixed(1)}%`);
    if (margin >= 15) {
      insights.push(`✅ Margin of ${margin.toFixed(1)}% is healthy (above 15% target)`);
    } else if (margin > 0) {
      insights.push(`⚠️ Margin of ${margin.toFixed(1)}% is below 15% target`);
    }
  }
  
  if (trip.estimatedDistance > 0) {
    insights.push(`📍 Route: ${trip.estimatedDistance} miles, ~${Math.round(trip.estimatedDuration)} hours`);
  }
  
  // Check for cross-border (simple heuristic)
  const isCrossBorder = (trip.pickup?.toLowerCase().includes('canada') || trip.pickup?.toLowerCase().includes(', on') || trip.pickup?.toLowerCase().includes(', qc')) &&
    (trip.delivery?.toLowerCase().includes('usa') || trip.delivery?.toLowerCase().includes(', tn') || trip.delivery?.toLowerCase().includes(', oh'));
  
  if (isCrossBorder) {
    insights.push(`🌐 Cross-border shipment - allow 2-4 hours for customs`);
  }
  
  return {
    summary: `${trip.pickup} → ${trip.delivery} (${trip.estimatedDistance} mi) | ${driver?.name || 'Unassigned'} | $${revenue.toFixed(0)} rev @ ${margin.toFixed(0)}% margin`,
    marginAnalysis: {
      status: margin >= 15 ? "healthy" : margin > 0 ? "warning" : "critical",
      message: revenue > 0 
        ? `Revenue $${revenue.toFixed(2)}, Cost $${cost.toFixed(2)}, Margin ${margin.toFixed(1)}%`
        : "Revenue not yet confirmed",
      recommendation: margin >= 15 
        ? "Margin is healthy - proceed with dispatch" 
        : margin > 0 
        ? "Margin below target - review if acceptable"
        : "Confirm pricing before dispatch",
    },
    driverAnalysis: {
      currentAssignment: driver ? `${driver.name} (${driver.type}) assigned to unit ${unit?.unitNumber || 'TBD'}` : "No driver assigned",
      recommendation: driver 
        ? "Driver assignment complete" 
        : "Assign driver before dispatch",
      bestAlternative: alternatives && alternatives.length > 0 ? alternatives[0].name : null,
      costImpact: 0,
    },
    riskFactors,
    keyInsights: insights,
    recommendations: [
      driver && unit ? "✅ Ready for dispatch" : "Complete resource assignment",
      margin >= 15 ? "Margin is acceptable" : "Review pricing",
      isCrossBorder ? "Verify border documentation" : null,
    ].filter(Boolean),
  };
}

function getMockInsights(tripId: string): any {
  // Fallback mock data when trip not found in system
  return {
    recommendation: "Trip data not found. Please verify trip ID.",
    currentAssignment: {
      driver: "Unknown",
      driverType: "COM",
      unit: "Unknown",
      effectiveRate: 0.54,
      estimatedCost: 405,
    },
    alternativeDrivers: [],
    costAnalysis: {
      linehaulCost: 0,
      fuelCost: 0,
      totalCost: 0,
      recommendedRevenue: 0,
      margin: 0,
      driverCost: 0,
    },
    routeOptimization: {
      distance: 0,
      duration: "Unknown",
      fuelStops: [],
      warnings: ["Trip not found in system"],
    },
    insights: [
      "⚠️ Trip data not available",
      "Please verify the trip ID and try again",
    ],
  };
}
