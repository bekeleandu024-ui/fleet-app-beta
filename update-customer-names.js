const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet' });

async function updateCustomerNames() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('📝 Updating customer names to: Customer - City - Facility format...\n');
    
    // Update existing customer names to format: Customer Name - City - Facility
    const updates = [
      ['Walmart Distribution Center', 'Walmart - Milton - Distribution Center'],
      ['Amazon YYZ4 Fulfillment', 'Amazon - Brampton - YYZ4 Fulfillment'],
      ['Costco Wholesale Depot', 'Costco - Markham - Wholesale Depot'],
      ['Sobeys National DC', 'Sobeys - Burlington - National DC'],
      ['Metro Distribution', 'Metro - Burlington - Distribution Center'],
      ['Home Depot RDC Toronto', 'Home Depot - Vaughan - RDC Toronto'],
      ['Canadian Tire Warehouse', 'Canadian Tire - Vaughan - Warehouse'],
      ['Loblaws Distribution', 'Loblabs - Toronto - Distribution Center'],
      ['Home Base Yard - Guelph', 'Home Base - Guelph - Main Yard'],
      ['Kitchener Yard', 'Home Base - Kitchener - Yard'],
      ['Guelph Yard 2', 'Home Base - Guelph - Yard 2']
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
    const result = await client.query('SELECT name, city FROM customers ORDER BY name');
    result.rows.forEach(r => console.log(`   • ${r.name}`));
    
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

updateCustomerNames();
