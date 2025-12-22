async function testOptimization() {
  console.log('🧪 Testing Route Optimization with Capacity Constraints\n');

  // Fetch real data from API
  const dataRes = await fetch('http://localhost:3000/api/optimize/data');
  const data = await dataRes.json();

  console.log('📊 Current Data:');
  console.log(`  - Trips: ${data.tripsWithCoords}`);
  console.log(`  - Total Stops: ${data.totalStops} (${data.stops.length} with pickup+delivery)`);
  console.log(`  - Available Vehicles: ${data.availableVehicles}`);
  console.log(`  - Vehicle Capacity: 45 units (45,000 lbs)`);

  console.log('\n🚚 Stop Demands:');
  const pickups = data.stops.filter(s => s.stop_type === 'pickup');
  pickups.forEach(stop => {
    console.log(`  - ${stop.pickupCity} → ${stop.deliveryCity}: ${stop.demand} units (${Math.round(stop.weight_lbs)} lbs)`);
  });

  // Prepare optimization payload
  const payload = {
    vehicles: data.vehicles.slice(0, 5).map(v => ({
      id: v.unitNumber || v.id.slice(0, 8),
      capacity_limit: v.capacity_limit,
    })),
    stops: data.stops.map(s => ({
      id: s.id,
      latitude: s.latitude,
      longitude: s.longitude,
      demand: s.demand,
      stop_type: s.stop_type,
    })),
    depot: data.depot,
    pickup_delivery_pairs: data.pickupDeliveryPairs || [],
  };

  console.log('\n📤 Sending to optimizer:');
  console.log(`  - Vehicles: ${payload.vehicles.length} (capacity: ${payload.vehicles[0].capacity_limit} each)`);
  console.log(`  - Stops: ${payload.stops.length}`);
  console.log(`  - Pickup-Delivery Pairs: ${payload.pickup_delivery_pairs.length}`);

  // Run optimization
  console.log('\n⏳ Running optimization...');
  const optRes = await fetch('http://localhost:3000/api/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await optRes.json();

  console.log('\n✅ Optimization Complete!');
  console.log(`\n📈 Results:`);
  console.log(`  - Status: ${result.status}`);
  console.log(`  - Total Distance: ${result.total_distance_km.toFixed(1)} km`);
  console.log(`  - Vehicles Used: ${result.routes.length}`);
  console.log(`  - Total Stops Covered: ${result.routes.reduce((sum, r) => sum + r.steps.length, 0)}`);

  console.log('\n🚛 Route Breakdown:');
  result.routes.forEach((route, idx) => {
    console.log(`\n  Vehicle ${route.vehicle_id}:`);
    console.log(`    - Distance: ${route.total_distance_meters / 1000} km`);
    console.log(`    - Max Load: ${route.total_load} units`);
    console.log(`    - Stops: ${route.steps.length}`);
    
    const pickupStops = route.steps.filter(s => s.stop_id.startsWith('pickup-')).length;
    const deliveryStops = route.steps.filter(s => s.stop_id.startsWith('delivery-')).length;
    console.log(`    - Pickups: ${pickupStops}, Deliveries: ${deliveryStops}`);
  });

  // Verify capacity constraints
  console.log('\n🔍 Capacity Verification:');
  result.routes.forEach((route) => {
    let currentLoad = 0;
    let maxLoad = 0;
    
    for (const step of route.steps) {
      const stopData = data.stops.find(s => s.id === step.stop_id);
      if (stopData) {
        currentLoad += stopData.demand;
        maxLoad = Math.max(maxLoad, currentLoad);
      }
    }
    
    const vehicleCapacity = 45;
    const withinCapacity = maxLoad <= vehicleCapacity;
    const status = withinCapacity ? '✅' : '❌';
    console.log(`  ${status} Vehicle ${route.vehicle_id}: Max load ${maxLoad}/${vehicleCapacity} units`);
  });

  // Analysis
  console.log('\n📊 Analysis:');
  const totalDemand = pickups.reduce((sum, s) => sum + s.demand, 0);
  const avgDemand = totalDemand / pickups.length;
  console.log(`  - Total demand: ${totalDemand} units from ${pickups.length} trips`);
  console.log(`  - Average demand per trip: ${avgDemand.toFixed(1)} units`);
  console.log(`  - Theoretical min vehicles: ${Math.ceil(totalDemand / 45)} (if perfectly balanced)`);
  console.log(`  - Actual vehicles used: ${result.routes.length}`);
  
  if (result.routes.length === 1) {
    console.log('\n⚠️  WARNING: Using only 1 vehicle!');
    console.log('   This happens because:');
    console.log('   - Pickup-delivery pairs allow load to drop back to 0 after each delivery');
    console.log('   - Optimizer prioritizes minimizing distance over vehicle usage');
    console.log('   - Solution: Add fixed cost per vehicle to encourage multi-vehicle routing');
  } else {
    console.log(`\n✅ Good: Using ${result.routes.length} vehicles for ${pickups.length} trips`);
  }
}

testOptimization().catch(console.error);
