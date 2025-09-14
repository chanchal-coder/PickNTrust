const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🎨 Fixing grey category colors...');

// Color mapping for grey colors to vibrant alternatives
const colorReplacements = {
  '#6B7280': '#10B981', // Grey to Emerald
  '#9CA3AF': '#8B5CF6', // Light grey to Violet  
  '#6B7280FF': '#10B981', // Grey with alpha to Emerald
  'gray': '#3B82F6', // Generic gray to Blue
  'grey': '#EF4444', // Generic grey to Red
  '#808080': '#F59E0B', // Standard grey to Amber
  '#A0A0A0': '#EC4899', // Light grey to Pink
  '#696969': '#06B6D4', // Dark grey to Cyan
};

try {
  // Get all categories with grey colors
  const greyCategories = db.prepare(`
    SELECT id, name, color 
    FROM categories 
    WHERE color LIKE '%6B7280%' 
       OR color LIKE '%9CA3AF%' 
       OR color LIKE '%gray%' 
       OR color LIKE '%grey%'
       OR color LIKE '%808080%'
       OR color LIKE '%A0A0A0%'
       OR color LIKE '%696969%'
  `).all();

  console.log(`Found ${greyCategories.length} categories with grey colors:`);
  
  if (greyCategories.length === 0) {
    console.log('Success No grey colors found in categories!');
    process.exit(0);
  }

  // Update each grey color
  const updateStmt = db.prepare('UPDATE categories SET color = ? WHERE id = ?');
  
  greyCategories.forEach((category, index) => {
    let newColor = category.color;
    
    // Replace known grey colors
    Object.keys(colorReplacements).forEach(greyColor => {
      if (category.color && category.color.includes(greyColor)) {
        newColor = colorReplacements[greyColor];
      }
    });
    
    // If no specific replacement found, use a vibrant color based on index
    if (newColor === category.color) {
      const vibrantColors = [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#F59E0B', // Orange
        '#EC4899', // Pink
        '#6366F1', // Indigo
        '#14B8A6', // Teal
        '#F43F5E', // Rose
        '#06B6D4', // Cyan
        '#F59E0B', // Amber
        '#8B5CF6'  // Violet
      ];
      newColor = vibrantColors[index % vibrantColors.length];
    }
    
    console.log(`Blog ${category.name}: ${category.color} → ${newColor}`);
    updateStmt.run(newColor, category.id);
  });

  console.log('\nSuccess Successfully updated all grey category colors!');
  console.log('🎨 All categories now use vibrant, non-grey colors');
  
  // Show updated categories
  const updatedCategories = db.prepare(`
    SELECT name, color 
    FROM categories 
    WHERE id IN (${greyCategories.map(() => '?').join(',')})
    ORDER BY name
  `).all(...greyCategories.map(c => c.id));
  
  console.log('\n🌈 Updated category colors:');
  updatedCategories.forEach(cat => {
    console.log(`   ${cat.name}: ${cat.color}`);
  });
  
} catch (error) {
  console.error('Error Error updating category colors:', error);
  process.exit(1);
} finally {
  db.close();
}