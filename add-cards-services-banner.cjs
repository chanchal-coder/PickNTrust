const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Target Adding Cards & Services banner to database...');

try {
  // Check if banners table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='banners'
  `).get();

  if (!tableExists) {
    console.log('Error Banners table does not exist. Please run create-banners-table.cjs first.');
    process.exit(1);
  }

  // Check if services banner already exists
  const existingBanner = db.prepare(`
    SELECT * FROM banners WHERE page = 'services'
  `).get();

  if (existingBanner) {
    console.log('Warning  Services banner already exists. Updating with Cards & Services content...');
    
    // Update existing banner
    db.prepare(`
      UPDATE banners SET 
        title = ?,
        subtitle = ?,
        imageUrl = ?,
        linkUrl = ?,
        buttonText = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE page = 'services'
    `).run(
      'Cards & Services',
      'Special Discover premium digital services, financial products, and exclusive offers at unbeatable prices Special',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80', // Credit card image
      '/services#cards-apps-services',
      'Explore Services'
    );
    
    console.log('Success Updated existing services banner with Cards & Services content');
  } else {
    console.log('➕ Creating new services banner with Cards & Services content...');
    
    // Insert new banner
    db.prepare(`
      INSERT INTO banners (
        page, title, subtitle, imageUrl, linkUrl, buttonText,
        isActive, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      'services',
      'Cards & Services',
      'Special Discover premium digital services, financial products, and exclusive offers at unbeatable prices Special',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80', // Credit card image
      '/services#cards-apps-services',
      'Explore Services',
      1, // isActive
      1  // display_order
    );
    
    console.log('Success Created new services banner with Cards & Services content');
  }

  // Verify the banner was created/updated
  const banner = db.prepare(`
    SELECT * FROM banners WHERE page = 'services'
  `).get();

  console.log('\n📋 Services Banner Details:');
  console.log(`   Title: ${banner.title}`);
  console.log(`   Subtitle: ${banner.subtitle}`);
  console.log(`   Icon: ${banner.icon}`);
  console.log(`   Colors: ${banner.primaryColor} → ${banner.secondaryColor}`);
  console.log(`   Primary Button: "${banner.buttonText}" → ${banner.buttonUrl}`);
  console.log(`   Secondary Button: "${banner.secondaryButtonText}" → ${banner.secondaryButtonUrl}`);

  console.log('\nCelebration Successfully set up Cards & Services banner in database!');
  console.log('\nBlog Next steps:');
  console.log('   1. Remove the hardcoded "Cards & Services" section from services.tsx');
  console.log('   2. The PageBanner component will now display this content dynamically');
  console.log('   3. You can manage this banner through the admin panel');

} catch (error) {
  console.error('Error Error setting up Cards & Services banner:', error.message);
  process.exit(1);
} finally {
  db.close();
}