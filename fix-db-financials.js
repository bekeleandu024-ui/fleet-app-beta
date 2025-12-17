const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function fixFinancials() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Alter trip_costs.order_id to varchar
    console.log('Altering trip_costs.order_id to varchar...');
    const resType = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'trip_costs' AND column_name = 'order_id'");
    if (resType.rows[0].data_type === 'uuid') {
        await client.query('ALTER TABLE trip_costs ALTER COLUMN order_id TYPE VARCHAR');
    }

    // 1.5 Alter margin_pct to numeric(10,2)
    console.log('Altering trip_costs.margin_pct to numeric(10,2)...');
    await client.query('ALTER TABLE trip_costs ALTER COLUMN margin_pct TYPE NUMERIC(10,2)');
    await client.query('ALTER TABLE trip_costs ALTER COLUMN variance_pct TYPE NUMERIC(10,2)');

    // 2. Insert financial data
    console.log('Inserting financial data...');
    const financials = [
      { id: 'RLIGE0001', revenue: 605.00, cost: 504.49, miles: 250, driver_id: '03743c14-a978-493f-9750-30dead604dc8' }, // Jagjeet Singh
      { id: 'RKIST0005', revenue: 605.00, cost: 504.49, miles: 250, driver_id: 'ee82d877-962b-4b08-aba9-4b8e7dc204be' }, // Borislav Pasaricek
      { id: 'RKIMA0003', revenue: 296.00, cost: 246.80, miles: 150, driver_id: 'fab82dcb-69da-4d4b-a08a-b842fe375c09' }, // Ken Clark
      { id: 'RINCO0001', revenue: 587.00, cost: 489.49, miles: 200, driver_id: '4f3d7860-56c6-4d2f-b7c9-374461b7d773' }  // Avikash Badhan
    ];

    // Clear existing costs for these orders to avoid duplicates
    const ids = financials.map(f => f.id);
    await client.query('DELETE FROM trip_costs WHERE order_id = ANY($1)', [ids]);

    for (const f of financials) {
      // We need to generate a UUID for cost_id
      // And we need other fields?
      // trip_costs schema: cost_id, order_id, revenue, total_cost, margin_pct, profit, created_at
      
      const profit = f.revenue - f.cost;
      const margin_pct = (profit / f.revenue) * 100;

      await client.query(`
        INSERT INTO trip_costs (
          cost_id, order_id, revenue, total_cost, profit, margin_pct, miles, driver_id, calculation_formula, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, '{}', NOW(), NOW()
        )
      `, [f.id, f.revenue, f.cost, profit, margin_pct, f.miles, f.driver_id]);
    }

    await client.query('COMMIT');
    console.log('Financials fixed successfully.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error fixing financials:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixFinancials();
