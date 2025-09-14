const Database = require('better-sqlite3');

console.log('🎨 BRANDED FALLBACK IMAGE SYSTEM');
console.log('=' .repeat(50));
console.log('💼 Purpose: Professional fallbacks for products without images');
console.log('Target Goal: Maintain trust even when real images unavailable');
console.log('Special Method: Brand-specific, category-based placeholder system');
console.log('');

// High-quality, brand-specific fallback images
const brandedFallbacks = {
  // Technology & Electronics
  'samsung': {
    phones: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80', // Samsung phone
    tablets: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80', // Samsung tablet
    watches: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', // Samsung watch
    default: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80'
  },
  'apple': {
    phones: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80', // iPhone
    tablets: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80', // iPad
    watches: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80', // Apple Watch
    laptops: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80', // MacBook
    default: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80'
  },
  'oneplus': {
    phones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80', // OnePlus phone
    default: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80'
  },
  'matrix': {
    esim: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', // SIM/eSIM
    travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80', // Travel
    default: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
  },
  
  // Category-based fallbacks for unknown brands
  categories: {
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80',
    'phones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    'smartphones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    'mobile': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    'tablets': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
    'laptops': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    'computers': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    'watches': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    'smartwatch': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    'headphones': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    'earbuds': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    'audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    'cameras': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
    'photography': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
    'gaming': 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&q=80',
    'accessories': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80',
    'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80',
    'esim': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    'sim': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    'connectivity': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    'software': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80',
    'apps': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80',
    'services': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
    'default': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80'
  }
};

class BrandedFallbackSystem {
  constructor() {
    this.fallbacks = brandedFallbacks;
  }

  // Detect brand from product name or URL
  detectBrand(productName, affiliateUrl = '') {
    const text = (productName + ' ' + affiliateUrl).toLowerCase();
    
    if (text.includes('samsung')) return 'samsung';
    if (text.includes('apple') || text.includes('iphone') || text.includes('ipad') || text.includes('macbook')) return 'apple';
    if (text.includes('oneplus') || text.includes('one plus')) return 'oneplus';
    if (text.includes('matrix')) return 'matrix';
    
    return null;
  }

  // Detect product category
  detectCategory(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('phone') || name.includes('smartphone') || name.includes('mobile')) return 'phones';
    if (name.includes('tablet') || name.includes('ipad')) return 'tablets';
    if (name.includes('laptop') || name.includes('macbook') || name.includes('computer')) return 'laptops';
    if (name.includes('watch') || name.includes('smartwatch')) return 'watches';
    if (name.includes('headphone') || name.includes('earphone')) return 'headphones';
    if (name.includes('earbud') || name.includes('airpod')) return 'earbuds';
    if (name.includes('camera')) return 'cameras';
    if (name.includes('gaming') || name.includes('game')) return 'gaming';
    if (name.includes('esim') || name.includes('e-sim')) return 'esim';
    if (name.includes('sim')) return 'sim';
    if (name.includes('travel')) return 'travel';
    if (name.includes('software') || name.includes('app')) return 'software';
    if (name.includes('service')) return 'services';
    if (name.includes('electronic')) return 'electronics';
    
    return 'default';
  }

  // Get best fallback image for a product
  getBestFallback(productName, affiliateUrl = '') {
    const brand = this.detectBrand(productName, affiliateUrl);
    const category = this.detectCategory(productName);
    
    console.log(`   Search Brand detected: ${brand || 'Unknown'}`);
    console.log(`   📂 Category detected: ${category}`);
    
    // Try brand-specific category first
    if (brand && this.fallbacks[brand] && this.fallbacks[brand][category]) {
      console.log(`   Success Using brand-specific ${category} image`);
      return {
        imageUrl: this.fallbacks[brand][category],
        type: 'brand-category',
        brand: brand,
        category: category
      };
    }
    
    // Try brand default
    if (brand && this.fallbacks[brand] && this.fallbacks[brand].default) {
      console.log(`   Success Using brand default image`);
      return {
        imageUrl: this.fallbacks[brand].default,
        type: 'brand-default',
        brand: brand,
        category: category
      };
    }
    
    // Try category fallback
    if (this.fallbacks.categories[category]) {
      console.log(`   Success Using category-specific image`);
      return {
        imageUrl: this.fallbacks.categories[category],
        type: 'category',
        brand: brand,
        category: category
      };
    }
    
    // Use default fallback
    console.log(`   Success Using default fallback image`);
    return {
      imageUrl: this.fallbacks.categories.default,
      type: 'default',
      brand: brand,
      category: category
    };
  }
}

// Main execution
async function createBrandedFallbacks() {
  const fallbackSystem = new BrandedFallbackSystem();
  
  try {
    const db = new Database('./database.sqlite');
    
    // Get all Click Picks products
    const products = db.prepare(`
      SELECT id, name, affiliate_url, image_url 
      FROM click_picks_products 
      ORDER BY id
    `).all();
    
    console.log(`Stats Processing ${products.length} products for branded fallbacks`);
    console.log('');
    
    const updates = [];
    
    products.forEach((product, index) => {
      console.log(`\n[${index + 1}/${products.length}] ${product.name}`);
      console.log('-' .repeat(50));
      
      // Check if product needs a fallback (has generic/placeholder image)
      const needsFallback = !product.image_url || 
                           product.image_url.includes('picsum.photos') ||
                           product.image_url.includes('placeholder') ||
                           product.image_url.includes('unsplash.com/photo-1560472354-b33ff0c44a43'); // Generic fallback
      
      if (needsFallback) {
        console.log(`   Refresh Needs branded fallback`);
        const fallback = fallbackSystem.getBestFallback(product.name, product.affiliate_url);
        
        updates.push({
          id: product.id,
          name: product.name,
          oldImage: product.image_url,
          newImage: fallback.imageUrl,
          fallbackType: fallback.type,
          brand: fallback.brand,
          category: fallback.category
        });
        
        console.log(`   🎨 New fallback: ${fallback.imageUrl}`);
        console.log(`   📋 Type: ${fallback.type}`);
      } else {
        console.log(`   Success Already has good image: ${product.image_url}`);
      }
    });
    
    // Apply updates
    if (updates.length > 0) {
      console.log('\n' + '=' .repeat(60));
      console.log('Refresh APPLYING BRANDED FALLBACK UPDATES');
      console.log('=' .repeat(60));
      
      const updateStmt = db.prepare('UPDATE click_picks_products SET image_url = ? WHERE id = ?');
      
      updates.forEach((update, index) => {
        console.log(`\n${index + 1}. Updating: ${update.name}`);
        console.log(`   Refresh From: ${update.oldImage || 'NULL'}`);
        console.log(`   Success To: ${update.newImage}`);
        console.log(`   🏷️  Type: ${update.fallbackType} (${update.brand || 'generic'} - ${update.category})`);
        
        updateStmt.run(update.newImage, update.id);
      });
      
      console.log(`\nSuccess Updated ${updates.length} products with branded fallbacks`);
    } else {
      console.log('\nSuccess All products already have good images!');
    }
    
    // Final verification
    console.log('\n' + '=' .repeat(60));
    console.log('Stats FINAL IMAGE STATUS');
    console.log('=' .repeat(60));
    
    const finalProducts = db.prepare('SELECT id, name, image_url FROM click_picks_products ORDER BY id').all();
    
    finalProducts.forEach((product, index) => {
      const isGeneric = product.image_url.includes('picsum.photos') || product.image_url.includes('placeholder');
      const isBranded = product.image_url.includes('unsplash.com') && !isGeneric;
      
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   🖼️  ${isBranded ? 'Success Branded/Professional' : isGeneric ? 'Warning  Generic' : 'Target Real/Extracted'} image`);
      console.log(`   Link ${product.image_url}`);
      console.log('');
    });
    
    db.close();
    
    console.log('Target BRANDED FALLBACK SYSTEM BENEFITS:');
    console.log('Success Professional appearance even without real images');
    console.log('Success Brand-specific fallbacks maintain visual consistency');
    console.log('Success Category-based matching ensures relevance');
    console.log('Success Builds trust vs random placeholder images');
    console.log('Success High-quality Unsplash images (no copyright issues)');
    console.log('');
    console.log('Tip RECOMMENDATION:');
    console.log('1. Use this system for immediate professional appearance');
    console.log('2. Run real image extraction for authentic photos');
    console.log('3. Combine both for maximum trust and conversion');
    
  } catch (error) {
    console.error('Error Error creating branded fallbacks:', error.message);
  }
}

// Run the branded fallback system
createBrandedFallbacks().catch(console.error);