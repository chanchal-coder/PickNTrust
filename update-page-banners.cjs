const fs = require('fs');
const path = require('path');

// List of pages to update with their corresponding banner page names
const pagesToUpdate = [
  { file: 'apps.tsx', bannerPage: 'apps' },
  { file: 'blog.tsx', bannerPage: 'blog' },
  { file: 'category.tsx', bannerPage: 'categories' },
  { file: 'click-picks.tsx', bannerPage: 'click-picks' },
  { file: 'cue-picks.tsx', bannerPage: 'cue-picks' },
  { file: 'deals-hub.tsx', bannerPage: 'deals' },
  { file: 'global-picks.tsx', bannerPage: 'global-picks' },
  { file: 'loot-box.tsx', bannerPage: 'loot-box' },
  { file: 'prime-picks.tsx', bannerPage: 'prime-picks' },
  { file: 'services.tsx', bannerPage: 'services' },
  { file: 'videos.tsx', bannerPage: 'videos' },
  { file: 'wishlist.tsx', bannerPage: 'wishlist' }
];

const clientPagesDir = path.join(__dirname, 'client', 'src', 'pages');

console.log('Launch Adding PageBanner components to navigation pages...');

pagesToUpdate.forEach(({ file, bannerPage }) => {
  const filePath = path.join(clientPagesDir, file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${file} - file not found`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if PageBanner is already imported
    if (content.includes('import PageBanner from')) {
      console.log(`⏭️  Skipping ${file} - PageBanner already imported`);
      return;
    }
    
    // Add PageBanner import after other component imports
    const importRegex = /(import.*from ['"]@\/components\/[^'"]*['"];?\s*\n)/g;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertIndex) + 
                `import PageBanner from '@/components/PageBanner';\n` + 
                content.slice(insertIndex);
    } else {
      // Fallback: add after Header import if found
      content = content.replace(
        /(import Header from ['"]@\/components\/header['"];?)/,
        '$1\nimport PageBanner from \'@/components/PageBanner\';'
      );
    }
    
    // Look for common banner patterns and replace them
    const bannerPatterns = [
      // Pattern 1: Gradient header with title and description
      /(<div className="bg-gradient-to-r[^>]*>\s*<div[^>]*>\s*<div[^>]*>\s*<h1[^>]*>[^<]*<\/h1>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/g,
      
      // Pattern 2: Simple header section
      /(<div className="[^"]*(?:bg-gradient|py-\d+)[^"]*"[^>]*>\s*<div[^>]*>\s*<div[^>]*>\s*<h1[^>]*>[^<]*<\/h1>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/g,
      
      // Pattern 3: Header with background
      /(<div className="[^"]*(?:header|banner|hero)[^"]*"[^>]*>[\s\S]*?<h1[^>]*>[^<]*<\/h1>[\s\S]*?<\/div>)/g
    ];
    
    let replaced = false;
    
    bannerPatterns.forEach(pattern => {
      if (pattern.test(content) && !replaced) {
        content = content.replace(pattern, `{/* Amazing Page Banner */}\n        <PageBanner page="${bannerPage}" />`);
        replaced = true;
      }
    });
    
    // If no pattern matched, try to add after Header component
    if (!replaced) {
      // Look for <Header /> and add banner after it
      if (content.includes('<Header />')) {
        content = content.replace(
          /(<Header \/>)/,
          '$1\n      \n      {/* Amazing Page Banner */}\n      <PageBanner page="' + bannerPage + '" />'
        );
        replaced = true;
      }
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    if (replaced) {
      console.log(`Success Updated ${file} with PageBanner component`);
    } else {
      console.log(`Warning  Updated ${file} with import only (manual banner placement needed)`);
    }
    
  } catch (error) {
    console.error(`Error Error updating ${file}:`, error.message);
  }
});

console.log('\nCelebration Page banner update process completed!');
console.log('\nTip Next steps:');
console.log('   1. Review updated files for any manual adjustments needed');
console.log('   2. Test each page to ensure banners display correctly');
console.log('   3. Customize banner content through the admin panel');
console.log('   4. All pages now have amazing, responsive banners!');