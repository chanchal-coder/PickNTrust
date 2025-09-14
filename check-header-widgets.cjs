console.log('🔍 CHECKING FOR HEADER WIDGETS CAUSING DUPLICATION\n');

const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('📋 CHECKING WIDGETS TABLE:');
console.log('=' .repeat(50));

try {
  // Check if widgets table exists
  const tablesQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='widgets'");
  const widgetsTable = tablesQuery.get();
  
  if (!widgetsTable) {
    console.log('❌ Widgets table does not exist');
    console.log('✅ No header widgets found - duplication must be from code');
    db.close();
    return;
  }
  
  console.log('✅ Widgets table exists');
  
  // Get all widgets
  const allWidgetsQuery = db.prepare('SELECT * FROM widgets ORDER BY page, position, display_order');
  const allWidgets = allWidgetsQuery.all();
  
  console.log(`\n📊 TOTAL WIDGETS: ${allWidgets.length}`);
  
  if (allWidgets.length === 0) {
    console.log('✅ No widgets found in database');
    console.log('✅ Duplication must be from code structure');
    db.close();
    return;
  }
  
  // Check for header position widgets
  const headerWidgets = allWidgets.filter(widget => widget.position === 'header');
  
  console.log(`\n🎯 HEADER WIDGETS: ${headerWidgets.length}`);
  
  if (headerWidgets.length === 0) {
    console.log('✅ No header widgets found');
    console.log('✅ Duplication is not from widgets');
  } else {
    console.log('\n⚠️  HEADER WIDGETS FOUND:');
    headerWidgets.forEach((widget, index) => {
      console.log(`\n${index + 1}. Widget ID: ${widget.id}`);
      console.log(`   Page: ${widget.page}`);
      console.log(`   Position: ${widget.position}`);
      console.log(`   Type: ${widget.type}`);
      console.log(`   Title: ${widget.title || 'N/A'}`);
      console.log(`   Content: ${widget.content ? widget.content.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`   Active: ${widget.is_active ? 'YES' : 'NO'}`);
      console.log(`   Display Order: ${widget.display_order}`);
    });
    
    console.log('\n🔧 POTENTIAL SOLUTIONS:');
    console.log('1. Disable header widgets temporarily');
    console.log('2. Delete header widgets if not needed');
    console.log('3. Check if header widgets contain navigation content');
  }
  
  // Check for home page specific widgets
  const homeWidgets = allWidgets.filter(widget => widget.page === 'home');
  console.log(`\n🏠 HOME PAGE WIDGETS: ${homeWidgets.length}`);
  
  if (homeWidgets.length > 0) {
    console.log('\nHome page widgets by position:');
    const positions = {};
    homeWidgets.forEach(widget => {
      if (!positions[widget.position]) positions[widget.position] = 0;
      positions[widget.position]++;
    });
    
    Object.keys(positions).forEach(position => {
      console.log(`   ${position}: ${positions[position]} widgets`);
    });
  }
  
  // Check all widget positions
  console.log('\n📍 ALL WIDGET POSITIONS:');
  const allPositions = {};
  allWidgets.forEach(widget => {
    if (!allPositions[widget.position]) allPositions[widget.position] = 0;
    allPositions[widget.position]++;
  });
  
  Object.keys(allPositions).forEach(position => {
    console.log(`   ${position}: ${allPositions[position]} widgets`);
  });
  
} catch (error) {
  console.log('❌ Error checking widgets:', error.message);
} finally {
  db.close();
}

console.log('\n' + '=' .repeat(80));
console.log('🎯 ANALYSIS SUMMARY:');
console.log('=' .repeat(80));

console.log('\n🔍 POSSIBLE CAUSES OF DUPLICATE HEADERS:');
console.log('1. Header widgets in database rendering duplicate navigation');
console.log('2. Component rendering twice due to React strict mode');
console.log('3. CSS causing visual duplication');
console.log('4. Multiple header components in component tree');
console.log('5. Browser caching old version with duplicate headers');

console.log('\n🔧 DEBUGGING STEPS:');
console.log('1. Check browser developer tools for duplicate DOM elements');
console.log('2. Disable all widgets temporarily');
console.log('3. Check if issue persists in incognito mode');
console.log('4. Inspect React component tree for duplicates');
console.log('5. Clear browser cache and hard refresh');