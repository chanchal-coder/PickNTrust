const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 DATABASE STRUCTURE CHECK');
console.log('='.repeat(50));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('📋 UNIFIED_CONTENT TABLE STRUCTURE:');
  console.log('-'.repeat(50));
  
  const tableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('Columns in unified_content table:');
  tableInfo.forEach(col => {
    console.log(`   ${col.cid}: ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
  });

  console.log('\n📊 SAMPLE DATA FROM UNIFIED_CONTENT:');
  console.log('-'.repeat(50));
  
  const sampleData = db.prepare(`
    SELECT * FROM unified_content 
    LIMIT 3
  `).all();

  if (sampleData.length === 0) {
    console.log('   ❌ No data found in unified_content table');
  } else {
    sampleData.forEach((row, index) => {
      console.log(`\n📄 Record ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        const displayValue = typeof value === 'string' && value.length > 100 
          ? value.substring(0, 100) + '...' 
          : value;
        console.log(`   ${key}: ${displayValue}`);
      });
    });
  }

  console.log('\n🔍 CHECKING FOR CHANNEL-RELATED COLUMNS:');
  console.log('-'.repeat(50));
  
  const columnNames = tableInfo.map(col => col.name);
  const channelColumns = columnNames.filter(name => 
    name.toLowerCase().includes('channel') || 
    name.toLowerCase().includes('chat') ||
    name.toLowerCase().includes('source')
  );
  
  if (channelColumns.length > 0) {
    console.log('Found channel-related columns:');
    channelColumns.forEach(col => {
      console.log(`   ✅ ${col}`);
      
      // Check unique values in this column
      const uniqueValues = db.prepare(`
        SELECT DISTINCT ${col}, COUNT(*) as count 
        FROM unified_content 
        WHERE ${col} IS NOT NULL 
        GROUP BY ${col}
        ORDER BY count DESC
        LIMIT 10
      `).all();
      
      if (uniqueValues.length > 0) {
        console.log(`      Values in ${col}:`);
        uniqueValues.forEach(row => {
          console.log(`        ${row[col]} (${row.count} records)`);
        });
      }
    });
  } else {
    console.log('   ❌ No obvious channel-related columns found');
    console.log('   Available columns:', columnNames.join(', '));
  }

  console.log('\n📊 DISPLAY_PAGES ANALYSIS:');
  console.log('-'.repeat(50));
  
  const displayPagesData = db.prepare(`
    SELECT display_pages, COUNT(*) as count, processing_status
    FROM unified_content 
    WHERE display_pages IS NOT NULL
    GROUP BY display_pages, processing_status
    ORDER BY count DESC
  `).all();

  if (displayPagesData.length === 0) {
    console.log('   ❌ No display_pages data found');
  } else {
    console.log('Display pages distribution:');
    displayPagesData.forEach(row => {
      console.log(`   ${row.display_pages} → ${row.count} records (${row.processing_status})`);
    });
  }

  console.log('\n✅ STRUCTURE CHECK COMPLETE');

} catch (error) {
  console.error('❌ Error during structure check:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}