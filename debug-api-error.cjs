const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('🔍 Debugging API error step by step...');
  
  const page = 'prime-picks';
  const parsedLimit = 50;
  const parsedOffset = 0;
  
  // Step 1: Test the query
  console.log('\n1️⃣ Testing database query...');
  let query = `
    SELECT * FROM unified_content 
    WHERE (processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL)
    AND (visibility = 'public' OR visibility IS NULL)
    AND (status = 'published' OR status = 'active' OR status IS NULL)
    AND (
      display_pages LIKE '%' || ? || '%' OR
      display_pages = ?
    )
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `;
  
  const params = [page, page, parsedLimit, parsedOffset];
  
  try {
    const rawProducts = db.prepare(query).all(...params);
    console.log(`✅ Query successful! Found ${rawProducts.length} raw products`);
    
    // Step 2: Test data transformation
    console.log('\n2️⃣ Testing data transformation...');
    
    const products = rawProducts.map((product, index) => {
      try {
        console.log(`  Processing product ${index + 1}: ID ${product.id} - ${product.title}`);
        
        let transformedProduct = {
          id: product.id,
          name: product.title || 'Untitled Product',
          description: product.description || 'No description available',
          price: product.price,
          originalPrice: product.originalPrice,
          currency: product.currency || 'INR',
          imageUrl: product.imageUrl,
          affiliateUrl: product.affiliateUrl,
          category: product.category,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0,
          discount: product.discount,
          isNew: product.isNew === 1,
          isFeatured: product.isFeatured === 1,
          createdAt: product.createdAt
        };

        // Parse the content field if it exists and is valid JSON (fallback)
        if (product.content && (!transformedProduct.price || !transformedProduct.originalPrice)) {
          try {
            const contentData = JSON.parse(product.content);
            transformedProduct.price = transformedProduct.price || contentData.price;
            transformedProduct.originalPrice = transformedProduct.originalPrice || contentData.originalPrice;
            transformedProduct.currency = transformedProduct.currency || contentData.currency || 'INR';
            transformedProduct.rating = transformedProduct.rating || contentData.rating || 0;
            transformedProduct.reviewCount = transformedProduct.reviewCount || contentData.reviewCount || 0;
            transformedProduct.discount = transformedProduct.discount || contentData.discount;
          } catch (e) {
            console.warn(`    ⚠️ Failed to parse content for product ${product.id}:`, e.message);
          }
        }

        // Parse media_urls for image with error handling
        if (product.media_urls) {
          try {
            const mediaUrls = JSON.parse(product.media_urls);
            if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
              transformedProduct.imageUrl = mediaUrls[0];
            }
          } catch (e) {
            console.warn(`    ⚠️ Failed to parse media_urls for product ${product.id}:`, e.message);
          }
        }

        // Fallback to imageUrl field if media_urls is not available
        if (!transformedProduct.imageUrl && product.imageUrl) {
          transformedProduct.imageUrl = product.imageUrl;
        }

        // Additional fallback to image_url field (database field name)
        if (!transformedProduct.imageUrl && product.image_url) {
          transformedProduct.imageUrl = product.image_url;
        }

        // Parse affiliate_urls for affiliate link with error handling
        if (product.affiliate_urls) {
          try {
            const affiliateUrls = JSON.parse(product.affiliate_urls);
            if (Array.isArray(affiliateUrls) && affiliateUrls.length > 0) {
              transformedProduct.affiliateUrl = affiliateUrls[0];
            }
          } catch (e) {
            console.warn(`    ⚠️ Failed to parse affiliate_urls for product ${product.id}:`, e.message);
          }
        }

        // Fallback to affiliateUrl field if affiliate_urls is not available
        if (!transformedProduct.affiliateUrl && product.affiliateUrl) {
          transformedProduct.affiliateUrl = product.affiliateUrl;
        }

        console.log(`    ✅ Product ${product.id} transformed successfully`);
        return transformedProduct;
        
      } catch (productError) {
        console.error(`    ❌ Error transforming product ${product.id}:`, productError);
        throw productError; // Re-throw to see what's causing the issue
      }
    });
    
    console.log(`\n✅ All ${products.length} products transformed successfully!`);
    console.log('\n📊 Sample transformed product:');
    console.log(JSON.stringify(products[0], null, 2));
    
  } catch (queryError) {
    console.error('❌ Query execution failed:', queryError);
    throw queryError;
  }
  
  db.close();
  console.log('\n🎉 Debug completed successfully - no errors found!');
  
} catch (error) {
  console.error('\n💥 Error found:', error.message);
  console.error('Full error:', error);
}