const Database = require('better-sqlite3');
const path = require('path');

// Check actual Canva table schemas
function checkCanvaSchema() {
  console.log('🔍 Checking Canva table schemas...\n');
  
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  try {
    const tables = ['canva_settings', 'canva_posts', 'canva_templates'];
    
    for (const table of tables) {
      console.log(`📋 ${table} table schema:`);
      const schema = db.prepare(`PRAGMA table_info(${table})`).all();
      
      schema.forEach(col => {
        console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

checkCanvaSchema();
