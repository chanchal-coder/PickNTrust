const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Launch Adding Travel Picks to navigation tabs...');

try {
  // Check if Travel Picks already exists
  const existingTab = db.prepare('SELECT id FROM nav_tabs WHERE slug = ?').get('travel-picks');
  
  if (existingTab) {
    console.log('Success Travel Picks tab already exists in database');
    process.exit(0);
  }
  
  // Get the current max display_order
  const maxOrderResult = db.prepare('SELECT MAX(display_order) as max_order FROM nav_tabs').get();
  const maxOrder = maxOrderResult?.max_order || 0;
  
  // Find Global Picks display order to insert Travel Picks after it
  const globalPicksTab = db.prepare('SELECT display_order FROM nav_tabs WHERE slug = ?').get('global-picks');
  let travelPicksOrder;
  
  if (globalPicksTab) {
    // Insert Travel Picks after Global Picks
    travelPicksOrder = globalPicksTab.display_order + 1;
    
    // Update all tabs with display_order >= travelPicksOrder to increment by 1
    db.prepare('UPDATE nav_tabs SET display_order = display_order + 1 WHERE display_order >= ?').run(travelPicksOrder);
    
    console.log(`📍 Inserting Travel Picks after Global Picks (order: ${travelPicksOrder})`);
  } else {
    // If Global Picks doesn't exist, add at the end
    travelPicksOrder = maxOrder + 1;
    console.log(`📍 Adding Travel Picks at the end (order: ${travelPicksOrder})`);
  }
  
  // Insert Travel Picks tab
  const insertResult = db.prepare(`
    INSERT INTO nav_tabs (
      name, slug, icon, color_from, color_to, display_order, 
      is_active, is_system, description, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    'Travel Picks',
    'travel-picks', 
    'fas fa-plane',
    '#3B82F6',
    '#1E40AF',
    travelPicksOrder,
    1, // is_active
    1, // is_system
    'Best travel deals and bookings'
  );
  
  console.log('Success Travel Picks navigation tab added successfully!');
  console.log(`Stats Tab ID: ${insertResult.lastInsertRowid}`);
  console.log(`📋 Display Order: ${travelPicksOrder}`);
  
  // Verify the insertion
  const allTabs = db.prepare('SELECT name, slug, display_order, is_active FROM nav_tabs ORDER BY display_order ASC').all();
  console.log('\n📋 Current Navigation Tabs:');
  allTabs.forEach(tab => {
    console.log(`  ${tab.display_order}. ${tab.name} (${tab.slug}) - ${tab.is_active ? 'Active' : 'Inactive'}`);
  });
  
} catch (error) {
  console.error('Error Error adding Travel Picks tab:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('\nTarget Travel Picks tab is now available in the navigation!');
console.log('Refresh Refresh your browser to see the new tab.');