import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mock AI insights based on the conversation example
    // In production, this would call Claude AI API with trip data
    const insights = {
      recommendation: "Keep Adrian Radu (COM driver) if this is standard freight with normal service expectations - he's already assigned and represents good value. Consider switching to RNR driver (Harjeet/Satnam/Yatin) if you want to reduce costs by ~$63 and the load isn't time-sensitive. Upgrade to Owner-Operator only if the customer is paying premium rates or the load has special requirements.",
      currentAssignment: {
        driver: "Adrian Radu",
        driverType: "COM",
        unit: "734406",
        effectiveRate: 0.54,
        estimatedCost: 405,
      },
      alternativeDrivers: [
        {
          driverId: "DRV-RNR-001",
          driverName: "Harjeet Singh",
          unit: "734201",
          driverType: "RNR" as const,
          weeklyCost: 1800,
          baseWage: 0.38,
          fuelRate: 0.456,
          reason: "Most cost-effective option. Best for standard, non-urgent freight. Saves ~$63 per trip compared to COM drivers.",
          estimatedCost: 342,
          totalCpm: 0.456,
        },
        {
          driverId: "DRV-COM-001",
          driverName: "Adrian Radu",
          unit: "734406",
          driverType: "COM" as const,
          weeklyCost: 2200,
          baseWage: 0.54,
          fuelRate: 0.54,
          reason: "Currently assigned. Mid-range cost with reliable performance. Good choice for this route.",
          estimatedCost: 405,
          totalCpm: 0.54,
        },
        {
          driverId: "DRV-OO-001",
          driverName: "Chris Cuilliana",
          unit: "734901",
          driverType: "OO" as const,
          weeklyCost: 3200,
          baseWage: 0.72,
          fuelRate: 0.864,
          reason: "Premium service option. Higher cost but potentially faster and more experienced. Consider for time-sensitive or high-value loads.",
          estimatedCost: 648,
          totalCpm: 0.864,
        },
      ],
      costAnalysis: {
        linehaulCost: 1875,
        fuelCost: 338,
        totalCost: 2213,
        recommendedRevenue: 2698,
        margin: 18,
        driverCost: 405,
      },
      routeOptimization: {
        distance: 750,
        duration: "12 hours",
        fuelStops: ["Memphis, TN", "Birmingham, AL"],
        warnings: [
          "⚠️ Route optimizer appears to be providing incorrect fuel stops (Memphis/Birmingham are not on the Guelph-Buffalo route). The actual route should be much shorter (~100-120 miles via QEW/I-190).",
        ],
      },
      insights: [
        "✅ Adrian Radu is already assigned and represents good value for standard freight",
        "💰 Switching to RNR driver could save ~$63 per trip if load isn't time-sensitive",
        "⬆️ Owner-Operator option available for premium service requirements",
        "ℹ️ This is a short cross-border Ontario-to-Buffalo run (~100-120 miles actual)",
        "⚠️ Verify route distance - current estimate of 750 miles appears incorrect",
        "📊 Current margin of 18% is healthy for this route type",
      ],
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
