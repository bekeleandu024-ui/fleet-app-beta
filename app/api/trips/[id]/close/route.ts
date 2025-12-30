import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const body = await request.json();

    const {
      actualRevenue,
      accessorialCharges,
      deductions,
      finalCost,
      finalMargin,
      finalMarginPercent,
      documents,
      notes,
      closedAt,
      actualMiles, // Allow override from UI
      actualFuelGallons, // Allow override from UI
    } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get trip details to populate actual values
      const tripDetails = await client.query(`
        SELECT planned_miles, distance_miles, estimated_fuel_gallons
        FROM trips WHERE id = $1
      `, [tripId]);
      
      const trip = tripDetails.rows[0];
      
      // Calculate actual miles: use provided value, or distance_miles, or planned_miles
      const finalActualMiles = actualMiles ?? trip?.distance_miles ?? trip?.planned_miles;
      
      // Calculate actual fuel: use provided value, estimated fuel, or calculate from miles
      const AVG_MPG = 6.5;
      const finalActualFuel = actualFuelGallons 
        ?? trip?.estimated_fuel_gallons 
        ?? (finalActualMiles ? Math.round((finalActualMiles / AVG_MPG) * 100) / 100 : null);

      // 1. Update trip status to "Closed" and set actual tracking values
      await client.query(`
        UPDATE trips 
        SET 
          status = 'closed',
          closed_at = $2,
          actual_miles = COALESCE($4, actual_miles, distance_miles, planned_miles),
          actual_fuel_gallons = COALESCE($5, actual_fuel_gallons, estimated_fuel_gallons),
          notes = COALESCE(notes, '') || E'\n[Closed]: ' || $3
        WHERE id = $1
      `, [tripId, closedAt || new Date().toISOString(), notes || '', finalActualMiles, finalActualFuel]);

      // 2. Update or Insert final financial data into trip_costs
      // First check if a cost record exists
      const costRes = await client.query(`SELECT cost_id FROM trip_costs WHERE order_id = (SELECT order_id::uuid FROM trips WHERE id = $1)`, [tripId]);
      
      const finalRevenue = (Number(actualRevenue) || 0) + (Number(accessorialCharges) || 0) - (Number(deductions) || 0);
      const profit = finalRevenue - (Number(finalCost) || 0);
      const marginPct = finalRevenue > 0 ? (profit / finalRevenue) * 100 : 0;

      if (costRes.rows.length > 0) {
        // Update existing - also set actual_miles
        await client.query(`
          UPDATE trip_costs
          SET
            revenue = $2,
            total_cost = $3,
            profit = $4,
            margin_pct = $5,
            is_profitable = $6,
            actual_miles = COALESCE($7, actual_miles, miles),
            updated_at = NOW()
          WHERE cost_id = $1
        `, [
          costRes.rows[0].cost_id,
          finalRevenue,
          finalCost,
          profit,
          marginPct,
          profit > 0,
          finalActualMiles
        ]);
      } else {
        // Insert new (fallback if it wasn't created at booking)
        // We need to fetch trip details to populate other fields
        const tripDetailsForCost = await client.query(`
          SELECT 
            t.order_id, t.driver_id, t.unit_id, t.planned_miles, t.actual_miles,
            d.driver_type
          FROM trips t
          LEFT JOIN driver_profiles d ON t.driver_id = d.driver_id
          WHERE t.id = $1
        `, [tripId]);

        if (tripDetailsForCost.rows.length > 0) {
          const tripForCost = tripDetailsForCost.rows[0];
          const milesForCost = finalActualMiles || tripForCost.actual_miles || tripForCost.planned_miles || 0;
          await client.query(`
            INSERT INTO trip_costs (
              cost_id,
              trip_id,
              order_id,
              driver_id,
              unit_id,
              driver_type,
              miles,
              actual_miles,
              total_cost,
              revenue,
              profit,
              margin_pct,
              is_profitable,
              calculation_formula,
              created_at,
              updated_at
            ) VALUES (
              gen_random_uuid(),
              $1::uuid,
              $2::uuid,
              $3,
              $4,
              $5,
              $6,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              NOW(),
              NOW()
            )
          `, [
            tripId,
            tripForCost.order_id,
            tripForCost.driver_id,
            tripForCost.unit_id,
            tripForCost.driver_type || 'Unknown',
            milesForCost,
            finalCost,
            finalRevenue,
            profit,
            marginPct,
            profit > 0,
            JSON.stringify({ method: 'manual_close' })
          ]);
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        tripId,
        status: "Closed"
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error closing trip:", error);
    return NextResponse.json(
      { error: "Failed to close trip" },
      { status: 500 }
    );
  }
}
