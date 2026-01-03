/**
 * Export Database Table to Excel
 * 
 * Usage:
 *   node scripts/export-table.js <table_name>
 *   node scripts/export-table.js trips
 *   node scripts/export-table.js orders
 *   node scripts/export-table.js --list  (show all tables)
 * 
 * Output: exports/<table_name>_<timestamp>.xlsx
 */

const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet',
});

// Tables that can be exported
const ALLOWED_TABLES = [
  'trips',
  'orders',
  'driver_profiles',
  'unit_profiles',
  'trip_costs',
  'trip_events',
  'trip_locations',
  'trip_stops',
  'trip_exceptions',
  'customs_clearances',
  'customs_activity_log',
  'dispatches',
  'costing_rules',
  'business_rules',
  'rate_cards',
  'event_types',
  'event_rules',
  'market_lanes',
  'distance_cache',
  'week_miles_summary',
  // Added missing tables
  'accessorial_types',
  'active_trip_locations',
  'carrier_bids',
  'carrier_profiles',
  'customs_agents',
  'customs_documents',
  'dispatch_actions',
  'order_accessorials',
  'order_billing',
  'order_freight_items',
  'order_references',
  'order_stops',
  'reference_types',
  'trip_event_timeline',
];

async function listTables() {
  console.log('\n📋 Available tables for export:\n');
  ALLOWED_TABLES.forEach((table, i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. ${table}`);
  });
  console.log('\nUsage: node scripts/export-table.js <table_name>');
  console.log('Example: node scripts/export-table.js trips\n');
}

async function exportTable(tableName) {
  // Validate table name
  if (!ALLOWED_TABLES.includes(tableName)) {
    console.error(`❌ Invalid table: "${tableName}"`);
    console.log(`\nAllowed tables: ${ALLOWED_TABLES.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n📊 Exporting table: ${tableName}...`);

  try {
    // Query the table
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC NULLS LAST`);
    
    if (result.rows.length === 0) {
      console.log(`⚠️  Table "${tableName}" is empty. Nothing to export.`);
      process.exit(0);
    }

    console.log(`   Found ${result.rows.length} rows`);

    // Convert JSON columns to strings for Excel compatibility
    const rows = result.rows.map(row => {
      const cleanRow = {};
      for (const [key, value] of Object.entries(row)) {
        if (value === null || value === undefined) {
          cleanRow[key] = '';
        } else if (typeof value === 'object' && !(value instanceof Date)) {
          cleanRow[key] = JSON.stringify(value);
        } else if (value instanceof Date) {
          cleanRow[key] = value.toISOString();
        } else {
          cleanRow[key] = value;
        }
      }
      return cleanRow;
    });

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

    // Auto-size columns
    const colWidths = [];
    const headers = Object.keys(rows[0]);
    headers.forEach((header, i) => {
      let maxWidth = header.length;
      rows.forEach(row => {
        const cellValue = String(row[header] || '');
        maxWidth = Math.max(maxWidth, Math.min(cellValue.length, 50)); // Cap at 50
      });
      colWidths.push({ wch: maxWidth + 2 });
    });
    worksheet['!cols'] = colWidths;

    // Create exports directory
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${tableName}_${timestamp}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    // Write file
    XLSX.writeFile(workbook, filepath);

    console.log(`✅ Exported successfully!`);
    console.log(`   📁 File: exports/${filename}`);
    console.log(`   📊 Rows: ${result.rows.length}`);
    console.log(`   📋 Columns: ${headers.length}\n`);

  } catch (error) {
    console.error(`❌ Export failed:`, error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function exportAllTables() {
  console.log('\n📊 Exporting ALL tables...\n');

  const exportsDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const workbook = XLSX.utils.book_new();
  let totalRows = 0;

  for (const tableName of ALLOWED_TABLES) {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC NULLS LAST`);
      
      if (result.rows.length === 0) {
        console.log(`   ⏭️  ${tableName}: empty`);
        continue;
      }

      const rows = result.rows.map(row => {
        const cleanRow = {};
        for (const [key, value] of Object.entries(row)) {
          if (value === null || value === undefined) {
            cleanRow[key] = '';
          } else if (typeof value === 'object' && !(value instanceof Date)) {
            cleanRow[key] = JSON.stringify(value);
          } else if (value instanceof Date) {
            cleanRow[key] = value.toISOString();
          } else {
            cleanRow[key] = value;
          }
        }
        return cleanRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      // Truncate sheet name to 31 chars (Excel limit)
      const sheetName = tableName.slice(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      totalRows += result.rows.length;
      console.log(`   ✅ ${tableName}: ${result.rows.length} rows`);
    } catch (error) {
      console.log(`   ❌ ${tableName}: ${error.message}`);
    }
  }

  const filename = `all_tables_${timestamp}.xlsx`;
  const filepath = path.join(exportsDir, filename);
  XLSX.writeFile(workbook, filepath);

  console.log(`\n✅ Export complete!`);
  console.log(`   📁 File: exports/${filename}`);
  console.log(`   📊 Total rows: ${totalRows}\n`);

  await pool.end();
}

// Main
const arg = process.argv[2];

if (!arg || arg === '--help' || arg === '-h') {
  listTables();
  process.exit(0);
}

if (arg === '--list' || arg === '-l') {
  listTables();
  process.exit(0);
}

if (arg === '--all' || arg === '-a') {
  exportAllTables();
} else {
  exportTable(arg);
}
