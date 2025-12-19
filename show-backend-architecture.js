const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet',
});

// ANSI Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

function printHeader(title) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function printSubHeader(title) {
  console.log(`\n${colors.bright}${title}${colors.reset}`);
}

async function getTableInfo(tableName) {
  try {
    const countRes = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    const colRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' 
      LIMIT 5
    `);
    
    return {
      name: tableName,
      count: countRes.rows[0].count,
      columns: colRes.rows.map(r => r.column_name)
    };
  } catch (e) {
    return { name: tableName, error: "Table not found or inaccessible" };
  }
}

function scanApiRoutes(dir, fileList = [], base = '') {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanApiRoutes(filePath, fileList, path.join(base, file));
    } else {
      if (file === 'route.ts' || file === 'route.js') {
        // Convert path to route
        let route = '/' + base.replace(/\\/g, '/');
        // Handle dynamic routes [id] -> :id
        route = route.replace(/\[([^\]]+)\]/g, ':$1');
        fileList.push(route);
      }
    }
  });
  return fileList;
}

async function runReport() {
  console.clear();
  console.log(`${colors.bright}${colors.magenta}
  FLEET MANAGEMENT SYSTEM - BACKEND ARCHITECTURE REPORT
  Generated: ${new Date().toLocaleString()}
  ${colors.reset}`);

  // 1. Service Architecture
  printHeader("1. MICROSERVICES TOPOLOGY");
  console.log(`
  ${colors.green}●${colors.reset} ${colors.bright}Master-Data Service${colors.reset} (Port 4001)
    └─ Costing Engine, Rate Management, Driver Profiles
  
  ${colors.green}●${colors.reset} ${colors.bright}Orders Service${colors.reset} (Port 4002)
    └─ Order Lifecycle, Status Management, Customer Integration
  
  ${colors.green}●${colors.reset} ${colors.bright}Dispatch Service${colors.reset} (Port 4003)
    └─ Driver Assignment, Route Optimization, Asset Tracking
  
  ${colors.green}●${colors.reset} ${colors.bright}Analytics Service${colors.reset} (Port 4004)
    └─ Reporting, KPI Dashboards, Data Warehousing
  `);

  // 2. Database Schema
  printHeader("2. DATABASE SCHEMA (PostgreSQL)");
  const tables = ['orders', 'trips', 'trip_costs', 'trip_events', 'driver_profiles', 'unit_profiles'];
  
  console.log(`${colors.dim}Connecting to fleet database...${colors.reset}`);
  
  for (const table of tables) {
    const info = await getTableInfo(table);
    if (info.error) {
      console.log(`  ${colors.red}x ${table}${colors.reset}: ${info.error}`);
    } else {
      console.log(`  ${colors.green}✓ ${table.padEnd(20)}${colors.reset} | Rows: ${colors.yellow}${info.count.padEnd(6)}${colors.reset} | Key Cols: ${colors.dim}${info.columns.join(', ')}...${colors.reset}`);
    }
  }

  // 3. API Surface
  printHeader("3. API ENDPOINTS (Next.js App Router)");
  try {
    const apiDir = path.join(__dirname, 'app', 'api');
    if (fs.existsSync(apiDir)) {
      const routes = scanApiRoutes(apiDir);
      // Group by prefix
      const groups = {};
      routes.forEach(r => {
        const prefix = r.split('/')[1];
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push(r);
      });

      Object.keys(groups).forEach(prefix => {
        console.log(`  ${colors.blue}/${prefix}${colors.reset}`);
        groups[prefix].slice(0, 4).forEach(r => console.log(`    - GET/POST/PUT ${r}`));
        if (groups[prefix].length > 4) console.log(`    - ... and ${groups[prefix].length - 4} more`);
      });
    } else {
      console.log("  (API directory not found in current path)");
    }
  } catch (e) {
    console.log("  Error scanning API routes: " + e.message);
  }

  // 4. Recent Activity
  printHeader("4. RECENT SYSTEM EVENTS");
  try {
    const events = await pool.query(`
      SELECT event_type, status, occurred_at 
      FROM trip_events 
      ORDER BY occurred_at DESC 
      LIMIT 5
    `);
    
    if (events.rows.length > 0) {
      events.rows.forEach(evt => {
        console.log(`  [${new Date(evt.occurred_at).toLocaleTimeString()}] ${colors.yellow}${evt.event_type}${colors.reset} - ${evt.status}`);
      });
    } else {
      console.log("  (No recent events found)");
    }
  } catch (e) {
    console.log("  (Could not fetch events)");
  }

  console.log(`\n${colors.dim}End of Report${colors.reset}\n`);
  await pool.end();
}

runReport();
