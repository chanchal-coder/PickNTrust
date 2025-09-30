const fs = require('fs');
const path = require('path');

console.log('🚀 IMPLEMENTING SITE-WIDE WIDGET SYSTEM');
console.log('=' .repeat(60));

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');
const componentsDir = path.join(__dirname, 'client', 'src', 'components');

// List of all page files that need widget support
const pageFiles = [
  'home.tsx',
  'categories.tsx', 
  'blog.tsx',
  'videos.tsx',
  'wishlist.tsx',
  'contact.tsx',
  'click-picks.tsx',
  'cue-picks.tsx',
  'value-picks.tsx',
  'prime-picks.tsx',
  'global-picks.tsx',
  'loot-box.tsx',
  'deals-hub.tsx'
];

// Enhanced widget positions for better control
const widgetPositions = [
  { value: 'header-top', label: 'Header Top (Above Navigation)' },
  { value: 'header-bottom', label: 'Header Bottom (Below Navigation)' },
  { value: 'content-top', label: 'Content Top (Before Main Content)' },
  { value: 'content-middle', label: 'Content Middle (Between Sections)' },
  { value: 'content-bottom', label: 'Content Bottom (After Main Content)' },
  { value: 'sidebar-left', label: 'Left Sidebar' },
  { value: 'sidebar-right', label: 'Right Sidebar' },
  { value: 'footer-top', label: 'Footer Top (Before Footer Content)' },
  { value: 'footer-bottom', label: 'Footer Bottom (After Footer Content)' },
  { value: 'floating-top-left', label: 'Floating Top Left' },
  { value: 'floating-top-right', label: 'Floating Top Right' },
  { value: 'floating-bottom-left', label: 'Floating Bottom Left' },
  { value: 'floating-bottom-right', label: 'Floating Bottom Right' },
  { value: 'banner-top', label: 'Full Width Banner Top' },
  { value: 'banner-bottom', label: 'Full Width Banner Bottom' }
];

// Enhanced widget templates
const enhancedWidgetTemplates = [
  {
    name: 'Google AdSense - Display Ad',
    category: 'Advertisements',
    code: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<!-- Display Ad -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`
  },
  {
    name: 'Google AdSense - Banner Ad',
    category: 'Advertisements',
    code: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<!-- Banner Ad -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`
  },
  {
    name: 'Affiliate Banner',
    category: 'Advertisements',
    code: `<div class="affiliate-banner" style="text-align: center; margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
  <a href="#" target="_blank" style="text-decoration: none; color: white;">
    <img src="https://via.placeholder.com/728x90/667eea/FFFFFF?text=Your+Affiliate+Banner" alt="Affiliate Banner" style="max-width: 100%; height: auto; border-radius: 5px;">
  </a>
</div>`
  },
  {
    name: 'Newsletter Signup',
    category: 'Marketing',
    code: `<div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0; border: 2px solid #e9ecef;">
  <h3 style="color: #495057; margin-bottom: 15px;">📧 Stay Updated!</h3>
  <p style="color: #6c757d; margin-bottom: 20px;">Get the latest deals and offers directly in your inbox.</p>
  <form style="display: flex; gap: 10px; max-width: 400px; margin: 0 auto;">
    <input type="email" placeholder="Enter your email" style="flex: 1; padding: 12px; border: 1px solid #ced4da; border-radius: 5px;">
    <button type="submit" style="padding: 12px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Subscribe</button>
  </form>
</div>`
  },
  {
    name: 'Social Media Follow',
    category: 'Social',
    code: `<div style="text-align: center; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0;">
  <h4 style="margin-bottom: 15px; color: #333;">Follow Us</h4>
  <div style="display: flex; justify-content: center; gap: 15px;">
    <a href="#" style="color: #1877f2; font-size: 24px; text-decoration: none;">📘</a>
    <a href="#" style="color: #1da1f2; font-size: 24px; text-decoration: none;">🐦</a>
    <a href="#" style="color: #e4405f; font-size: 24px; text-decoration: none;">📷</a>
    <a href="#" style="color: #25d366; font-size: 24px; text-decoration: none;">💬</a>
  </div>
</div>`
  },
  {
    name: 'Promotional Banner',
    category: 'Marketing',
    code: `<div style="background: linear-gradient(45deg, #ff6b6b, #ee5a24); color: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; position: relative; overflow: hidden;">
  <div style="position: relative; z-index: 2;">
    <h3 style="margin: 0 0 10px 0; font-size: 24px;">🎉 Special Offer!</h3>
    <p style="margin: 0 0 15px 0; font-size: 16px;">Get up to 50% off on selected items</p>
    <a href="#" style="background: white; color: #ff6b6b; padding: 10px 20px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Shop Now</a>
  </div>
</div>`
  },
  {
    name: 'App Download',
    category: 'Marketing',
    code: `<div style="background: #000; color: white; padding: 25px; border-radius: 15px; text-align: center; margin: 20px 0;">
  <h4 style="margin-bottom: 15px;">📱 Download Our App</h4>
  <p style="margin-bottom: 20px; opacity: 0.8;">Get exclusive deals and faster checkout</p>
  <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
    <a href="#" style="display: inline-block;"><img src="https://via.placeholder.com/135x40/000000/FFFFFF?text=App+Store" alt="App Store" style="height: 40px;"></a>
    <a href="#" style="display: inline-block;"><img src="https://via.placeholder.com/135x40/000000/FFFFFF?text=Google+Play" alt="Google Play" style="height: 40px;"></a>
  </div>
</div>`
  },
  {
    name: 'Customer Reviews',
    category: 'Social Proof',
    code: `<div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
  <h4 style="text-align: center; margin-bottom: 20px; color: #333;">⭐ What Our Customers Say</h4>
  <div style="text-align: center; font-style: italic; color: #666; margin-bottom: 15px;">"Amazing deals and fast delivery! Highly recommended."</div>
  <div style="text-align: center; font-weight: bold; color: #333;">- Sarah M.</div>
  <div style="text-align: center; margin-top: 10px;">⭐⭐⭐⭐⭐</div>
</div>`
  },
  {
    name: 'Countdown Timer',
    category: 'Marketing',
    code: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; text-align: center; border-radius: 10px; margin: 20px 0;">
  <h4 style="margin-bottom: 15px;">⏰ Limited Time Offer!</h4>
  <div id="countdown" style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">23:59:45</div>
  <p style="margin: 0; opacity: 0.9;">Hurry up! Offer expires soon</p>
  <script>
    // Simple countdown timer
    let timeLeft = 86385; // 23:59:45 in seconds
    setInterval(() => {
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      const seconds = timeLeft % 60;
      document.getElementById('countdown').textContent = 
        \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
      timeLeft--;
      if (timeLeft < 0) timeLeft = 86400; // Reset to 24 hours
    }, 1000);
  </script>
</div>`
  },
  {
    name: 'Contact Info',
    category: 'Information',
    code: `<div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 20px 0;">
  <h4 style="margin-bottom: 15px; color: #333; text-align: center;">📞 Contact Us</h4>
  <div style="text-align: center; color: #666; line-height: 1.6;">
    <div style="margin-bottom: 8px;">📧 support@pickntrust.com</div>
    <div style="margin-bottom: 8px;">📱 +1 (555) 123-4567</div>
    <div>🕒 Mon-Fri: 9AM-6PM</div>
  </div>
</div>`
  }
];

function analyzeCurrentImplementation() {
  console.log('\n1️⃣ ANALYZING CURRENT IMPLEMENTATION:');
  
  // Check which pages exist
  const existingPages = [];
  const missingPages = [];
  
  pageFiles.forEach(pageFile => {
    const pagePath = path.join(pagesDir, pageFile);
    if (fs.existsSync(pagePath)) {
      existingPages.push(pageFile);
    } else {
      missingPages.push(pageFile);
    }
  });
  
  console.log(`\n📊 Page Analysis:`);
  console.log(`   ✅ Existing pages: ${existingPages.length}`);
  existingPages.forEach(page => console.log(`      • ${page}`));
  
  if (missingPages.length > 0) {
    console.log(`   ❌ Missing pages: ${missingPages.length}`);
    missingPages.forEach(page => console.log(`      • ${page}`));
  }
  
  return { existingPages, missingPages };
}

function checkWidgetImplementation() {
  console.log('\n2️⃣ CHECKING WIDGET IMPLEMENTATION:');
  
  const pagesWithWidgets = [];
  const pagesWithoutWidgets = [];
  
  const existingPages = fs.readdirSync(pagesDir).filter(file => file.endsWith('.tsx'));
  
  existingPages.forEach(pageFile => {
    const pagePath = path.join(pagesDir, pageFile);
    const content = fs.readFileSync(pagePath, 'utf8');
    
    const hasWidgetRenderer = content.includes('WidgetRenderer');
    const hasPageLayout = content.includes('PageLayout') || content.includes('HomePageLayout') || content.includes('CategoryPageLayout');
    
    if (hasWidgetRenderer || hasPageLayout) {
      pagesWithWidgets.push({ file: pageFile, method: hasWidgetRenderer ? 'WidgetRenderer' : 'PageLayout' });
    } else {
      pagesWithoutWidgets.push(pageFile);
    }
  });
  
  console.log(`\n📊 Widget Implementation Status:`);
  console.log(`   ✅ Pages with widgets: ${pagesWithWidgets.length}`);
  pagesWithWidgets.forEach(page => console.log(`      • ${page.file} (${page.method})`));
  
  console.log(`   ❌ Pages without widgets: ${pagesWithoutWidgets.length}`);
  pagesWithoutWidgets.forEach(page => console.log(`      • ${page}`));
  
  return { pagesWithWidgets, pagesWithoutWidgets };
}

function generateImplementationPlan() {
  console.log('\n3️⃣ IMPLEMENTATION PLAN:');
  
  const plan = {
    phase1: 'Update WidgetManagement component with enhanced positions and templates',
    phase2: 'Create universal PageLayout wrapper for all pages',
    phase3: 'Update all existing pages to use widget system',
    phase4: 'Add floating and banner widget support',
    phase5: 'Create widget preview system',
    phase6: 'Add widget analytics and performance tracking'
  };
  
  console.log('\n📋 Implementation Phases:');
  Object.entries(plan).forEach(([phase, description]) => {
    console.log(`   ${phase.toUpperCase()}: ${description}`);
  });
  
  return plan;
}

function generateWidgetPositionsCode() {
  console.log('\n4️⃣ GENERATING ENHANCED WIDGET POSITIONS:');
  
  const positionsCode = `// Enhanced widget positions for better placement control
export const WIDGET_POSITIONS = [
${widgetPositions.map(pos => `  { value: '${pos.value}', label: '${pos.label}' }`).join(',\n')}
];

// Widget position categories for better organization
export const WIDGET_POSITION_CATEGORIES = {
  header: ['header-top', 'header-bottom'],
  content: ['content-top', 'content-middle', 'content-bottom'],
  sidebar: ['sidebar-left', 'sidebar-right'],
  footer: ['footer-top', 'footer-bottom'],
  floating: ['floating-top-left', 'floating-top-right', 'floating-bottom-left', 'floating-bottom-right'],
  banner: ['banner-top', 'banner-bottom']
};`;
  
  console.log('✅ Enhanced positions code generated');
  return positionsCode;
}

function generateTemplatesCode() {
  console.log('\n5️⃣ GENERATING ENHANCED WIDGET TEMPLATES:');
  
  const templatesCode = `// Enhanced widget templates with more options
export const ENHANCED_WIDGET_TEMPLATES = [
${enhancedWidgetTemplates.map(template => 
    `  {
    name: '${template.name}',
    category: '${template.category}',
    code: \`${template.code.replace(/`/g, '\\`')}\`
  }`
  ).join(',\n')}
];`;
  
  console.log('✅ Enhanced templates code generated');
  return templatesCode;
}

function main() {
  try {
    console.log('🔍 Starting comprehensive widget system analysis...');
    
    const { existingPages, missingPages } = analyzeCurrentImplementation();
    const { pagesWithWidgets, pagesWithoutWidgets } = checkWidgetImplementation();
    const plan = generateImplementationPlan();
    const positionsCode = generateWidgetPositionsCode();
    const templatesCode = generateTemplatesCode();
    
    console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('\n✅ IMMEDIATE ACTIONS NEEDED:');
    console.log('1. Delete debug widget (red banner)');
    console.log('2. Update Banner Ad position from "Content Top" to "content-top"');
    console.log('3. Add WidgetRenderer to all pages without widget support');
    console.log('4. Implement enhanced position system');
    console.log('5. Add comprehensive widget templates');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. I will update the WidgetManagement component with enhanced positions');
    console.log('2. I will add WidgetRenderer to all pages systematically');
    console.log('3. I will create a comprehensive widget template library');
    console.log('4. I will ensure widgets work on every page without manual checking');
    
    console.log('\n📊 CURRENT STATUS:');
    console.log(`   • Total pages: ${existingPages.length}`);
    console.log(`   • Pages with widgets: ${pagesWithWidgets.length}`);
    console.log(`   • Pages needing widgets: ${pagesWithoutWidgets.length}`);
    console.log(`   • Enhanced positions: ${widgetPositions.length}`);
    console.log(`   • Enhanced templates: ${enhancedWidgetTemplates.length}`);
    
  } catch (error) {
    console.log('❌ Analysis failed:', error.message);
  }
}

main();
console.log('\n✅ Site-wide widget system analysis complete!');