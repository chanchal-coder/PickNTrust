const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Search Checking categories in database...');
  
  const categories = db.prepare('SELECT * FROM categories ORDER BY display_order LIMIT 10').all();
  
  console.log(`\nStats Found ${categories.length} categories:`);
  
  categories.forEach((cat, index) => {
    console.log(`${index + 1}. Name: "${cat.name}"`);
    console.log(`   Icon: "${cat.icon || 'NULL'}"`);
    console.log(`   Color: "${cat.color || 'NULL'}"`);
    console.log(`   Display Order: ${cat.display_order || 'NULL'}`);
    console.log(`   Description: "${cat.description || 'NULL'}"`);
    console.log('   ---');
  });
  
  // Check if there are any categories with missing data
  const missingData = db.prepare(`
    SELECT name, icon, color, description 
    FROM categories 
    WHERE icon IS NULL OR color IS NULL OR description IS NULL
  `).all();
  
  if (missingData.length > 0) {
    console.log(`\nWarning  Found ${missingData.length} categories with missing data:`);
    missingData.forEach(cat => {
      console.log(`- ${cat.name}: icon=${cat.icon || 'MISSING'}, color=${cat.color || 'MISSING'}, desc=${cat.description || 'MISSING'}`);
    });
  } else {
    console.log('\nSuccess All categories have complete data!');
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Error checking categories:', error.message);
}