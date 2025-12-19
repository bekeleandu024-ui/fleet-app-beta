
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. Display Backend Structure (API Routes)
function listApiRoutes(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      console.log(`${prefix}📂 ${file}`);
      listApiRoutes(fullPath, prefix + '  ');
    } else if (file === 'route.ts') {
      console.log(`${prefix}⚡ GET/POST/PUT/PATCH`);
    }
  });
}

// 2. Display Recent Activities (Logs)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

async function showLogs() {
  console.log('\n\n=== BACKEND API STRUCTURE ===');
  listApiRoutes(path.join(__dirname, 'app', 'api'));

  console.log('\n=== RECENT SYSTEM ACTIVITIES (DB LOGS) ===');
  
  try {
    const client = await pool.connect();
    try {
      // Recent Trip Events
      const events = await client.query(`
        SELECT 
          te.event_type, 
          te.occurred_at, 
          t.trip_number,
          te.payload
        FROM trip_events te
        LEFT JOIN trips t ON te.trip_id = t.id
        ORDER BY te.occurred_at DESC 
        LIMIT 10
      `);

      console.log('\n--- Last 10 Trip Events ---');
      if (events.rows.length === 0) console.log('No events found.');
      events.rows.forEach(row => {
        const time = new Date(row.occurred_at).toLocaleString();
        const trip = row.trip_number || 'Unknown Trip';
        console.log(`[${time}] ${row.event_type} on Trip ${trip}`);
      });

      // Recent Order Updates
      const orders = await client.query(`
        SELECT order_number, status, updated_at 
        FROM orders 
        ORDER BY updated_at DESC 
        LIMIT 5
      `);

      console.log('\n--- Last 5 Order Updates ---');
      if (orders.rows.length === 0) console.log('No orders found.');
      orders.rows.forEach(row => {
        const time = new Date(row.updated_at).toLocaleString();
        console.log(`[${time}] Order ${row.order_number}: ${row.status}`);
      });

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching logs:', err.message);
  } finally {
    await pool.end();
  }
}

showLogs();
