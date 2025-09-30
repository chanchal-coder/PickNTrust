/**
 * Update Travel Category Icons from Emojis to FontAwesome
 * This script updates existing database records to use FontAwesome icons instead of emojis
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('Refresh Updating travel category icons from emojis to FontAwesome...');

// Icon mapping from emojis to FontAwesome classes
const iconMapping = {
  'Flight': 'fas fa-plane',
  'Hotel': 'fas fa-bed', 
  'Package': 'fas fa-suitcase',
  '🗺️': 'fas fa-map-marked-alt',
  'Bus': 'fas fa-bus',
  'Train': 'fas fa-train',
  'Car': 'fas fa-car',
  '🚢': 'fas fa-ship',
  'Ticket': 'fas fa-ticket-alt'
};

// Color mapping to Material Design colors
const colorMapping = {
  'flights': '#2196F3',
  'hotels': '#FF9800',
  'packages': '#9C27B0',
  'tours': '#F44336',
  'bus': '#FFC107',
  'train': '#4CAF50',
  'car-rental': '#3F51B5',
  'cruises': '#009688',
  'tickets': '#E91E63'
};

try {
  // Get all travel categories
  const categories = db.prepare('SELECT * FROM travel_categories').all();
  
  console.log(`Stats Found ${categories.length} travel categories to update`);
  
  let updatedCount = 0;
  
  for (const category of categories) {
    const newIcon = iconMapping[category.icon];
    const newColor = colorMapping[category.slug];
    
    if (newIcon || newColor) {
      const updateData = {};
      let updateFields = [];
      let updateValues = [];
      
      if (newIcon && newIcon !== category.icon) {
        updateFields.push('icon = ?');
        updateValues.push(newIcon);
        updateData.icon = newIcon;
      }
      
      if (newColor && newColor !== category.color) {
        updateFields.push('color = ?');
        updateValues.push(newColor);
        updateData.color = newColor;
      }
      
      if (updateFields.length > 0) {
        updateFields.push('updatedAt = ?');
        updateValues.push(Math.floor(Date.now() / 1000));
        updateValues.push(category.id);
        
        const updateQuery = `UPDATE travel_categories SET ${updateFields.join(', ')} WHERE id = ?`;
        
        db.prepare(updateQuery).run(...updateValues);
        
        console.log(`Success Updated ${category.name}:`);
        if (updateData.icon) {
          console.log(`   Icon: ${category.icon} → ${updateData.icon}`);
        }
        if (updateData.color) {
          console.log(`   Color: ${category.color} → ${updateData.color}`);
        }
        
        updatedCount++;
      }
    }
  }
  
  console.log(`\nCelebration Successfully updated ${updatedCount} travel categories!`);
  console.log('Special All icons are now using FontAwesome classes');
  console.log('🎨 Colors updated to Material Design palette');
  
} catch (error) {
  console.error('Error Error updating travel categories:', error);
} finally {
  db.close();
}

console.log('\nRefresh Database update complete!');
console.log('Tip Refresh your browser to see the FontAwesome icons');