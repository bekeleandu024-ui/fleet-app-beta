const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function updateToRealCustomers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('📝 Replacing placeholder customers with real customer names...\n');
    
    // Map old placeholder names to real customers (Customer - City - Facility)
    const updates = [
      ['Walmart - Milton - Distribution Center', 'COMTECH - Milton - Distribution Center'],
      ['Amazon - Brampton - YYZ4 Fulfillment', 'CEMTOL - Brampton - Fulfillment Center'],
      ['Costco - Markham - Wholesale Depot', 'CAMTAC - Markham - Warehouse'],
      ['Sobeys - Burlington - National DC', 'AUTOCOM - Burlington - Distribution Center'],
      ['Metro - Burlington - Distribution Center', 'THE CENTER - Burlington - Facility'],
      ['Home Depot - Vaughan - RDC Toronto', 'CAMCOR - Vaughan - RDC'],
      ['Canadian Tire - Vaughan - Warehouse', 'SPINIC - Vaughan - Warehouse'],
      ['Loblabs - Toronto - Distribution Center', 'CORVEX - Toronto - Distribution Center'],
    ];
    
    for (const [oldName, newName] of updates) {
      const result = await client.query(
        'UPDATE customers SET name = $1 WHERE name = $2',
        [newName, oldName]
      );
      if (result.rowCount > 0) {
        console.log(`   ✅ ${oldName} → ${newName}`);
      }
    }
    
    await client.query('COMMIT');
    
    // Show results
    console.log('\n📊 Updated customer list:');
    const result = await client.query('SELECT name, city, has_trailer_pool FROM customers ORDER BY name');
    result.rows.forEach(r => {
      const pool = r.has_trailer_pool ? '🟢 Pool' : '⚪ No pool';
      console.log(`   • ${r.name} (${pool})`);
    });
    
    console.log('\n✨ Done!');
    
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

updateToRealCustomers();
