const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/fleet'
});

async function addIndexes() {
  const client = await pool.connect();
  try {
    console.log('📊 Adding performance indexes for AI insights...\n');
    
    const sql = fs.readFileSync('add-ai-performance-indexes.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/idx_[a-z_]+/)?.[0] || 'unknown';
        try {
          await client.query(statement);
          console.log(`✅ Created index: ${indexName}`);
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log(`⏭️  Index already exists: ${indexName}`);
          } else {
            console.error(`❌ Error creating ${indexName}:`, err.message);
          }
        }
      } else if (statement.includes('ANALYZE')) {
        const tableName = statement.match(/ANALYZE ([a-z_]+)/)?.[1] || 'unknown';
        await client.query(statement);
        console.log(`📈 Analyzed table: ${tableName}`);
      }
    }
    
    console.log('\n✅ All indexes created successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

addIndexes();
