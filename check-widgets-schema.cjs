console.log('🔍 CHECKING WIDGETS TABLE SCHEMA AND CONTENT\n');

const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('📋 WIDGETS TABLE ANALYSIS:');
console.log('=' .repeat(50));

try {
  // Get table schema
  const schemaQuery = db.prepare("PRAGMA table_info(widgets)");
  const schema = schemaQuery.all();
  
  console.log('\n📊 TABLE SCHEMA:');
  schema.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : ''} ${column.pk ? '(PRIMARY KEY)' : ''}`);
  });
  
  // Get all widgets
  const allWidgetsQuery = db.prepare('SELECT * FROM widgets');
  const allWidgets = allWidgetsQuery.all();
  
  console.log(`\n📊 TOTAL WIDGETS: ${allWidgets.length}`);
  
  if (allWidgets.length === 0) {
    console.log('✅ No widgets found in database');
    console.log('✅ Duplication is not from widgets');
  } else {
    console.log('\n🎯 ALL WIDGETS:');
    allWidgets.forEach((widget, index) => {
      console.log(`\n${index + 1}. Widget ID: ${widget.id}`);
      console.log(`   Title: ${widget.title || 'N/A'}`);
      console.log(`   Type: ${widget.type || 'N/A'}`);
      console.log(`   Position: ${widget.position || 'N/A'}`);
      console.log(`   Page ID: ${widget.page_id || 'N/A'}`);
      console.log(`   Content: ${widget.content ? widget.content.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`   Active: ${widget.is_active !== undefined ? (widget.is_active ? 'YES' : 'NO') : 'N/A'}`);
      console.log(`   Display Order: ${widget.display_order || 'N/A'}`);
      
      // Check if this widget might be a header
      if (widget.position && widget.position.toLowerCase().includes('header')) {
        console.log('   ⚠️  THIS IS A HEADER WIDGET!');
      }
      if (widget.type && widget.type.toLowerCase().includes('header')) {
        console.log('   ⚠️  THIS IS A HEADER TYPE WIDGET!');
      }
      if (widget.content && widget.content.toLowerCase().includes('header')) {
        console.log('   ⚠️  CONTENT MENTIONS HEADER!');
      }
    });
    
    // Check for widgets that might render headers
    const suspiciousWidgets = allWidgets.filter(widget => {
      const position = (widget.position || '').toLowerCase();
      const type = (widget.type || '').toLowerCase();
      const content = (widget.content || '').toLowerCase();
      const title = (widget.title || '').toLowerCase();
      
      return position.includes('header') || 
             type.includes('header') || 
             content.includes('header') || 
             title.includes('header') ||
             content.includes('navigation') ||
             content.includes('nav') ||
             content.includes('pickntrust');
    });
    
    if (suspiciousWidgets.length > 0) {
      console.log(`\n⚠️  SUSPICIOUS WIDGETS (${suspiciousWidgets.length}):`);
      suspiciousWidgets.forEach((widget, index) => {
        console.log(`\n${index + 1}. Widget ID: ${widget.id} - ${widget.title}`);
        console.log(`   Position: ${widget.position}`);
        console.log(`   Type: ${widget.type}`);
        console.log(`   Active: ${widget.is_active ? 'YES' : 'NO'}`);
      });
    }
  }
  
} catch (error) {
  console.log('❌ Error checking widgets:', error.message);
} finally {
  db.close();
}

console.log('\n' + '=' .repeat(80));
console.log('🎯 NEXT STEPS:');
console.log('=' .repeat(80));

console.log('\n🔧 IF WIDGETS ARE CAUSING DUPLICATION:');
console.log('1. Temporarily disable suspicious widgets');
console.log('2. Check if duplication disappears');
console.log('3. Remove or modify problematic widgets');

console.log('\n🔧 IF NO WIDGETS ARE THE CAUSE:');
console.log('1. Check browser developer tools for duplicate DOM elements');
console.log('2. Clear browser cache and hard refresh');
console.log('3. Check if React StrictMode is causing double rendering');
console.log('4. Inspect component tree for duplicate headers');