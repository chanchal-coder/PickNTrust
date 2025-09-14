/**
 * Fix Admin Product Routing to Bot Tables
 * Route admin products to correct bot-specific tables based on displayPages selection
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING ADMIN PRODUCT ROUTING TO BOT TABLES');
console.log('='.repeat(70));
console.log('🎯 Issue: Admin products saved to general products table');
console.log('✅ Solution: Route to specific bot tables based on displayPages');
console.log('='.repeat(70));

// Define page to table mapping
const PAGE_TO_TABLE_MAPPING = {
  'prime-picks': 'amazon_products',
  'cue-picks': 'cuelinks_products',
  'value-picks': 'value_picks_products',
  'travel-picks': 'travel_products',
  'click-picks': 'click_picks_products',
  'global-picks': 'global_picks_products',
  'deals-hub': 'deals_hub_products',
  'loot-box': 'lootbox_products',
  'lootbox': 'lootbox_products'
};

console.log('\n📋 Page to Table Mapping:');
Object.entries(PAGE_TO_TABLE_MAPPING).forEach(([page, table]) => {
  console.log(`   ${page} → ${table}`);
});

try {
  const routesFile = path.join(__dirname, 'server', 'routes.ts');
  
  if (!fs.existsSync(routesFile)) {
    console.log('❌ routes.ts file not found');
    process.exit(1);
  }
  
  let routesContent = fs.readFileSync(routesFile, 'utf8');
  
  // Find the admin product creation endpoint
  const adminProductEndpointRegex = /app\.post\('\/api\/admin\/products'[\s\S]*?(?=\n\s*app\.|\n\s*\/\/|$)/;
  const match = routesContent.match(adminProductEndpointRegex);
  
  if (!match) {
    console.log('❌ Admin product endpoint not found in routes.ts');
    process.exit(1);
  }
  
  console.log('\n✅ Found admin product endpoint');
  console.log('🔧 Creating enhanced endpoint with bot table routing...');
  
  // Create the enhanced endpoint
  const enhancedEndpoint = `app.post('/api/admin/products', async (req, res) => {
    try {
      const { password, ...productData } = req.body;
      
      console.log('🔍 Admin Product Creation Request:', {
        displayPages: productData.displayPages,
        name: productData.name?.substring(0, 50) + '...'
      });
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Auto-category creation logic
      let finalCategory = productData.category;
      
      if (!finalCategory || finalCategory.trim() === '') {
        finalCategory = detectProductCategory(productData.name || '', productData.description || '');
        console.log('🤖 Auto-detected category:', finalCategory);
      }
      
      ensureCategoryExists(finalCategory, productData.name || '', productData.description || '');

      // Handle customFields
      let customFieldsJson = null;
      if (productData.customFields && typeof productData.customFields === 'object') {
        customFieldsJson = JSON.stringify(productData.customFields);
      }

      // Enhanced product data
      const enhancedProductData = {
        ...productData,
        category: finalCategory,
        customFields: customFieldsJson,
        isFeatured: productData.isFeatured !== undefined ? productData.isFeatured : true,
        isApproved: productData.isApproved !== undefined ? productData.isApproved : true,
        status: productData.status || 'active',
        createdAt: new Date(),
      };

      console.log('📊 Enhanced product data prepared');
      
      // 🚀 NEW: Route to specific bot tables based on displayPages
      const displayPages = productData.displayPages || ['home'];
      const savedProducts = [];
      
      console.log('🎯 Routing to bot tables for pages:', displayPages);
      
      for (const page of displayPages) {
        const targetTable = PAGE_TO_TABLE_MAPPING[page];
        
        if (targetTable) {
          console.log(\`📦 Saving to bot table: \${page} → \${targetTable}\`);
          
          try {
            // Save to specific bot table using direct SQL
            const Database = require('better-sqlite3');
            const sqliteDb = new Database('./database.sqlite');
            
            // Prepare data for bot table (convert to bot table format)
            const botProductData = {
              name: enhancedProductData.name,
              description: enhancedProductData.description,
              price: typeof enhancedProductData.price === 'string' ? 
                     parseFloat(enhancedProductData.price.replace(/[^\d.-]/g, '')) : 
                     enhancedProductData.price,
              original_price: enhancedProductData.originalPrice ? 
                            (typeof enhancedProductData.originalPrice === 'string' ? 
                             parseFloat(enhancedProductData.originalPrice.replace(/[^\d.-]/g, '')) : 
                             enhancedProductData.originalPrice) : null,
              currency: enhancedProductData.currency || 'INR',
              image_url: enhancedProductData.imageUrl,
              affiliate_url: enhancedProductData.affiliateUrl,
              original_url: enhancedProductData.affiliateUrl, // Use affiliate URL as original for admin products
              category: enhancedProductData.category,
              rating: typeof enhancedProductData.rating === 'string' ? 
                     parseFloat(enhancedProductData.rating) : 
                     (enhancedProductData.rating || 4.0),
              review_count: typeof enhancedProductData.reviewCount === 'string' ? 
                          parseInt(enhancedProductData.reviewCount) : 
                          (enhancedProductData.reviewCount || 100),
              discount: enhancedProductData.discount ? 
                       (typeof enhancedProductData.discount === 'string' ? 
                        parseFloat(enhancedProductData.discount) : 
                        enhancedProductData.discount) : null,
              is_featured: enhancedProductData.isFeatured ? 1 : 0,
              is_new: enhancedProductData.isNew ? 1 : 0,
              affiliate_network: getAffiliateNetworkForPage(page),
              processing_status: 'active',
              source: 'admin',
              content_type: page,
              created_at: Math.floor(Date.now() / 1000),
              expires_at: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000) // 30 days
            };
            
            // Build dynamic INSERT query based on table
            const columns = Object.keys(botProductData).join(', ');
            const placeholders = Object.keys(botProductData).map(() => '?').join(', ');
            const values = Object.values(botProductData);
            
            const insertQuery = \`INSERT INTO \${targetTable} (\${columns}) VALUES (\${placeholders})\`;
            const stmt = sqliteDb.prepare(insertQuery);
            const result = stmt.run(...values);
            
            sqliteDb.close();
            
            console.log(\`✅ Saved to \${targetTable} with ID: \${result.lastInsertRowid}\`);
            
            savedProducts.push({
              id: result.lastInsertRowid,
              table: targetTable,
              page: page,
              name: botProductData.name
            });
            
          } catch (error) {
            console.error(\`❌ Failed to save to \${targetTable}:\`, error.message);
          }
          
        } else if (page === 'home' || !PAGE_TO_TABLE_MAPPING[page]) {
          // Save to general products table for home page or unmapped pages
          console.log(\`🏠 Saving to general products table for page: \${page}\`);
          
          try {
            const product = await storage.addProduct(enhancedProductData);
            savedProducts.push({
              id: product.id,
              table: 'products',
              page: page,
              name: product.name
            });
            console.log(\`✅ Saved to products table with ID: \${product.id}\`);
          } catch (error) {
            console.error('❌ Failed to save to products table:', error.message);
          }
        }
      }
      
      // If product is featured, also add to featured_products table
      if (enhancedProductData.isFeatured && savedProducts.length > 0) {
        try {
          console.log('⭐ Adding to featured_products table');
          await db.insert(featuredProducts).values({
            name: enhancedProductData.name,
            description: enhancedProductData.description,
            price: enhancedProductData.price?.toString(),
            originalPrice: enhancedProductData.originalPrice?.toString(),
            currency: enhancedProductData.currency,
            imageUrl: enhancedProductData.imageUrl,
            affiliateUrl: enhancedProductData.affiliateUrl,
            category: enhancedProductData.category,
            rating: enhancedProductData.rating || 4.0,
            reviewCount: enhancedProductData.reviewCount || 100,
            discount: enhancedProductData.discount,
            isFeatured: true,
            displayPages: JSON.stringify(displayPages),
            createdAt: new Date()
          });
          console.log('✅ Added to featured_products table');
        } catch (error) {
          console.error('❌ Failed to add to featured_products:', error.message);
        }
      }
      
      console.log('\n🎊 ADMIN PRODUCT ROUTING COMPLETE!');
      console.log('📊 Summary:', {
        totalSaved: savedProducts.length,
        tables: savedProducts.map(p => p.table),
        pages: displayPages
      });
      
      // Return success response
      res.json({
        success: true,
        message: \`Product saved to \${savedProducts.length} table(s)\`,
        products: savedProducts,
        displayPages: displayPages
      });
      
    } catch (error) {
      console.error('❌ Admin product creation failed:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to create product',
        error: error.message 
      });
    }
  });
  
  // Helper function to get affiliate network for page
  function getAffiliateNetworkForPage(page) {
    const networkMap = {
      'prime-picks': 'amazon',
      'cue-picks': 'cuelinks',
      'value-picks': 'earnkaro',
      'travel-picks': 'travel',
      'click-picks': 'cuelinks',
      'global-picks': 'global',
      'deals-hub': 'inrdeals',
      'loot-box': 'deodap',
      'lootbox': 'deodap'
    };
    return networkMap[page] || 'general';
  }`;
  
  // Replace the existing endpoint
  const updatedContent = routesContent.replace(adminProductEndpointRegex, enhancedEndpoint);
  
  // Write the updated content back
  fs.writeFileSync(routesFile, updatedContent, 'utf8');
  
  console.log('\n✅ ADMIN PRODUCT ROUTING FIX APPLIED!');
  console.log('='.repeat(50));
  console.log('🎯 Changes made:');
  console.log('   ✅ Modified POST /api/admin/products endpoint');
  console.log('   ✅ Added page-to-table routing logic');
  console.log('   ✅ Products now save to correct bot tables');
  console.log('   ✅ Multiple displayPages supported');
  console.log('   ✅ Proper data format conversion');
  console.log('   ✅ Error handling for each table');
  
  console.log('\n📋 How it works now:');
  console.log('   1. Admin selects displayPages in product form');
  console.log('   2. System routes product to corresponding bot tables');
  console.log('   3. Bot page APIs will now find admin products');
  console.log('   4. Frontend pages display both bot and admin products');
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Restart the server to apply changes');
  console.log('   2. Test admin product creation');
  console.log('   3. Verify products appear on selected bot pages');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
}

// Helper function to get affiliate network for page
function getAffiliateNetworkForPage(page) {
  const networkMap = {
    'prime-picks': 'amazon',
    'cue-picks': 'cuelinks',
    'value-picks': 'earnkaro',
    'travel-picks': 'travel',
    'click-picks': 'cuelinks',
    'global-picks': 'global',
    'deals-hub': 'inrdeals',
    'loot-box': 'deodap',
    'lootbox': 'deodap'
  };
  return networkMap[page] || 'general';
}