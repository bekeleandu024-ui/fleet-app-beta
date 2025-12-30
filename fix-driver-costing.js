const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function fixDriverCostingData() {
  const client = await pool.connect();
  try {
    console.log('='.repeat(80));
    console.log('FIX DRIVER PROFILES COSTING DATA');
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
    
    console.log('Loaded costing rules:');
    console.log('  BASE_WAGE:', costingRules['BASE_WAGE']);
    console.log('  BENEFITS_PCT:', costingRules['BENEFITS_PCT']);
    console.log('  PERF_PCT:', costingRules['PERF_PCT']);
    console.log('  SAFETY_PCT:', costingRules['SAFETY_PCT']);
    console.log('  STEP_PCT:', costingRules['STEP_PCT']);
    
    // Check current state
    const analysis = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(NULLIF(base_wage_cpm, 0)) as has_base_wage,
        COUNT(NULLIF(benefits_pct, 0)) as has_benefits,
        COUNT(NULLIF(effective_wage_cpm, 0)) as has_effective,
        COUNT(status) as has_status,
        COUNT(oo_zone) as has_oo_zone
      FROM driver_profiles
    `);
    console.log('\nCurrent driver_profiles state:');
    console.table(analysis.rows[0]);
    
    // Driver type breakdown
    const typeBreakdown = await client.query(`
      SELECT driver_type, COUNT(*) as cnt FROM driver_profiles GROUP BY driver_type ORDER BY cnt DESC
    `);
    console.log('\nDriver types:');
    console.table(typeBreakdown.rows);
    
    // ========================================================================
    // FIX PHASE
    // ========================================================================
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 PHASE 2: APPLYING FIXES');
    console.log('='.repeat(80));
    
    await client.query('BEGIN');
    
    // Get global percentages
    const benefitsPct = costingRules['BENEFITS_PCT']?.['GLOBAL'] || 0.12;
    const perfPct = costingRules['PERF_PCT']?.['GLOBAL'] || 0.05;
    const safetyPct = costingRules['SAFETY_PCT']?.['GLOBAL'] || 0.03;
    const stepPct = costingRules['STEP_PCT']?.['GLOBAL'] || 0.02;
    
    // ---------------------------------------------------------------------
    // FIX 1: Set base_wage_cpm based on driver_type from costing_rules
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 1: Setting base_wage_cpm from costing_rules...');
    
    // COM drivers
    const comWage = costingRules['BASE_WAGE']?.['COM'] || 0.45;
    const fixCom = await client.query(`
      UPDATE driver_profiles
      SET base_wage_cpm = $1
      WHERE driver_type = 'COM'
        AND (base_wage_cpm IS NULL OR base_wage_cpm = 0)
    `, [comWage]);
    console.log(`   ✅ Updated ${fixCom.rowCount} COM drivers with base_wage_cpm = ${comWage}`);
    
    // RNR drivers
    const rnrWage = costingRules['BASE_WAGE']?.['RNR'] || 0.38;
    const fixRnr = await client.query(`
      UPDATE driver_profiles
      SET base_wage_cpm = $1
      WHERE driver_type = 'RNR'
        AND (base_wage_cpm IS NULL OR base_wage_cpm = 0)
    `, [rnrWage]);
    console.log(`   ✅ Updated ${fixRnr.rowCount} RNR drivers with base_wage_cpm = ${rnrWage}`);
    
    // OO drivers - need to assign zones first
    console.log('\n🔧 FIX 2: Assigning oo_zone to Owner Operators...');
    
    // Distribute OO drivers across zones (Zone1: 40%, Zone2: 35%, Zone3: 25%)
    // First, get all OO drivers without a zone
    const ooDrivers = await client.query(`
      SELECT driver_id FROM driver_profiles 
      WHERE driver_type = 'OO' AND (oo_zone IS NULL OR oo_zone = '')
      ORDER BY driver_id
    `);
    
    let zone1Count = 0, zone2Count = 0, zone3Count = 0;
    const totalOO = ooDrivers.rows.length;
    
    for (let i = 0; i < totalOO; i++) {
      const driverId = ooDrivers.rows[i].driver_id;
      let zone;
      
      // Distribute: first 40% Zone1, next 35% Zone2, rest Zone3
      if (i < totalOO * 0.4) {
        zone = 'ZONE1';
        zone1Count++;
      } else if (i < totalOO * 0.75) {
        zone = 'ZONE2';
        zone2Count++;
      } else {
        zone = 'ZONE3';
        zone3Count++;
      }
      
      await client.query(`UPDATE driver_profiles SET oo_zone = $1 WHERE driver_id = $2`, [zone, driverId]);
    }
    console.log(`   ✅ Assigned zones: ${zone1Count} ZONE1, ${zone2Count} ZONE2, ${zone3Count} ZONE3`);
    
    // Set OO base wages based on zone
    const zone1Wage = costingRules['BASE_WAGE']?.['OO_ZONE1'] || 0.72;
    const zone2Wage = costingRules['BASE_WAGE']?.['OO_ZONE2'] || 0.68;
    const zone3Wage = costingRules['BASE_WAGE']?.['OO_ZONE3'] || 0.65;
    
    await client.query(`UPDATE driver_profiles SET base_wage_cpm = $1 WHERE driver_type = 'OO' AND oo_zone = 'ZONE1' AND (base_wage_cpm IS NULL OR base_wage_cpm = 0)`, [zone1Wage]);
    await client.query(`UPDATE driver_profiles SET base_wage_cpm = $1 WHERE driver_type = 'OO' AND oo_zone = 'ZONE2' AND (base_wage_cpm IS NULL OR base_wage_cpm = 0)`, [zone2Wage]);
    await client.query(`UPDATE driver_profiles SET base_wage_cpm = $1 WHERE driver_type = 'OO' AND oo_zone = 'ZONE3' AND (base_wage_cpm IS NULL OR base_wage_cpm = 0)`, [zone3Wage]);
    console.log(`   ✅ Set OO base wages: ZONE1=${zone1Wage}, ZONE2=${zone2Wage}, ZONE3=${zone3Wage}`);
    
    // ---------------------------------------------------------------------
    // FIX 3: Set percentage fields from global costing rules
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 3: Setting percentage fields from costing_rules...');
    
    const fixPercentages = await client.query(`
      UPDATE driver_profiles
      SET 
        benefits_pct = $1,
        performance_pct = $2,
        safety_pct = $3,
        step_pct = $4
      WHERE benefits_pct = 0 OR performance_pct = 0 OR safety_pct = 0 OR step_pct = 0
    `, [benefitsPct, perfPct, safetyPct, stepPct]);
    console.log(`   ✅ Updated ${fixPercentages.rowCount} drivers with:`);
    console.log(`      benefits_pct = ${benefitsPct} (${(benefitsPct * 100).toFixed(1)}%)`);
    console.log(`      performance_pct = ${perfPct} (${(perfPct * 100).toFixed(1)}%)`);
    console.log(`      safety_pct = ${safetyPct} (${(safetyPct * 100).toFixed(1)}%)`);
    console.log(`      step_pct = ${stepPct} (${(stepPct * 100).toFixed(1)}%)`);
    
    // ---------------------------------------------------------------------
    // FIX 4: Calculate effective_wage_cpm
    // effective = base * (1 + benefits + performance + safety + step)
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 4: Calculating effective_wage_cpm...');
    
    const fixEffective = await client.query(`
      UPDATE driver_profiles
      SET effective_wage_cpm = base_wage_cpm * (1 + benefits_pct + performance_pct + safety_pct + step_pct)
      WHERE base_wage_cpm > 0
    `);
    console.log(`   ✅ Calculated effective_wage_cpm for ${fixEffective.rowCount} drivers`);
    
    // ---------------------------------------------------------------------
    // FIX 5: Set status field
    // ---------------------------------------------------------------------
    console.log('\n🔧 FIX 5: Setting status field...');
    
    const fixStatus = await client.query(`
      UPDATE driver_profiles
      SET status = CASE 
        WHEN is_active = true THEN 'Active'
        ELSE 'Inactive'
      END
      WHERE status IS NULL
    `);
    console.log(`   ✅ Set status for ${fixStatus.rowCount} drivers`);
    
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
        COUNT(NULLIF(base_wage_cpm, 0)) as has_base_wage,
        COUNT(NULLIF(benefits_pct, 0)) as has_benefits,
        COUNT(NULLIF(effective_wage_cpm, 0)) as has_effective,
        COUNT(status) as has_status,
        COUNT(oo_zone) as has_oo_zone
      FROM driver_profiles
    `);
    console.log('\nAfter fix:');
    console.table(after.rows[0]);
    
    // Sample by type
    console.log('\n📋 Sample Drivers by Type:');
    const sample = await client.query(`
      SELECT 
        driver_name,
        driver_type,
        oo_zone,
        status,
        ROUND(base_wage_cpm::numeric, 4) as base_wage_cpm,
        ROUND(benefits_pct::numeric, 4) as benefits_pct,
        ROUND(performance_pct::numeric, 4) as perf_pct,
        ROUND(effective_wage_cpm::numeric, 4) as effective_cpm
      FROM driver_profiles
      ORDER BY driver_type, oo_zone NULLS LAST
      LIMIT 10
    `);
    console.table(sample.rows);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DRIVER PROFILES COSTING FIX COMPLETE');
    console.log('='.repeat(80));
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error occurred, rolled back changes:', err);
    throw err;
  } finally {
    client.release();
  }
}

fixDriverCostingData()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
