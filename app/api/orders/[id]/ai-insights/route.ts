import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { calculateTripCost, type DriverType } from '@/lib/costing';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface OrderInsightData {
  order_id: string;
  summary: string;
  can_dispatch: boolean;
  recommended_driver: {
    id: string | null;
    name: string;
    type: string;
    reason: string;
    estimated_cost: number;
    margin_pct: number;
  };
  recommended_unit: {
    id: string | null;
    number: string;
    type: string;
    reason: string;
  };
  insights: Array<{
    priority: number;
    severity: 'critical' | 'warning' | 'info' | 'success';
    category: 'booking' | 'cost' | 'timeline' | 'capacity' | 'compliance';
    title: string;
    detail: string;
    action: string;
    data_points: Record<string, any>;
  }>;
  cost_comparison: Array<{
    driver_type: string;
    total_cost: number;
    margin_pct: number;
    recommendation: string;
  }>;
  booking_blockers: string[];
  positive_indicators: string[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await context.params;

  try {
    // Fetch order from database
    const orderResult = await pool.query(`
      SELECT * FROM orders WHERE id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    // Fetch available drivers (active, with hours available)
    const driversResult = await pool.query(`
      SELECT 
        d.driver_id as id,
        d.driver_name as name,
        d.driver_type as type,
        d.region,
        d.status,
        u.current_location,
        u.truck_weekly_cost,
        u.unit_number
      FROM driver_profiles d
      LEFT JOIN unit_profiles u ON d.unit_number = u.unit_number
      WHERE d.is_active = true
      ORDER BY 
        CASE 
          WHEN d.region = 'GTA' THEN 1
          WHEN d.region = 'Montreal' THEN 2
          ELSE 3
        END,
        d.driver_type ASC
      LIMIT 5
    `);

    // Fetch available units
    const unitsResult = await pool.query(`
      SELECT 
        unit_id as id,
        unit_number,
        unit_type,
        region,
        current_location,
        is_active,
        max_weight,
        max_cube,
        linear_feet
      FROM unit_profiles
      WHERE is_active = true
      ORDER BY region
      LIMIT 5
    `);

    const drivers = driversResult.rows;
    const units = unitsResult.rows;

    // Calculate distance and cost options
    const laneMiles = Number(order.lane_miles || order.distance || 380); // default to 380 if not set
    const revenue = Number(order.quoted_rate || order.revenue || order.estimated_cost || 2000);
    
    // Calculate costs for different driver types
    const pickup = order.pickup_location || '';
    const delivery = order.dropoff_location || '';
    
    const costOptions = ['RNR', 'COM', 'OO'].map((type) => {
      const cost = calculateTripCost(type as DriverType, laneMiles, pickup, delivery);
      const marginPct = revenue > 0 ? ((revenue - cost.fullyAllocatedCost) / revenue) * 100 : 0;
      
      return {
        driver_type: type,
        base_rate: cost.totalCPM,
        estimated_cost: cost.fullyAllocatedCost,
        margin_pct: Math.round(marginPct * 10) / 10,
      };
    });

    // Calculate time until pickup
    const pickupTime = order.pickup_time || order.pu_window_start || order.pickup_window_start;
    const hoursUntilPickup = pickupTime
      ? Math.round((new Date(pickupTime).getTime() - Date.now()) / (1000 * 60 * 60))
      : 999;

    // Structure data for AI
    const orderData = {
      id: order.id,
      order_number: order.order_number,
      status: order.status || 'New',
      customer: order.customer_id || order.customer_name,
      pickup_location: order.pickup_location,
      dropoff_location: order.dropoff_location,
      pickup_window_start: pickupTime,
      delivery_window_start: order.dropoff_time || order.del_window_start || order.delivery_window_start,
      lane_miles: laneMiles,
      service_level: order.order_type || order.service_level || 'Standard',
      commodity: order.special_instructions || 'General Freight',
      estimated_cost: Math.max(...costOptions.map(c => c.estimated_cost)),
      revenue: revenue,
      target_margin: 15,
      total_weight: Number(order.total_weight || 0),
      total_pallets: Number(order.total_pallets || 0),
      cubic_feet: Number(order.cubic_feet || 0),
      linear_feet_required: Number(order.linear_feet_required || 0),
    };

    const availableDrivers = drivers.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      region: d.region,
      current_location: d.current_location,
      hours_available: 70, // Default available hours
      on_time_rate: 0.95,
      truck_weekly_cost: Number(d.truck_weekly_cost || 0),
      unit_number: d.unit_number,
    }));

    const availableUnits = units.map(u => ({
      id: u.id,
      unit_number: u.unit_number,
      type: u.unit_type || 'Dry Van',
      status: u.is_active ? 'Available' : 'Maintenance',
      region: u.region,
      location: u.current_location,
      max_weight: Number(u.max_weight || 45000),
      max_cube: Number(u.max_cube || 3900),
      linear_feet: Number(u.linear_feet || 53),
    }));

    const confirmedData = {
      order_status: orderData.status,
      lane_miles: laneMiles,
      available_drivers: availableDrivers.length,
      available_units: availableUnits.length,
      pickup_urgency_hours: hoursUntilPickup,
      revenue: revenue,
      estimated_cost: orderData.estimated_cost,
    };

    // Build the prompt
    const userPrompt = `
ORDER: ${JSON.stringify(orderData, null, 2)}

AVAILABLE_DRIVERS: ${JSON.stringify(availableDrivers, null, 2)}

AVAILABLE_UNITS: ${JSON.stringify(availableUnits, null, 2)}

COSTING_OPTIONS: ${JSON.stringify(costOptions, null, 2)}

CONFIRMED DATA: ${JSON.stringify(confirmedData, null, 2)}

CRITICAL CONTEXT:
- ${availableDrivers.length} drivers available for assignment
- ${availableUnits.length} units available in fleet
- ${hoursUntilPickup} hours until pickup window
- ${laneMiles} miles from ${pickup} to ${delivery}
- Revenue: $${revenue.toFixed(2)}, Best cost: $${costOptions[0].estimated_cost.toFixed(2)}
- Best margin: ${costOptions[0].margin_pct}%

Analyze this order and provide booking recommendations in the specified JSON format.
`;

    // Load system prompt from file
    let systemPrompt = '';
    try {
      systemPrompt = fs.readFileSync(
        path.join(process.cwd(), 'AI_ORDER_INSIGHTS_PROMPT.md'),
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

    const insights: OrderInsightData = JSON.parse(jsonMatch[0]);

    // Add enrichment metadata
    const enrichedInsights = {
      ...insights,
      metadata: {
        generated_at: new Date().toISOString(),
        order_id: orderId,
        data_completeness: {
          order: true,
          drivers: drivers.length > 0,
          units: units.length > 0,
          costing: costOptions.length > 0,
        },
      },
      raw_data: {
        order: orderData,
        drivers: availableDrivers,
        units: availableUnits,
        costing_options: costOptions,
        confirmed: confirmedData,
      },
    };

    return NextResponse.json(enrichedInsights);

  } catch (error: any) {
    console.error('Error generating order insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate order insights',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
