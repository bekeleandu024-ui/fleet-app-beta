const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function checkOnTimeData() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER(WHERE on_time_delivery = true) as on_time,
        COUNT(*) FILTER(WHERE on_time_delivery = false) as late,
        COUNT(*) FILTER(WHERE on_time_delivery IS NOT NULL) as has_data
      FROM trips 
      WHERE status = 'completed' 
        AND completed_at > NOW() - INTERVAL '30 days'
    `);
    
    console.log('\n=== ON-TIME DELIVERY DATA (Last 30 Days) ===');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    if (result.rows[0].total > 0) {
      const pct = (parseInt(result.rows[0].on_time) / parseInt(result.rows[0].total)) * 100;
      console.log(`\nOn-Time Rate: ${pct.toFixed(1)}%`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOnTimeData();
