const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function fixUnitProfilesCosts() {
  const client = await pool.connect();
  try {
    console.log('='.repeat(80));
    console.log('FIX UNIT PROFILES WEEKLY COSTS');
    console.log('='.repeat(80));
    
    // ========================================================================
    // ANALYSIS PHASE
    // ========================================================================
    
    console.log('\n📊 PHASE 1: LOADING COSTING RULES\n');
    
    // Load costing rules
    const rules = await client.query(`SELECT rule_key, rule_type, rule_value FROM costing_rules WHERE is_active = true`);
    
    const costingRules = {};
    for (const rule of rules.rows) {
      if (!costingRules[rule.rule_key]) costingRules[rule.rule_key] = {};
      costingRules[rule.rule_key][rule.rule_type] = parseFloat(rule.rule_value);
    }
    
    // Extract weekly costs from rules
    const dtopsWeekly = costingRules['DTOPS_WK']?.['GLOBAL'] || 120.00;
    const insuranceWeekly = costingRules['INS_WK']?.['GLOBAL'] || 450.00;
    const isaacWeekly = costingRules['ISSAC_WK']?.['GLOBAL'] || 35.00;
    const miscWeekly = costingRules['MISC_WK']?.['GLOBAL'] || 75.00;
    const prepassWeekly = costingRules['PP_WK']?.['GLOBAL'] || 25.00;
    const sgaWeekly = costingRules['SGA_WK']?.['GLOBAL'] || 180.00;
    const trailerWeekly = costingRules['TRAILER_WK']?.['GLOBAL'] || 250.00;
    
    console.log('Weekly costs from costing_rules:');
    console.log(`  DTOPS_WK (Dispatch/Ops):  $${dtopsWeekly.toFixed(2)}`);
    console.log(`  INS_WK (Insurance):       $${insuranceWeekly.toFixed(2)}`);
    console.log(`  ISSAC_WK (Isaac ELD):     $${isaacWeekly.toFixed(2)}`);
    console.log(`  MISC_WK (Miscellaneous):  $${miscWeekly.toFixed(2)}`);
    console.log(`  PP_WK (PrePass):          $${prepassWeekly.toFixed(2)}`);
    console.log(`  SGA_WK (SG&A):            $${sgaWeekly.toFixed(2)}`);
    console.log(`  TRAILER_WK (Trailer):     $${trailerWeekly.toFixed(2)}`);
    
    // Check current state
    const analysis = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(NULLIF(truck_weekly_cost, 0)) as has_truck_cost,
        COUNT(NULLIF(dtops_weekly_cost, 0)) as has_dtops,
        COUNT(NULLIF(insurance_weekly_cost, 0)) as has_insurance,
        COUNT(NULLIF(isaac_weekly_cost, 0)) as has_isaac,
        COUNT(NULLIF(misc_weekly_cost, 0)) as has_misc,
        COUNT(NULLIF(prepass_weekly_cost, 0)) as has_prepass,
        COUNT(NULLIF(sga_weekly_cost, 0)) as has_sga,
        COUNT(NULLIF(trailer_weekly_cost, 0)) as has_trailer,
        COUNT(NULLIF(total_weekly_cost, 0)) as has_total
      FROM unit_profiles
    `);
    console.log('\nCurrent unit_profiles state:');
    console.table(analysis.rows[0]);
    
    // ========================================================================
    // FIX PHASE
    // ========================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 PHASE 2: APPLYING FIXES');
    console.log('='.repeat(80));
    
    await client.query('BEGIN');
    
    // ---------------------------------------------------------------------
    // FIX 1: Set standard weekly costs from costing_rules
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 1: Setting weekly costs from costing_rules...');
    
    const fixWeeklyCosts = await client.query(`
      UPDATE unit_profiles
      SET 
        dtops_weekly_cost = $1,
        insurance_weekly_cost = $2,
        isaac_weekly_cost = $3,
        misc_weekly_cost = $4,
        prepass_weekly_cost = $5,
        sga_weekly_cost = $6,
        trailer_weekly_cost = $7
      WHERE 
        (dtops_weekly_cost IS NULL OR dtops_weekly_cost = 0) OR
        (insurance_weekly_cost IS NULL OR insurance_weekly_cost = 0) OR
        (isaac_weekly_cost IS NULL OR isaac_weekly_cost = 0) OR
        (misc_weekly_cost IS NULL OR misc_weekly_cost = 0) OR
        (prepass_weekly_cost IS NULL OR prepass_weekly_cost = 0) OR
        (sga_weekly_cost IS NULL OR sga_weekly_cost = 0) OR
        (trailer_weekly_cost IS NULL OR trailer_weekly_cost = 0)
    `, [dtopsWeekly, insuranceWeekly, isaacWeekly, miscWeekly, prepassWeekly, sgaWeekly, trailerWeekly]);
    
    console.log(`   ✅ Updated ${fixWeeklyCosts.rowCount} units with weekly costs`);
    
    // ---------------------------------------------------------------------
    // FIX 2: Calculate total_weekly_cost
    // total = truck + trailer + insurance + isaac + prepass + dtops + sga + misc
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 2: Calculating total_weekly_cost...');
    
    const fixTotalCost = await client.query(`
      UPDATE unit_profiles
      SET total_weekly_cost = 
        COALESCE(truck_weekly_cost, 0) +
        COALESCE(trailer_weekly_cost, 0) +
        COALESCE(insurance_weekly_cost, 0) +
        COALESCE(isaac_weekly_cost, 0) +
        COALESCE(prepass_weekly_cost, 0) +
        COALESCE(dtops_weekly_cost, 0) +
        COALESCE(sga_weekly_cost, 0) +
        COALESCE(misc_weekly_cost, 0)
    `);
    console.log(`   ✅ Calculated total_weekly_cost for ${fixTotalCost.rowCount} units`);
    
    await client.query('COMMIT');
    console.log('\n✅ All fixes committed successfully!');
    
    // ========================================================================
    // VERIFICATION PHASE
    // ========================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PHASE 3: VERIFYING RESULTS');
    console.log('='.repeat(80));
    
    const after = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(NULLIF(truck_weekly_cost, 0)) as has_truck_cost,
        COUNT(NULLIF(dtops_weekly_cost, 0)) as has_dtops,
        COUNT(NULLIF(insurance_weekly_cost, 0)) as has_insurance,
        COUNT(NULLIF(isaac_weekly_cost, 0)) as has_isaac,
        COUNT(NULLIF(misc_weekly_cost, 0)) as has_misc,
        COUNT(NULLIF(prepass_weekly_cost, 0)) as has_prepass,
        COUNT(NULLIF(sga_weekly_cost, 0)) as has_sga,
        COUNT(NULLIF(trailer_weekly_cost, 0)) as has_trailer,
        COUNT(NULLIF(total_weekly_cost, 0)) as has_total
      FROM unit_profiles
    `);
    console.log('\nAfter fix:');
    console.table(after.rows[0]);
    
    // Sample
    console.log('\n📋 Sample Units with Costs:');
    const sample = await client.query(`
      SELECT 
        unit_number,
        truck_weekly_cost as truck,
        trailer_weekly_cost as trailer,
        insurance_weekly_cost as insurance,
        isaac_weekly_cost as isaac,
        prepass_weekly_cost as prepass,
        dtops_weekly_cost as dtops,
        sga_weekly_cost as sga,
        misc_weekly_cost as misc,
        total_weekly_cost as total
      FROM unit_profiles
      LIMIT 5
    `);
    console.table(sample.rows);
    
    // Summary stats
    const stats = await client.query(`
      SELECT 
        ROUND(AVG(total_weekly_cost)::numeric, 2) as avg_total,
        ROUND(MIN(total_weekly_cost)::numeric, 2) as min_total,
        ROUND(MAX(total_weekly_cost)::numeric, 2) as max_total
      FROM unit_profiles
    `);
    console.log('\n📈 Cost Summary:');
    console.table(stats.rows[0]);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ UNIT PROFILES COSTS FIX COMPLETE');
    console.log('='.repeat(80));
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error occurred, rolled back changes:', err);
    throw err;
  } finally {
    client.release();
  }
}

fixUnitProfilesCosts()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
