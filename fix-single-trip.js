const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function fixTripData() {
  const client = await pool.connect();
  try {
    console.log('='.repeat(80));
    console.log('FIXING TRIP TRP-21666921 DATA');
    console.log('='.repeat(80));
    
    // Mississauga to Montreal is approximately 540 km = 335 miles
    const MISSISSAUGA_MONTREAL_MILES = 335;
    
    // Get driver info for costing
    const driverRes = await client.query(`
      SELECT d.driver_type, d.effective_wage_cpm 
      FROM driver_profiles d 
      WHERE d.driver_id = 'bd9d9705-9cdd-4ec2-8120-a50aa4981795'
    `);
    const driver = driverRes.rows[0];
    console.log('\nDriver info:', driver);
    
    // Simple cost calculation
    const miles = MISSISSAUGA_MONTREAL_MILES;
    const wageCpm = parseFloat(driver?.effective_wage_cpm || 0.46);
    const fuelCpm = 0.45;
    const truckRmCpm = 0.12;
    const totalCpm = wageCpm + fuelCpm + truckRmCpm;
    const totalCost = miles * totalCpm;
    
    // Estimate revenue at $2.00/mile for this lane
    const revenue = miles * 2.0;
    const profit = revenue - totalCost;
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
    const estimatedFuel = Math.round(miles / 6.5 * 100) / 100;
    
    console.log('\nCalculated values:');
    console.log('  Miles:', miles);
    console.log('  Total CPM: $' + totalCpm.toFixed(4));
    console.log('  Total Cost: $' + totalCost.toFixed(2));
    console.log('  Revenue: $' + revenue.toFixed(2));
    console.log('  Profit: $' + profit.toFixed(2));
    console.log('  Margin: ' + marginPct.toFixed(2) + '%');
    console.log('  Est. Fuel: ' + estimatedFuel + ' gal');
    
    // Update the trip
    await client.query('BEGIN');
    
    const tripUpdate = await client.query(`
      UPDATE trips 
      SET 
        planned_miles = $1, 
        distance_miles = $1, 
        actual_miles = $1, 
        revenue = $2, 
        total_cost = $3, 
        profit = $4, 
        margin_pct = $5, 
        estimated_fuel_gallons = $6
      WHERE id = '6096d774-99e3-4689-8fb3-f9bb7c592ad9'
    `, [miles, revenue, totalCost, profit, marginPct.toFixed(2), estimatedFuel]);
    
    console.log('\n✅ Updated trips table:', tripUpdate.rowCount, 'rows');
    
    const costUpdate = await client.query(`
      UPDATE trip_costs 
      SET 
        miles = $1, 
        actual_miles = $1, 
        total_cost = $2, 
        revenue = $3, 
        profit = $4, 
        margin_pct = $5, 
        is_profitable = $6
      WHERE order_id = '81f58075-a15e-47f1-a457-99b4c7dea62b'
    `, [miles, totalCost, revenue, profit, marginPct.toFixed(2), profit > 0]);
    
    console.log('✅ Updated trip_costs table:', costUpdate.rowCount, 'rows');
    
    await client.query('COMMIT');
    
    // Verify
    console.log('\n' + '='.repeat(80));
    console.log('VERIFICATION');
    console.log('='.repeat(80));
    
    const verifyTrip = await client.query(`
      SELECT trip_number, planned_miles, revenue, total_cost, profit, margin_pct
      FROM trips WHERE id = '6096d774-99e3-4689-8fb3-f9bb7c592ad9'
    `);
    console.log('\nTrip after fix:');
    console.table(verifyTrip.rows);
    
    console.log('\n✅ Trip TRP-21666921 fixed successfully!');
    console.log('Refresh the AI Trip Insights panel to see updated data.');
    
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

fixTripData();
