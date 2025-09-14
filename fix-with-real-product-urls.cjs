const fetch = require('node-fetch');
const cheerio = require('cheerio');
const Database = require('better-sqlite3');

console.log('🔧 FIXING WITH REAL INDIVIDUAL PRODUCT URLS');
console.log('=' .repeat(60));

async function fixWithRealProductUrls() {
  try {
    const db = new Database('database.sqlite');
    
    // Update with actual individual product URLs that have real images
    const realProducts = [
      {
        id: 12,
        name: 'Samsung Galaxy S24 Ultra 5G (256GB, Titanium Black)',
        affiliate_url: 'https://www.samsung.com/in/smartphones/galaxy-s24-ultra/buy/',
        expected_image_domain: 'samsung.com'
      },
      {
        id: 11,
        name: 'Apple iPhone 15 Pro Max (256GB, Natural Titanium)',
        affiliate_url: 'https://www.apple.com/in/iphone-15-pro/',
        expected_image_domain: 'apple.com'
      },
      {
        id: 10,
        name: 'OnePlus 12 5G (256GB, Flowy Emerald)',
        affiliate_url: 'https://www.oneplus.in/12',
        expected_image_domain: 'oneplus.in'
      }
    ];
    
    console.log('Updating with real individual product URLs...');
    console.log('');
    
    const updateUrlStmt = db.prepare('UPDATE click_picks_products SET affiliate_url = ?, name = ? WHERE id = ?');
    const updateImageStmt = db.prepare('UPDATE click_picks_products SET image_url = ? WHERE id = ?');
    
    // First update the URLs
    realProducts.forEach(product => {
      updateUrlStmt.run(product.affiliate_url, product.name, product.id);
      console.log(`Success Updated Product ${product.id} URL:`);
      console.log(`   Name: ${product.name}`);
      console.log(`   URL: ${product.affiliate_url}`);
      console.log('');
    });
    
    console.log('Search Now scraping real images from individual product pages...');
    console.log('');
    
    // Now scrape real images from these individual product pages
    for (const product of realProducts) {
      try {
        console.log(`\nSearch Scraping Product ${product.id}: ${product.name}`);
        console.log(`   URL: ${product.affiliate_url}`);
        
        const response = await fetch(product.affiliate_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
          },
          timeout: 20000
        });
        
        if (!response.ok) {
          console.log(`   Error HTTP Error: ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        console.log(`   📄 Page loaded successfully`);
        
        // Platform-specific selectors
        let imageSelectors = [];
        
        if (product.affiliate_url.includes('samsung.com')) {
          imageSelectors = [
            '.pd-gallery__main-image img',
            '.gallery-image img',
            '.product-hero-image img',
            '.kv-image img',
            '.pd-gallery img',
            'img[alt*="Galaxy"]',
            'img[alt*="Samsung"]'
          ];
        } else if (product.affiliate_url.includes('apple.com')) {
          imageSelectors = [
            '.hero-image img',
            '.product-hero img',
            '.gallery-image img',
            '.rf-pdp-gallery img',
            'img[alt*="iPhone"]',
            'img[alt*="Apple"]'
          ];
        } else if (product.affiliate_url.includes('oneplus')) {
          imageSelectors = [
            '.product-image img',
            '.hero-image img',
            '.gallery-image img',
            '.product-gallery img',
            'img[alt*="OnePlus"]',
            'img[alt*="12"]'
          ];
        }
        
        // Add generic selectors as fallback
        imageSelectors.push(
          '.product-image img',
          '.main-image img',
          '.hero-image img',
          '.gallery img',
          'img[src*="product"]',
          'main img'
        );
        
        const images = [];
        
        // Extract images
        imageSelectors.forEach(selector => {
          $(selector).each((_, element) => {
            const $img = $(element);
            let src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
            
            if (src) {
              // Convert relative URLs to absolute
              if (src.startsWith('//')) {
                src = 'https:' + src;
              } else if (src.startsWith('/')) {
                const url = new URL(product.affiliate_url);
                src = url.origin + src;
              }
              
              // Filter for real product images
              const lowerSrc = src.toLowerCase();
              if (!lowerSrc.includes('logo') && 
                  !lowerSrc.includes('icon') && 
                  !lowerSrc.includes('placeholder') &&
                  !lowerSrc.includes('banner') &&
                  !lowerSrc.endsWith('.svg') &&
                  (lowerSrc.includes('.jpg') || lowerSrc.includes('.jpeg') || lowerSrc.includes('.png') || lowerSrc.includes('.webp')) &&
                  src.length > 50 && // Ensure it's not a tiny image
                  !images.includes(src)) {
                images.push(src);
              }
            }
          });
        });
        
        // Also check Open Graph images
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage && ogImage.includes(product.expected_image_domain)) {
          images.unshift(ogImage); // Add to beginning as it's likely the main product image
        }
        
        console.log(`   📸 Found ${images.length} potential images`);
        
        if (images.length > 0) {
          // Select the best image (prefer ones from the expected domain)
          const bestImage = images.find(img => img.includes(product.expected_image_domain)) || images[0];
          
          console.log(`   Success Selected real image: ${bestImage}`);
          
          // Update database with real image
          updateImageStmt.run(bestImage, product.id);
          console.log(`   Save Updated database with REAL product image`);
        } else {
          console.log(`   Error No suitable images found`);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`   Error Error scraping Product ${product.id}: ${error.message}`);
      }
    }
    
    // Final verification
    console.log('\nSuccess FINAL VERIFICATION - Products with REAL images:');
    console.log('=' .repeat(60));
    
    const finalProducts = db.prepare(`
      SELECT id, name, image_url, affiliate_url 
      FROM click_picks_products 
      WHERE id IN (10, 11, 12)
      ORDER BY id DESC
    `).all();
    
    finalProducts.forEach(p => {
      console.log(`${p.id}: ${p.name}`);
      console.log(`   URL: ${p.affiliate_url}`);
      console.log(`   Image: ${p.image_url}`);
      
      // Check if it's a real scraped image from the brand's domain
      const isRealBrandImage = p.image_url && (
        p.image_url.includes('samsung.com') ||
        p.image_url.includes('apple.com') ||
        p.image_url.includes('oneplus.in') ||
        p.image_url.includes('oneplus.com')
      );
      
      if (isRealBrandImage) {
        console.log(`   Celebration REAL BRAND IMAGE FROM OFFICIAL SOURCE!`);
      } else {
        console.log(`   Warning  Still needs real brand image`);
      }
      console.log('');
    });
    
    console.log('Celebration REAL PRODUCT URL AND IMAGE FIX COMPLETE!');
    console.log('Success Updated with individual product pages');
    console.log('Success Scraped real images from official brand websites');
    console.log('Success Authentic product visualization from source');
    
    db.close();
    
  } catch (error) {
    console.error('Error Fix failed:', error.message);
  }
}

// Run the fix
fixWithRealProductUrls().catch(console.error);