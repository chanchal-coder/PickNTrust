const Database = require('better-sqlite3');

console.log('=== DETAILED CHANNEL_POSTS ANALYSIS ===');

// Check database.db first
try {
  const db = new Database('database.db');
  console.log('\n📁 DATABASE.DB:');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('All tables:', tables.map(t => t.name));
  
  if (tables.some(t => t.name === 'channel_posts')) {
    console.log('\n🔍 CHANNEL_POSTS TABLE SCHEMA:');
    const schema = db.prepare('PRAGMA table_info(channel_posts)').all();
    schema.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    console.log('\n📊 DATA ANALYSIS:');
    const count = db.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
    console.log(`Total records: ${count.count}`);
    
    if (count.count > 0) {
      console.log('\n📝 SAMPLE DATA:');
      const sample = db.prepare('SELECT * FROM channel_posts LIMIT 3').all();
      sample.forEach((row, i) => {
        console.log(`\nRecord ${i + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
  }
  
  db.close();
} catch (error) {
  console.log('❌ Error with database.db:', error.message);
}

// Check sqlite.db
try {
  const db2 = new Database('sqlite.db');
  console.log('\n📁 SQLITE.DB:');
  
  const tables2 = db2.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('All tables:', tables2.map(t => t.name));
  
  if (tables2.some(t => t.name === 'channel_posts')) {
    console.log('\n🔍 CHANNEL_POSTS TABLE SCHEMA:');
    const schema2 = db2.prepare('PRAGMA table_info(channel_posts)').all();
    schema2.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    console.log('\n📊 DATA ANALYSIS:');
    const count2 = db2.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
    console.log(`Total records: ${count2.count}`);
    
    if (count2.count > 0) {
      console.log('\n📝 SAMPLE DATA:');
      const sample2 = db2.prepare('SELECT * FROM channel_posts LIMIT 3').all();
      sample2.forEach((row, i) => {
        console.log(`\nRecord ${i + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
  }
  
  db2.close();
} catch (error) {
  console.log('❌ Error with sqlite.db:', error.message);
}

// Check database.sqlite
try {
  const db3 = new Database('database.sqlite');
  console.log('\n📁 DATABASE.SQLITE:');
  
  const tables3 = db3.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('All tables:', tables3.map(t => t.name));
  
  if (tables3.some(t => t.name === 'channel_posts')) {
    console.log('\n🔍 CHANNEL_POSTS TABLE SCHEMA:');
    const schema3 = db3.prepare('PRAGMA table_info(channel_posts)').all();
    schema3.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    console.log('\n📊 DATA ANALYSIS:');
    const count3 = db3.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
    console.log(`Total records: ${count3.count}`);
    
    if (count3.count > 0) {
      console.log('\n📝 SAMPLE DATA:');
      const sample3 = db3.prepare('SELECT * FROM channel_posts LIMIT 3').all();
      sample3.forEach((row, i) => {
        console.log(`\nRecord ${i + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    }
  }
  
  db3.close();
} catch (error) {
  console.log('❌ Error with database.sqlite:', error.message);
}

console.log('\n✅ Analysis complete!');