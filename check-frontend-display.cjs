const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🖥️ CHECKING FRONTEND DISPLAY COMPONENTS');
console.log('='.repeat(60));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('🔍 1. ANALYZING PRODUCT DATA FOR FRONTEND:');
  console.log('-'.repeat(60));

  // Get sample products from each display page
  const displayPages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'global-picks', 'travel-picks', 'deals-hub', 'loot-box'];
  
  for (const page of displayPages) {
    console.log(`\n📄 ${page.toUpperCase()}:`);
    
    const products = db.prepare(`
      SELECT id, title, price, original_price, discount, image_url, affiliate_url, source_type
      FROM unified_content 
      WHERE display_pages = ? AND processing_status = 'active'
      ORDER BY created_at DESC
      LIMIT 3
    `).all(page);

    if (products.length === 0) {
      console.log(`   ❌ No products found for ${page}`);
      continue;
    }

    products.forEach((product, index) => {
      console.log(`   📦 Product ${index + 1}:`);
      console.log(`      ID: ${product.id}`);
      console.log(`      Title: ${product.title?.substring(0, 50)}...`);
      console.log(`      Price: ${product.price || 'NULL'}`);
      console.log(`      Original Price: ${product.original_price || 'NULL'}`);
      console.log(`      Discount: ${product.discount || 'NULL'}`);
      console.log(`      Image URL: ${product.image_url?.substring(0, 60)}...`);
      console.log(`      Affiliate URL: ${product.affiliate_url ? 'Present' : 'NULL'}`);
      console.log(`      Source: ${product.source_type}`);
      
      // Check for potential issues
      const issues = [];
      if (!product.price || product.price === '0' || product.price === 'NULL') {
        issues.push('Missing/Invalid Price');
      }
      if (!product.image_url || product.image_url.includes('/api/placeholder')) {
        issues.push('Placeholder Image');
      }
      if (!product.affiliate_url) {
        issues.push('Missing Affiliate URL');
      }
      if (product.title === 'Product from Telegram') {
        issues.push('Generic Title');
      }
      
      if (issues.length > 0) {
        console.log(`      ⚠️  Issues: ${issues.join(', ')}`);
      } else {
        console.log(`      ✅ No issues detected`);
      }
    });
  }

  console.log('\n🔍 2. CHECKING FRONTEND COMPONENT FILES:');
  console.log('-'.repeat(60));

  // Check if frontend files exist and analyze them
  const frontendPaths = [
    path.join(__dirname, 'client', 'src', 'components'),
    path.join(__dirname, 'client', 'src', 'pages'),
    path.join(__dirname, 'src', 'components'),
    path.join(__dirname, 'src', 'pages')
  ];

  let componentDir = null;
  for (const dir of frontendPaths) {
    if (fs.existsSync(dir)) {
      componentDir = dir;
      break;
    }
  }

  if (componentDir) {
    console.log(`   📁 Found frontend components in: ${componentDir}`);
    
    // Look for product-related components
    const files = fs.readdirSync(componentDir, { recursive: true });
    const productFiles = files.filter(file => 
      typeof file === 'string' && 
      (file.toLowerCase().includes('product') || 
       file.toLowerCase().includes('card') || 
       file.toLowerCase().includes('item'))
    );

    console.log(`   📄 Product-related files found: ${productFiles.length}`);
    productFiles.forEach(file => {
      console.log(`      - ${file}`);
    });

    // Check for specific component patterns
    const componentPatterns = [
      'ProductCard',
      'ProductItem', 
      'ProductList',
      'Card',
      'Item'
    ];

    for (const pattern of componentPatterns) {
      const matchingFiles = files.filter(file => 
        typeof file === 'string' && file.includes(pattern)
      );
      if (matchingFiles.length > 0) {
        console.log(`   🎯 ${pattern} components: ${matchingFiles.join(', ')}`);
      }
    }
  } else {
    console.log(`   ❌ Frontend components directory not found`);
  }

  console.log('\n🔍 3. API ENDPOINT RESPONSE ANALYSIS:');
  console.log('-'.repeat(60));

  // Simulate API responses for each page
  for (const page of displayPages) {
    const products = db.prepare(`
      SELECT 
        id,
        title,
        description,
        price,
        original_price,
        discount,
        image_url,
        affiliate_url,
        created_at,
        source_type
      FROM unified_content 
      WHERE display_pages = ? AND processing_status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `).all(page);

    if (products.length > 0) {
      const product = products[0];
      console.log(`\n📡 API Response for /${page}:`);
      console.log(`   Status: 200 OK`);
      console.log(`   Products Count: ${products.length}`);
      console.log(`   Sample Product Structure:`);
      console.log(`   {`);
      console.log(`     "id": ${product.id},`);
      console.log(`     "title": "${product.title}",`);
      console.log(`     "price": "${product.price}",`);
      console.log(`     "original_price": "${product.original_price}",`);
      console.log(`     "discount": "${product.discount}",`);
      console.log(`     "image_url": "${product.image_url}",`);
      console.log(`     "affiliate_url": "${product.affiliate_url ? '[PRESENT]' : null}",`);
      console.log(`     "source_type": "${product.source_type}"`);
      console.log(`   }`);

      // Check for frontend display issues
      const displayIssues = [];
      
      if (!product.price || product.price === '0') {
        displayIssues.push('Price will show as 0 or empty');
      }
      
      if (!product.original_price) {
        displayIssues.push('No strikethrough price will be shown');
      }
      
      if (!product.discount) {
        displayIssues.push('No discount badge will be displayed');
      }
      
      if (product.image_url && product.image_url.includes('/api/placeholder')) {
        displayIssues.push('Will show placeholder image');
      }
      
      if (!product.affiliate_url) {
        displayIssues.push('Buy button may not work');
      }

      if (displayIssues.length > 0) {
        console.log(`   ⚠️  Frontend Display Issues:`);
        displayIssues.forEach(issue => console.log(`      - ${issue}`));
      } else {
        console.log(`   ✅ Should display correctly`);
      }
    }
  }

  console.log('\n🔍 4. COMMON FRONTEND ISSUES ANALYSIS:');
  console.log('-'.repeat(60));

  // Analyze common issues that could cause frontend problems
  const issueAnalysis = {
    'Products with no price': db.prepare(`
      SELECT COUNT(*) as count FROM unified_content 
      WHERE (price IS NULL OR price = '0' OR price = '') 
      AND processing_status = 'active'
    `).get().count,
    
    'Products with placeholder images': db.prepare(`
      SELECT COUNT(*) as count FROM unified_content 
      WHERE image_url LIKE '%placeholder%' 
      AND processing_status = 'active'
    `).get().count,
    
    'Products with no affiliate URL': db.prepare(`
      SELECT COUNT(*) as count FROM unified_content 
      WHERE (affiliate_url IS NULL OR affiliate_url = '') 
      AND processing_status = 'active'
    `).get().count,
    
    'Products with generic titles': db.prepare(`
      SELECT COUNT(*) as count FROM unified_content 
      WHERE title = 'Product from Telegram' 
      AND processing_status = 'active'
    `).get().count,
    
    'Products with no original price': db.prepare(`
      SELECT COUNT(*) as count FROM unified_content 
      WHERE (original_price IS NULL OR original_price = '') 
      AND processing_status = 'active'
    `).get().count,
    
    'Products with no discount': db.prepare(`
      SELECT COUNT(*) as count FROM unified_content 
      WHERE (discount IS NULL OR discount = '') 
      AND processing_status = 'active'
    `).get().count
  };

  console.log('   📊 Issue Statistics:');
  Object.entries(issueAnalysis).forEach(([issue, count]) => {
    const severity = count > 10 ? '🔴' : count > 5 ? '🟡' : '🟢';
    console.log(`   ${severity} ${issue}: ${count}`);
  });

  console.log('\n🔍 5. RECOMMENDATIONS:');
  console.log('-'.repeat(60));

  const recommendations = [];
  
  if (issueAnalysis['Products with no price'] > 0) {
    recommendations.push('Fix price extraction in Telegram bot message processing');
  }
  
  if (issueAnalysis['Products with placeholder images'] > 5) {
    recommendations.push('Improve image URL extraction from Telegram messages');
  }
  
  if (issueAnalysis['Products with no affiliate URL'] > 0) {
    recommendations.push('Ensure affiliate URL generation is working for all platforms');
  }
  
  if (issueAnalysis['Products with generic titles'] > 0) {
    recommendations.push('Enhance title extraction logic in message processing');
  }
  
  if (issueAnalysis['Products with no original price'] > 10) {
    recommendations.push('Improve original price detection patterns');
  }

  if (recommendations.length > 0) {
    console.log('   📝 Action Items:');
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  } else {
    console.log('   ✅ No major issues detected');
  }

  console.log('\n✅ FRONTEND DISPLAY CHECK COMPLETE');
  console.log('='.repeat(60));

} catch (error) {
  console.error('❌ Error during frontend check:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}