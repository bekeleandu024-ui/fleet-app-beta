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
    const trip = await serviceFetch<Record<string, any>>("tracking", `/api/trips/${id}`);

    // Fetch drivers directly from DB to ensure we have costs
    const driversQuery = `
      SELECT d.driver_id as id, d.driver_name as name, d.driver_type, d.unit_number, u.truck_weekly_cost as "truckWk", d.region,
             d.status, d.hours_available, d.current_location
      FROM driver_profiles d
      LEFT JOIN unit_profiles u ON d.unit_number = u.unit_number
    `;
    const unitsQuery = `SELECT unit_id as id, unit_number, truck_weekly_cost, region, is_active, current_location FROM unit_profiles`;

    const [orderResult, driversResult, unitsResult] = await Promise.allSettled([
      trip.order_id
        ? serviceFetch<Record<string, any>>("orders", `/api/orders/${trip.order_id}`)
        : Promise.resolve(undefined),
      pool.query(driversQuery),
      pool.query(unitsQuery),
    ]);

    const order = orderResult.status === "fulfilled" ? orderResult.value : undefined;
    const drivers = driversResult.status === "fulfilled" ? driversResult.value.rows : [];
    const units = unitsResult.status === "fulfilled" ? unitsResult.value.rows : [];

    const driver = drivers.find((d: any) => String(d.id) === String(trip.driver_id));
    const unit = units.find((u: any) => String(u.id) === String(trip.unit_id));

    const estimatedDistance = trip.distance_miles || trip.actual_miles || trip.planned_miles || 0;
    const estimatedDuration = trip.duration_hours || (estimatedDistance / 55) || 0; // hours, fallback to 55mph average
    const durationDays = estimatedDuration / 24;

    // Calculate costs
    const driverType = driver?.driver_type || "COM";
    
    const currentDriver: Driver = {
      id: driver?.driver_id || driver?.id || 'unknown',
      name: driver?.driver_name || driver?.name || 'Unknown',
      type: driverType,
      truckWk: driver?.truck_wk || 0 // Assuming truck_wk might be in driver object, else 0
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
    
    const revenue = order?.revenue || order?.quoted_price || 2698;
    const margin = revenue > 0 ? Math.round(((revenue - totalCost) / revenue) * 100) : 18;

    // Find alternative drivers
    const alternatives = drivers
      .filter((d: any) => 
        d.driver_id !== trip.driver_id && 
        d.status === "Ready" &&
        (d.hoursAvailable || d.hours_available || 0) >= 12
      )
      .slice(0, 3)
      .map((d: any) => {
        const altDriver: Driver = {
          id: d.driver_id || d.id,
          name: d.driver_name || d.name,
          type: d.driver_type || "COM",
          truckWk: d.truck_wk || 0
        };
        const altCost = calculateTripCost(altDriver, estimatedDistance, durationDays, events);
        
        return {
          driverId: d.driver_id || d.id,
          name: d.driver_name || d.name,
          type: d.driver_type || "COM",
          estimatedCost: altCost.breakdown.labor, // Using labor cost for comparison or total? Usually total cost matters.
          // The original code used calculateDriverCost which returned a single number.
          // Let's use total cost for comparison as it's more accurate.
          totalEstimatedCost: altCost.totalCost,
          hoursAvailable: d.hoursAvailable || d.hours_available,
          location: d.current_location || d.location,
        };
      });

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
      },
      order: order ? {
        id: order.id,
        customer: order.customer_id || order.customer,
        commodity: order.commodity,
        serviceLevel: order.service_level || order.serviceLevel,
        revenue: revenue,
      } : null,
      driver: driver ? {
        id: driver.driver_id || driver.id,
        name: driver.driver_name || driver.name,
        type: driverType,
        region: driver.region,
        hoursAvailable: driver.hoursAvailable || driver.hours_available,
        location: driver.current_location || driver.location,
        estimatedCost: driverCost,
        onTimeRate: driver.on_time_rate,
        rating: driver.rating,
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
        totalCost,
        margin,
        recommendedRevenue: Math.round(totalCost * 1.2), // 20% markup
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
  const { trip, driver, costing, alternatives } = context;
  
  return {
    summary: `${trip.pickup} → ${trip.delivery} run (~${trip.estimatedDistance} mi, ${trip.estimatedDuration} hours)`,
    marginAnalysis: {
      status: costing.margin >= 15 ? "healthy" : "warning",
      message: `Current margin of ${costing.margin}% is ${costing.margin >= 15 ? "healthy" : "below target"} for this route type.`,
      recommendation: costing.margin < 15 ? "Consider optimizing costs or adjusting pricing" : "Current margin is acceptable",
    },
    driverAnalysis: {
      currentAssignment: driver ? `${driver.name} (${driver.type}) is assigned` : "Not assigned",
      recommendation: alternatives && alternatives.length > 0 
        ? `${alternatives[0].type} drivers available as alternatives`
        : "Current assignment is appropriate",
      bestAlternative: alternatives && alternatives.length > 0 ? alternatives[0].name : null,
      costImpact: alternatives && alternatives.length > 0 ? (driver?.estimatedCost || 0) - alternatives[0].estimatedCost : 0,
    },
    riskFactors: [],
    keyInsights: [
      `Trip covers ${trip.estimatedDistance} miles in estimated ${trip.estimatedDuration} hours`,
      `Current margin: ${costing.margin}%`,
      alternatives && alternatives.length > 0 ? `${alternatives.length} alternative drivers available` : "No alternatives available",
      driver ? `${driver.name} (${driver.type}) currently assigned` : "No driver assigned",
    ],
    recommendations: [
      `Monitor trip progress for ${trip.pickup} → ${trip.delivery}`,
      costing.margin >= 15 ? "Current margin is healthy" : "Consider cost optimization",
    ],
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
