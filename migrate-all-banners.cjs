/**
 * Migrate All Database Banners to Static Configuration
 * This script will copy all your existing banners from the database to the static JSON config
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔄 MIGRATING ALL DATABASE BANNERS TO STATIC CONFIG');
console.log('='.repeat(60));

const dbPath = path.join(__dirname, 'database.sqlite');
const configPath = path.join(__dirname, 'client', 'src', 'config', 'banners.json');

try {
  // Open database
  const db = new Database(dbPath);
  
  // Get all banners from database
  console.log('📋 Step 1: Reading banners from database...');
  const banners = db.prepare(`
    SELECT id, title, subtitle, imageUrl, linkUrl, buttonText, page, isActive, display_order,
           created_at, updated_at
    FROM banners 
    ORDER BY page ASC, display_order ASC
  `).all();
  
  console.log(`Found ${banners.length} total banners in database`);
  
  // Group banners by page
  const bannersByPage = {};
  const pageStats = {};
  
  banners.forEach(banner => {
    if (!bannersByPage[banner.page]) {
      bannersByPage[banner.page] = [];
      pageStats[banner.page] = { total: 0, active: 0 };
    }
    
    // Convert database banner to static config format
    const staticBanner = {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      buttonText: banner.buttonText || '',
      page: banner.page,
      isActive: Boolean(banner.isActive),
      display_order: banner.display_order || 1,
      // Add default gradient and icon based on page
      gradient: getDefaultGradient(banner.page),
      icon: getDefaultIcon(banner.page)
    };
    
    bannersByPage[banner.page].push(staticBanner);
    pageStats[banner.page].total++;
    if (staticBanner.isActive) {
      pageStats[banner.page].active++;
    }
  });
  
  // Display statistics
  console.log('\n📊 Banner Statistics by Page:');
  console.log('-'.repeat(40));
  Object.entries(pageStats).forEach(([page, stats]) => {
    console.log(`${page.padEnd(15)} | Total: ${stats.total.toString().padStart(2)} | Active: ${stats.active.toString().padStart(2)}`);
  });
  
  // Create backup of existing config
  console.log('\n📋 Step 2: Creating backup of existing config...');
  if (fs.existsSync(configPath)) {
    const backupPath = configPath.replace('.json', `.backup.${Date.now()}.json`);
    fs.copyFileSync(configPath, backupPath);
    console.log(`✅ Backup created: ${path.basename(backupPath)}`);
  }
  
  // Write new configuration
  console.log('\n📋 Step 3: Writing new static configuration...');
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(bannersByPage, null, 2), 'utf8');
  console.log(`✅ Static configuration updated: ${configPath}`);
  
  // Close database
  db.close();
  
  console.log('\n🎉 MIGRATION COMPLETE!');
  console.log('='.repeat(40));
  console.log('\n📋 Summary:');
  console.log(`   • Total banners migrated: ${banners.length}`);
  console.log(`   • Pages updated: ${Object.keys(bannersByPage).length}`);
  console.log(`   • Travel banners: ${pageStats['travel-picks']?.total || 0} (${pageStats['travel-picks']?.active || 0} active)`);
  
  console.log('\n🔄 Next Steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Visit travel-picks page to see all banners');
  console.log('   3. Use admin panel to manage banners: /admin/static-banners');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Helper functions for default styling
function getDefaultGradient(page) {
  const gradients = {
    'travel-picks': 'from-blue-600 via-sky-600 to-cyan-600',
    'prime-picks': 'from-purple-600 via-pink-600 to-orange-500',
    'value-picks': 'from-green-600 via-emerald-600 to-teal-600',
    'click-picks': 'from-blue-600 via-indigo-600 to-purple-500',
    'cue-picks': 'from-red-600 via-pink-600 to-rose-600',
    'global-picks': 'from-cyan-600 via-blue-600 to-indigo-600',
    'deals-hub': 'from-red-600 via-orange-600 to-yellow-500',
    'loot-box': 'from-purple-600 via-indigo-600 to-blue-600',
    'services': 'from-indigo-500 to-purple-600',
    'apps': 'from-green-500 to-emerald-600',
    'videos': 'from-red-600 via-pink-600 to-purple-600'
  };
  return gradients[page] || 'from-gray-600 to-gray-800';
}

function getDefaultIcon(page) {
  const icons = {
    'travel-picks': 'fas fa-plane',
    'prime-picks': 'fas fa-crown',
    'value-picks': 'fas fa-gem',
    'click-picks': 'fas fa-mouse-pointer',
    'cue-picks': 'fas fa-bullseye',
    'global-picks': 'fas fa-globe',
    'deals-hub': 'fas fa-tags',
    'loot-box': 'fas fa-box-open',
    'services': 'fas fa-cogs',
    'apps': 'fas fa-robot',
    'videos': 'fas fa-play-circle'
  };
  return icons[page] || 'fas fa-star';
}