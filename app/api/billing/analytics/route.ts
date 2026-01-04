import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * GET /api/billing/analytics
 * Returns billing variance analytics comparing quoted_rate vs final_billable_amount
 */
export async function GET() {
  try {
    // Summary metrics for audited/invoiced orders
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE billing_status = 'PENDING') as pending_count,
        COUNT(*) FILTER (WHERE billing_status = 'AUDITED') as audited_count,
        COUNT(*) FILTER (WHERE billing_status = 'INVOICED') as invoiced_count,
        COUNT(*) FILTER (WHERE billing_status = 'PAID') as paid_count,
        SUM(quoted_rate) FILTER (WHERE billing_status IN ('AUDITED', 'INVOICED', 'PAID')) as total_quoted,
        SUM(final_billable_amount) FILTER (WHERE billing_status IN ('AUDITED', 'INVOICED', 'PAID')) as total_final,
        AVG(final_billable_amount - quoted_rate) FILTER (WHERE billing_status IN ('AUDITED', 'INVOICED', 'PAID') AND quoted_rate > 0) as avg_variance,
        AVG((final_billable_amount - quoted_rate) / NULLIF(quoted_rate, 0) * 100) FILTER (WHERE billing_status IN ('AUDITED', 'INVOICED', 'PAID') AND quoted_rate > 0) as avg_variance_pct
      FROM orders
      WHERE quoted_rate IS NOT NULL OR final_billable_amount IS NOT NULL
    `);

    const summary = summaryResult.rows[0] || {};

    // Recent audited orders with variance
    const recentVarianceResult = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.quoted_rate,
        o.final_billable_amount,
        o.billing_status,
        o.billing_finalized_at,
        o.billing_notes,
        (o.final_billable_amount - o.quoted_rate) as variance_amount,
        CASE WHEN o.quoted_rate > 0 
          THEN ((o.final_billable_amount - o.quoted_rate) / o.quoted_rate * 100) 
          ELSE 0 
        END as variance_pct
      FROM orders o
      WHERE o.billing_status IN ('AUDITED', 'INVOICED', 'PAID')
        AND o.quoted_rate IS NOT NULL 
        AND o.final_billable_amount IS NOT NULL
      ORDER BY o.billing_finalized_at DESC NULLS LAST
      LIMIT 20
    `);

    // Accessorial breakdown for finalized orders
    const accessorialResult = await pool.query(`
      SELECT 
        oa.accessorial_code,
        oa.accessorial_name,
        COUNT(*) as count,
        SUM(oa.total_price) as total_amount,
        AVG(oa.total_price) as avg_amount
      FROM order_accessorials oa
      JOIN orders o ON oa.order_id = o.id
      WHERE o.billing_status IN ('AUDITED', 'INVOICED', 'PAID')
      GROUP BY oa.accessorial_code, oa.accessorial_name
      ORDER BY total_amount DESC
    `);

    // Variance distribution (buckets)
    const varianceDistResult = await pool.query(`
      SELECT 
        bucket,
        COUNT(*) as count
      FROM (
        SELECT 
          CASE 
            WHEN variance_pct < -10 THEN 'Under 10%+'
            WHEN variance_pct < -5 THEN 'Under 5-10%'
            WHEN variance_pct < 0 THEN 'Under 0-5%'
            WHEN variance_pct = 0 THEN 'No Variance'
            WHEN variance_pct < 5 THEN 'Over 0-5%'
            WHEN variance_pct < 10 THEN 'Over 5-10%'
            ELSE 'Over 10%+'
          END as bucket
        FROM (
          SELECT 
            CASE WHEN quoted_rate > 0 
              THEN ((COALESCE(final_billable_amount, quoted_rate) - quoted_rate) / quoted_rate * 100) 
              ELSE 0 
            END as variance_pct
          FROM orders
          WHERE billing_status IN ('AUDITED', 'INVOICED', 'PAID')
            AND quoted_rate IS NOT NULL 
            AND quoted_rate > 0
        ) variance_calc
      ) bucketed
      GROUP BY bucket
      ORDER BY 
        CASE bucket
          WHEN 'Under 10%+' THEN 1
          WHEN 'Under 5-10%' THEN 2
          WHEN 'Under 0-5%' THEN 3
          WHEN 'No Variance' THEN 4
          WHEN 'Over 0-5%' THEN 5
          WHEN 'Over 5-10%' THEN 6
          WHEN 'Over 10%+' THEN 7
        END
    `);

    return NextResponse.json({
      summary: {
        pendingCount: Number(summary.pending_count) || 0,
        auditedCount: Number(summary.audited_count) || 0,
        invoicedCount: Number(summary.invoiced_count) || 0,
        paidCount: Number(summary.paid_count) || 0,
        totalQuoted: Number(summary.total_quoted) || 0,
        totalFinal: Number(summary.total_final) || 0,
        avgVariance: Number(summary.avg_variance) || 0,
        avgVariancePct: Number(summary.avg_variance_pct) || 0,
        netVariance: (Number(summary.total_final) || 0) - (Number(summary.total_quoted) || 0),
      },
      recentVariance: recentVarianceResult.rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        orderNumber: row.order_number,
        customer: row.customer_name,
        quotedRate: Number(row.quoted_rate),
        finalAmount: Number(row.final_billable_amount),
        billingStatus: row.billing_status,
        finalizedAt: row.billing_finalized_at,
        notes: row.billing_notes,
        varianceAmount: Number(row.variance_amount),
        variancePct: Number(row.variance_pct),
      })),
      accessorialBreakdown: accessorialResult.rows.map((row: Record<string, unknown>) => ({
        type: row.accessorial_code || row.accessorial_name,
        name: row.accessorial_name,
        count: Number(row.count),
        totalAmount: Number(row.total_amount),
        avgAmount: Number(row.avg_amount),
      })),
      varianceDistribution: varianceDistResult.rows.map((row: Record<string, unknown>) => ({
        bucket: row.bucket,
        count: Number(row.count),
      })),
    });
  } catch (error) {
    console.error("Billing analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing analytics" },
      { status: 500 }
    );
  }
}
