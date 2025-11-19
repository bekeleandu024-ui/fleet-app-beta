import { NextRequest, NextResponse } from 'next/server';
import { serviceFetch } from "@/lib/service-client";
import { generateTripInsights } from "@/lib/claude-api";

interface TripInsightsContext {
  trip: any;
  order: any;
  driver: any;
  unit: any;
  costing: any;
  alternatives?: any[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Gather all relevant context data
    const [tripResult, driversResult, unitsResult] = await Promise.allSettled([
      serviceFetch("tracking", `/api/trips`),
      serviceFetch("masterData", "/api/metadata/drivers"),
      serviceFetch("masterData", "/api/metadata/units"),
    ]);

    // Find the specific trip
    let trip = null;
    if (tripResult.status === "fulfilled") {
      const tripsData = tripResult.value;
      const trips = Array.isArray(tripsData) ? tripsData : (tripsData.value || []);
      trip = trips.find((t: any) => t.id === id || t.id.startsWith(id.substring(0, 8)));
    }

    if (!trip) {
      // Fallback to mock insights if trip not found
      return NextResponse.json(getMockInsights(id));
    }

    // Get order details
    const orderResult = await serviceFetch("orders", `/api/orders`).catch(() => null);
    let order = null;
    if (orderResult && orderResult.data) {
      order = orderResult.data.find((o: any) => o.id === trip.order_id);
    }

    // Find driver details
    const drivers = driversResult.status === "fulfilled" ? driversResult.value?.drivers || [] : [];
    const driver = drivers.find((d: any) => d.driver_id === trip.driver_id || d.id === trip.driver_id);

    // Find unit details
    const units = unitsResult.status === "fulfilled" ? unitsResult.value?.units || [] : [];
    const unit = units.find((u: any) => u.unit_id === trip.unit_id || u.id === trip.unit_id);

    // Calculate distance (simplified - you may want to use a real routing API)
    const estimatedDistance = 750; // Default, should be calculated
    const estimatedDuration = 12; // hours

    // Calculate costs
    const driverType = driver?.driver_type || "COM";
    const driverCost = calculateDriverCost(driverType);
    const linehaulCost = 1875;
    const fuelCost = 338;
    const totalCost = linehaulCost + fuelCost + driverCost;
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
      .map((d: any) => ({
        driverId: d.driver_id || d.id,
        name: d.driver_name || d.name,
        type: d.driver_type || "COM",
        estimatedCost: calculateDriverCost(d.driver_type || "COM"),
        hoursAvailable: d.hoursAvailable || d.hours_available,
        location: d.current_location || d.location,
      }));

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
        effectiveRate: driverCost / estimatedDistance,
        estimatedCost: driverCost,
      },
      alternativeDrivers: [
        // Current driver first
        {
          driverId: driver?.id || "current",
          driverName: driver?.name || "Current Driver",
          unit: unit?.unitNumber || "Unknown",
          driverType: driverType as "RNR" | "COM" | "OO",
          weeklyCost: driverType === "RNR" ? 1800 : driverType === "OO" ? 3200 : 2200,
          baseWage: driverCost / estimatedDistance,
          fuelRate: driverCost / estimatedDistance,
          reason: aiInsights.driverAnalysis?.currentAssignment || "Currently assigned",
          estimatedCost: driverCost,
          totalCpm: driverCost / estimatedDistance,
        },
        // Then alternatives
        ...alternatives.map((alt: any) => ({
          driverId: alt.driverId,
          driverName: alt.name,
          unit: "Available",
          driverType: alt.type as "RNR" | "COM" | "OO",
          weeklyCost: alt.type === "RNR" ? 1800 : alt.type === "OO" ? 3200 : 2200,
          baseWage: alt.estimatedCost / estimatedDistance,
          fuelRate: alt.estimatedCost / estimatedDistance,
          reason: alt.type === "RNR" 
            ? `Most cost-effective option. Saves $${driverCost - alt.estimatedCost} per trip.`
            : alt.type === "OO"
            ? "Premium service option for time-sensitive loads."
            : "Alternative driver available",
          estimatedCost: alt.estimatedCost,
          totalCpm: alt.estimatedCost / estimatedDistance,
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
        duration: `${estimatedDuration} hours`,
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

function calculateDriverCost(driverType: string): number {
  const rates: Record<string, number> = {
    RNR: 342,
    COM: 405,
    OO: 612,
  };
  return rates[driverType?.toUpperCase()] || 405;
}

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
