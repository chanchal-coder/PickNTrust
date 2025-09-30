// Check what components are missing from CueLinks product cards
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Search Analyzing CueLinks Product Components\n');
  
  // Get the main CueLinks product
  const product = db.prepare('SELECT * FROM cuelinks_products WHERE id = 2').get();
  
  if (!product) {
    console.log('Error No CueLinks product found with ID 2');
    db.close();
    return;
  }
  
  console.log('Products Complete Product Data Analysis:');
  console.log('=====================================');
  
  // Essential components for product cards
  const components = {
    'Product ID': product.id,
    'Product Name': product.name,
    'Price': product.price ? `₹${product.price}` : 'MISSING',
    'Original Price': product.original_price ? `₹${product.original_price}` : 'Not available',
    'Image URL': product.image_url ? 'Available' : 'MISSING',
    'Affiliate URL': product.affiliate_url ? 'Available' : 'MISSING',
    'Category': product.category || 'MISSING',
    'Rating': product.rating || 'MISSING',
    'Review Count': product.review_count || 'MISSING',
    'Discount': product.discount ? `${product.discount}%` : 'Not available',
    'Description': product.description || 'MISSING',
    'Is Featured': product.is_featured ? 'Yes' : 'No',
    'Is New': product.is_new ? 'Yes' : 'No',
    'Processing Status': product.processing_status || 'MISSING'
  };
  
  // Check each component
  let missingComponents = [];
  let availableComponents = [];
  
  Object.entries(components).forEach(([key, value]) => {
    const status = value === 'MISSING' || value === null || value === undefined ? 'Error' : 'Success';
    console.log(`   ${status} ${key}: ${value}`);
    
    if (status === 'Error') {
      missingComponents.push(key);
    } else {
      availableComponents.push(key);
    }
  });
  
  console.log('\nStats Component Analysis Summary:');
  console.log('==============================');
  console.log(`Success Available Components: ${availableComponents.length}`);
  console.log(`Error Missing Components: ${missingComponents.length}`);
  
  if (missingComponents.length > 0) {
    console.log('\nAlert Missing Components That Affect Product Card Display:');
    missingComponents.forEach(component => {
      console.log(`   • ${component}`);
    });
    
    console.log('\nTip Impact on Product Card:');
    if (missingComponents.includes('Description')) {
      console.log('   • Product description will be empty or generic');
    }
    if (missingComponents.includes('Review Count')) {
      console.log('   • Review count will not display');
    }
    if (missingComponents.includes('Discount')) {
      console.log('   • Discount badge will not appear');
    }
    if (missingComponents.includes('Processing Status')) {
      console.log('   • Product status may be unclear');
    }
  } else {
    console.log('\nCelebration All essential components are available!');
  }
  
  // Check what Prime Picks has for comparison
  console.log('\nRefresh Comparing with Prime Picks product structure...');
  const primeProduct = db.prepare('SELECT * FROM amazon_products LIMIT 1').get();
  
  if (primeProduct) {
    console.log('\n📋 Prime Picks Product Components:');
    Object.keys(primeProduct).forEach(key => {
      const hasValue = primeProduct[key] !== null && primeProduct[key] !== undefined && primeProduct[key] !== '';
      console.log(`   ${hasValue ? 'Success' : 'Error'} ${key}: ${hasValue ? 'Available' : 'Missing'}`);
    });
  }
  
  db.close();
  
  console.log('\nTarget Recommendations:');
  if (missingComponents.length > 0) {
    console.log('1. Update CueLinks scraper to extract missing components');
    console.log('2. Add fallback values for missing data');
    console.log('3. Ensure product card template handles missing components gracefully');
  } else {
    console.log('1. Success All components are available');
    console.log('2. Success Product cards should display completely');
    console.log('3. Success Check frontend rendering if issues persist');
  }
  
} catch (error) {
  console.error('Error Error analyzing components:', error.message);
}