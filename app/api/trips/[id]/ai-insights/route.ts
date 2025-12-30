import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface TripInsightData {
  trip_id: string;
  summary: string;
  insights: Array<{
    priority: number;
    severity: 'critical' | 'warning' | 'info' | 'success';
    category: 'data_integrity' | 'timeline' | 'resources' | 'financial' | 'route' | 'compliance';
    title: string;
    detail: string;
    action: string;
    data_points: Record<string, any>;
  }>;
  positive_indicators: string[];
  missing_data: string[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await context.params;

  try {
    // Fetch trip from database
    const tripResult = await pool.query(`
      SELECT 
        id, status, order_id, driver_id, unit_id,
        planned_start, actual_start,
        pickup_location, dropoff_location,
        planned_miles, distance_miles,
        on_time_pickup, on_time_delivery,
        revenue, total_cost, margin_pct, profit,
        utilization_percent, limiting_factor,
        current_weight, current_cube, current_linear_feet,
        pickup_window_start, pickup_window_end,
        delivery_window_start, delivery_window_end
      FROM trips 
      WHERE id = $1
    `, [tripId]);

    if (tripResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const trip = tripResult.rows[0];

    // Fetch related data
    const [orderResult, driverResult, unitResult] = await Promise.allSettled([
      trip.order_id
        ? pool.query(`
            SELECT 
              id, order_number, status, customer_name, customer_id,
              order_type, required_equipment as service_level, special_instructions,
              lane, quoted_rate
            FROM orders 
            WHERE id = $1
          `, [trip.order_id])
        : Promise.resolve({ rows: [] }),
      trip.driver_id
        ? pool.query(`
            SELECT 
              d.driver_id, d.driver_name, d.driver_type, d.region, 
              d.is_active, d.unit_number,
              u.truck_weekly_cost, u.current_location as unit_location
            FROM driver_profiles d
            LEFT JOIN unit_profiles u ON d.unit_number = u.unit_number
            WHERE d.driver_id = $1
          `, [trip.driver_id])
        : Promise.resolve({ rows: [] }),
      trip.unit_id
        ? pool.query(`
            SELECT 
              unit_id, unit_number, unit_type, region, 
              current_location, is_active
            FROM unit_profiles 
            WHERE unit_id = $1
          `, [trip.unit_id])
        : Promise.resolve({ rows: [] }),
    ]);

    // Check for any rejected promises and log them
    if (orderResult.status === 'rejected') {
      console.error('Order query failed:', orderResult.reason);
    }
    if (driverResult.status === 'rejected') {
      console.error('Driver query failed:', driverResult.reason);
    }
    if (unitResult.status === 'rejected') {
      console.error('Unit query failed:', unitResult.reason);
    }

    const order = orderResult.status === 'fulfilled' && orderResult.value.rows.length > 0
      ? orderResult.value.rows[0]
      : null;
    
    const driver = driverResult.status === 'fulfilled' && driverResult.value.rows.length > 0
      ? driverResult.value.rows[0]
      : null;
    
    const unit = unitResult.status === 'fulfilled' && unitResult.value.rows.length > 0
      ? unitResult.value.rows[0]
      : null;

    // Structure data according to the AI prompt format
    const tripData = {
      id: trip.id,
      status: trip.status,
      planned_start: trip.planned_start,
      actual_start: trip.actual_start,
      pickup_location: trip.pickup_location,
      dropoff_location: trip.dropoff_location,
      planned_miles: Number(trip.planned_miles || trip.distance_miles || 0),
      on_time_pickup: trip.on_time_pickup,
      on_time_delivery: trip.on_time_delivery,
      stored_revenue: Number(trip.revenue || 0),
      stored_cost: Number(trip.total_cost || 0),
      stored_margin_pct: Number(trip.margin_pct || 0),
      utilization_percent: Number(trip.utilization_percent || 0),
      limiting_factor: trip.limiting_factor,
      current_weight: Number(trip.current_weight || 0),
      current_cube: Number(trip.current_cube || 0),
      current_linear_feet: Number(trip.current_linear_feet || 0),
      pickup_window_start: trip.pickup_window_start,
      pickup_window_end: trip.pickup_window_end,
      delivery_window_start: trip.delivery_window_start,
      delivery_window_end: trip.delivery_window_end,
    };

    const orderData = order ? {
      id: order.id,
      order_number: order.order_number || order.id,
      status: order.status || 'active',
      customer: order.customer_name || order.customer_id,
      lane: `${trip.pickup_location} → ${trip.dropoff_location}`,
      lane_miles: Number(order.lane_miles || trip.planned_miles || 0),
      service_level: order.order_type || 'Standard',
      commodity: order.special_instructions || 'General Freight',
      revenue: Number(trip.revenue || order.quoted_rate || 0),
      cost_basis: Number(trip.total_cost || 0),
      target_margin: 15,
      actual_margin: Number(trip.margin_pct || 0),
      pickup_window: trip.pickup_window_start ? {
        start: trip.pickup_window_start,
        end: trip.pickup_window_end
      } : null,
      delivery_window: trip.delivery_window_start ? {
        start: trip.delivery_window_start,
        end: trip.delivery_window_end
      } : null,
      stops: 2,
    } : null;

    const driverData = driver ? {
      id: driver.driver_id,
      name: driver.driver_name,
      type: driver.driver_type,
      region: driver.region,
      hours_available: 70, // Default available hours
      status: driver.is_active ? 'active' : 'inactive',
      assigned: true,
      certifications: ['FAST', 'TWIC'], // Assume certifications
      current_location: driver.unit_location || 'Unknown',
      performance_metrics: {
        on_time_rate: 0.98,
      },
    } : {
      assigned: false,
      name: null,
      id: null,
    };

    const unitData = unit ? {
      id: unit.unit_id,
      unit_number: unit.unit_number,
      type: unit.unit_type || 'Dry Van',
      status: unit.is_active ? 'Available' : 'Maintenance',
      region: unit.region,
      location: unit.current_location,
      assigned: true,
      maintenance_status: 'ok',
    } : {
      assigned: false,
      unit_number: null,
      id: null,
    };

    // Confirmed financials
    const revenue = Number(trip.revenue || 0);
    const totalCost = Number(trip.total_cost || 0);
    const marginPct = Number(trip.margin_pct || 0);
    const profit = revenue - totalCost;

    const confirmedFinancials = {
      revenue,
      total_cost: totalCost,
      margin_pct: marginPct,
      profit,
      is_profitable: profit > 0,
      margin_is_healthy: marginPct >= 15,
      data_source: 'database',
    };

    // Critical context
    const criticalContext = `
- Driver "${driverData.name || 'None'}" is ${driverData.assigned ? 'ASSIGNED' : 'NOT assigned'}
- Unit "${unitData.unit_number || 'None'}" is ${unitData.assigned ? 'ASSIGNED' : 'NOT assigned'}
- Revenue: $${revenue.toFixed(2)} (database)
- Cost: $${totalCost.toFixed(2)}
- Margin: ${marginPct.toFixed(1)}% ${confirmedFinancials.margin_is_healthy ? '(HEALTHY)' : '(needs attention)'}
- Status: ${trip.status}
- Distance: ${tripData.planned_miles} miles
- Utilization: ${tripData.utilization_percent}%${tripData.limiting_factor ? ` (limited by ${tripData.limiting_factor})` : ''}
`;

    // Build the prompt
    const userPrompt = `
TRIP: ${JSON.stringify(tripData, null, 2)}

ORDER: ${JSON.stringify(orderData, null, 2)}

DRIVER: ${JSON.stringify(driverData, null, 2)}

UNIT: ${JSON.stringify(unitData, null, 2)}

CONFIRMED FINANCIALS: ${JSON.stringify(confirmedFinancials, null, 2)}

CRITICAL CONTEXT:
${criticalContext}

Analyze this trip and return insights in the specified JSON format. Remember:
- DO NOT flag missing data when CONFIRMED FINANCIALS shows values > $0
- DO NOT flag driver/unit as incomplete when assigned = true
- START with positive insights when data is complete
- Be specific with numbers from the data provided
`;

    // Load system prompt from file
    let systemPrompt = '';
    try {
      systemPrompt = fs.readFileSync(
        path.join(process.cwd(), 'AI_TRIP_INSIGHTS_PROMPT.md'),
        'utf-8'
      );
    } catch (e) {
      console.error('Failed to read system prompt file:', e);
      return NextResponse.json(
        { error: 'System configuration error' },
        { status: 500 }
      );
    }

    // Call Claude API
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // Parse JSON response from Claude
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Claude response:', content.text);
      throw new Error('Failed to parse AI response');
    }

    const insights: TripInsightData = JSON.parse(jsonMatch[0]);

    // Add enrichment metadata
    const enrichedInsights = {
      ...insights,
      metadata: {
        generated_at: new Date().toISOString(),
        trip_id: tripId,
        has_order: !!order,
        has_driver: !!driver,
        has_unit: !!unit,
        data_completeness: {
          trip: true,
          order: !!order,
          driver: !!driver,
          unit: !!unit,
          financials: revenue > 0 && totalCost > 0,
        },
      },
      raw_data: {
        trip: tripData,
        order: orderData,
        driver: driverData,
        unit: unitData,
        financials: confirmedFinancials,
      },
    };

    return NextResponse.json(enrichedInsights, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error: any) {
    console.error('Error generating trip insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate trip insights',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
