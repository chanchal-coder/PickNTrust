const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

const files = [
  'prime-picks.tsx',
  'click-picks.tsx', 
  'apps.tsx',
  'value-picks.tsx',
  'travel-picks.tsx',
  'deals-hub.tsx',
  'loot-box.tsx',
  'global-picks.tsx',
  'cue-picks.tsx'
];

console.log('🔧 Fixing malformed import statements...');

files.forEach(filename => {
  const filePath = path.join(pagesDir, filename);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix malformed import
    const oldImport = /import StaticPageBanner from '@\/components\/StaticPageBanner';@\/components\/PageBanner['"];?/g;
    const newImport = "import StaticPageBanner from '@/components/StaticPageBanner';";
    
    if (oldImport.test(content)) {
      content = content.replace(oldImport, newImport);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filename}`);
    } else {
      console.log(`ℹ️  No issues: ${filename}`);
    }
  } else {
    console.log(`⚠️  Not found: ${filename}`);
  }
});

console.log('🎉 Import fixes complete!');