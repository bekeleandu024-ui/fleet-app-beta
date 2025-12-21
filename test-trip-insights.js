const fetch = require('node-fetch');

async function testTripInsights() {
  const tripId = 'ed89c494-40e3-4cdb-85c1-0550b99f571c'; // Sample trip from the database
  
  console.log(`Testing AI Trip Insights for trip: ${tripId}\n`);
  console.log('Calling API endpoint...\n');
  
  try {
    const response = await fetch(`http://localhost:3000/api/trips/${tripId}/ai-insights`);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error response:', error);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n=== AI TRIP INSIGHTS RESPONSE ===\n');
    console.log('Summary:', data.summary);
    console.log('\nInsights (' + data.insights.length + '):');
    data.insights.forEach((insight, i) => {
      console.log(`\n${i + 1}. [${insight.severity.toUpperCase()}] ${insight.title}`);
      console.log(`   Category: ${insight.category}`);
      console.log(`   Detail: ${insight.detail}`);
      console.log(`   Action: ${insight.action}`);
    });
    
    if (data.positive_indicators.length > 0) {
      console.log('\nPositive Indicators:');
      data.positive_indicators.forEach(indicator => {
        console.log(`  ✓ ${indicator}`);
      });
    }
    
    if (data.missing_data.length > 0) {
      console.log('\nMissing Data:');
      data.missing_data.forEach(field => {
        console.log(`  - ${field}`);
      });
    }
    
    console.log('\nMetadata:');
    console.log('  Generated at:', data.metadata?.generated_at);
    console.log('  Data completeness:', data.metadata?.data_completeness);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testTripInsights();
