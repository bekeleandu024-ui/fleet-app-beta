/**
 * Test script for Dispatch Simulation API
 * 
 * Run: node test-dispatch-simulation.js
 */

const testSimulation = async () => {
  console.log('='.repeat(70));
  console.log('DISPATCH SIMULATION API TEST');
  console.log('='.repeat(70));

  // Test Case 1: Basic Dry Van trip from Milton to Windsor
  const testRequest = {
    trip_id: 'DFT-TEST-001',
    trip_requirements: {
      weight: 35000,
      equipment_type: 'Dry Van'
    },
    route: [
      { 
        type: 'PICKUP', 
        location_id: 'LOC_COMTECH', 
        city: 'Milton', 
        zip: 'L9T',
        lat: 43.5183,
        lng: -79.8774
      },
      { 
        type: 'DROP', 
        location_id: 'LOC_WINDSOR', 
        city: 'Windsor', 
        zip: 'N9A',
        lat: 42.3149,
        lng: -83.0364
      }
    ]
  };

  console.log('\n📋 Test Request:');
  console.log(JSON.stringify(testRequest, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/dispatch/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('\n❌ Error:', error);
      return;
    }

    const result = await response.json();

    console.log('\n' + '='.repeat(70));
    console.log('📊 SIMULATION RESULTS');
    console.log('='.repeat(70));

    // Market Analysis
    console.log('\n🏪 MARKET ANALYSIS:');
    console.log(`   Provider: ${result.market_analysis.provider}`);
    console.log(`   Lane: ${result.market_analysis.lane}`);
    console.log(`   Market Rate (Avg): $${result.market_analysis.market_rate_avg.toFixed(2)}`);
    console.log(`   Fuel Surcharge: $${result.market_analysis.fuel_surcharge.toFixed(2)}`);
    console.log(`   Total Market Rate: $${result.market_analysis.total_market_rate.toFixed(2)}`);
    console.log(`   Target Buy Rate (${result.market_analysis.target_margin_percent}% margin): $${result.market_analysis.target_buy_rate.toFixed(2)}`);

    // Internal Simulation
    console.log('\n🚛 INTERNAL SIMULATION:');
    console.log(`   Total Trip Distance: ${result.internal_simulation.total_trip_distance.toFixed(1)} miles`);
    console.log(`   Estimated Drive Time: ${result.internal_simulation.estimated_drive_time_hours.toFixed(1)} hours`);

    // Scenarios
    console.log('\n📋 SCENARIOS:');
    for (const scenario of result.internal_simulation.scenarios) {
      console.log(`\n   ${scenario.type}:`);
      console.log(`   ├─ Feasible: ${scenario.feasible ? '✅ Yes' : '❌ No'}`);
      
      if (!scenario.feasible) {
        console.log(`   └─ Reason: ${scenario.feasibility_reason}`);
        continue;
      }

      if (scenario.resource_match) {
        if (scenario.resource_match.driver) {
          console.log(`   ├─ Driver: ${scenario.resource_match.driver.name} (${scenario.resource_match.driver.category}, ${scenario.resource_match.driver.hos_hours_remaining}h HOS)`);
        }
        if (scenario.resource_match.local_driver) {
          console.log(`   ├─ Local Driver: ${scenario.resource_match.local_driver.name} (${scenario.resource_match.local_driver.hos_hours_remaining}h HOS)`);
        }
        if (scenario.resource_match.unit) {
          console.log(`   ├─ Unit: ${scenario.resource_match.unit.number} (${scenario.resource_match.unit.configuration})`);
        }
        if (scenario.resource_match.trailer) {
          console.log(`   ├─ Trailer: ${scenario.resource_match.trailer.number} (${scenario.resource_match.trailer.type})`);
        }
      }

      if (scenario.cost_breakdown) {
        console.log(`   ├─ Cost Breakdown:`);
        console.log(`   │  ├─ Deadhead: ${scenario.cost_breakdown.deadhead_miles} mi @ $${scenario.cost_breakdown.deadhead_cost.toFixed(2)}`);
        console.log(`   │  ├─ Linehaul: ${scenario.cost_breakdown.linehaul_miles} mi @ $${scenario.cost_breakdown.linehaul_cost.toFixed(2)}`);
        console.log(`   │  ├─ Driver Cost: $${scenario.cost_breakdown.driver_cost.toFixed(2)}`);
        console.log(`   │  └─ Fixed Daily: $${scenario.cost_breakdown.fixed_daily_cost.toFixed(2)}`);
      }

      console.log(`   ├─ Total Cost: $${scenario.total_cost?.toFixed(2)}`);
      console.log(`   ├─ Margin vs Market: $${scenario.margin_vs_market?.toFixed(2)} (${scenario.margin_percent?.toFixed(1)}%)`);
      console.log(`   └─ Recommendation: ${scenario.recommendation}`);
    }

    // Final Recommendation
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RECOMMENDATION:');
    console.log('='.repeat(70));
    console.log(`   Decision: ${result.recommendation.decision}`);
    console.log(`   Preferred Scenario: ${result.recommendation.preferred_scenario || 'N/A'}`);
    console.log(`   Savings vs Market: $${result.recommendation.savings_vs_market.toFixed(2)}`);
    console.log(`   Confidence: ${result.recommendation.confidence}`);
    console.log(`   Reasoning:`);
    for (const reason of result.recommendation.reasoning) {
      console.log(`      • ${reason}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Simulation completed successfully');
    console.log('='.repeat(70));

    // Output raw JSON for reference
    console.log('\n📄 Raw JSON Response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
};

// Test Case 2: Multi-stop trip
const testMultiStop = async () => {
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST CASE 2: Multi-Stop Trip');
  console.log('='.repeat(70));

  const testRequest = {
    trip_id: 'DFT-MULTI-001',
    trip_requirements: {
      weight: 42000,
      equipment_type: 'Dry Van'
    },
    route: [
      { type: 'PICKUP', location_id: 'LOC_1', city: 'Guelph', zip: 'N1H' },
      { type: 'PICKUP', location_id: 'LOC_2', city: 'Cambridge', zip: 'N1R' },
      { type: 'DROP', location_id: 'LOC_3', city: 'Toronto', zip: 'M5V' },
      { type: 'DROP', location_id: 'LOC_4', city: 'Markham', zip: 'L3R' }
    ]
  };

  console.log('\n📋 Test Request (Multi-Stop):');
  console.log(JSON.stringify(testRequest, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/dispatch/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    });

    const result = await response.json();
    
    console.log('\n🎯 Quick Summary:');
    console.log(`   Decision: ${result.recommendation?.decision}`);
    console.log(`   Savings: $${result.recommendation?.savings_vs_market?.toFixed(2)}`);
    console.log(`   Total Distance: ${result.internal_simulation?.total_trip_distance?.toFixed(1)} miles`);
    console.log(`   Accessorials (multi-stop): $${result.market_analysis?.accessorials?.toFixed(2)}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Run tests
(async () => {
  await testSimulation();
  await testMultiStop();
})();
