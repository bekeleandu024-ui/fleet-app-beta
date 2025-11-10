import { Router, Request, Response } from 'express';
import { pool } from '../db/client';

const router = Router();

/**
 * GET /api/metadata/rules
 * Get all costing rules
 */
router.get('/rules', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT rule_key, rule_type, rule_value, description, is_active, effective_date
       FROM costing_rules 
       ORDER BY rule_key, rule_type`
    );
    res.json({
      count: result.rows.length,
      rules: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching costing rules:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/metadata/drivers
 * Get all driver profiles
 */
router.get('/drivers', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT driver_id, driver_name, unit_number, driver_type, oo_zone,
              base_wage_cpm, benefits_pct, performance_pct, safety_pct, step_pct,
              effective_wage_cpm, is_active, created_at, updated_at
       FROM driver_profiles 
       ORDER BY driver_name`
    );
    res.json({
      count: result.rows.length,
      drivers: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/metadata/units
 * Get all unit profiles
 */
router.get('/units', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.unit_id, u.unit_number, u.driver_id, 
              d.driver_name, d.driver_type,
              u.truck_weekly_cost, u.trailer_weekly_cost, u.insurance_weekly_cost,
              u.isaac_weekly_cost, u.prepass_weekly_cost, u.sga_weekly_cost,
              u.dtops_weekly_cost, u.misc_weekly_cost, u.total_weekly_cost,
              u.is_active, u.created_at, u.updated_at
       FROM unit_profiles u
       LEFT JOIN driver_profiles d ON u.driver_id = d.driver_id
       ORDER BY u.unit_number`
    );
    res.json({
      count: result.rows.length,
      units: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/metadata/events
 * Get all event types and rules
 */
router.get('/events', async (_req: Request, res: Response) => {
  try {
    const typesResult = await pool.query(
      `SELECT event_id, event_code, event_name, cost_per_event, is_automatic, created_at
       FROM event_types 
       ORDER BY event_code`
    );

    const rulesResult = await pool.query(
      `SELECT r.rule_id, r.event_code, t.event_name, r.trigger_type, r.trigger_condition
       FROM event_rules r
       JOIN event_types t ON r.event_code = t.event_code
       ORDER BY r.event_code`
    );

    res.json({
      event_types: {
        count: typesResult.rows.length,
        types: typesResult.rows
      },
      event_rules: {
        count: rulesResult.rows.length,
        rules: rulesResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/metadata/summary
 * Get system-wide metadata summary
 */
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const [rulesCount, driversCount, unitsCount, eventsCount, costsCount, ordersCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM costing_rules WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM driver_profiles WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM unit_profiles WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM event_types'),
      pool.query('SELECT COUNT(*) as count FROM trip_costs'),
      pool.query('SELECT COUNT(*) as count FROM orders'),
    ]);

    res.json({
      summary: {
        active_rules: parseInt(rulesCount.rows[0].count),
        active_drivers: parseInt(driversCount.rows[0].count),
        active_units: parseInt(unitsCount.rows[0].count),
        event_types: parseInt(eventsCount.rows[0].count),
        cost_calculations: parseInt(costsCount.rows[0].count),
        total_orders: parseInt(ordersCount.rows[0].count),
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
