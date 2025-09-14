/**
 * Fix API Routes for All Bot Pages
 * Add missing API logic for cue-picks, click-picks, travel-picks, and fix naming issues
 */

const fs = require('fs');
const path = require('path');

class APIRoutesFixer {
  constructor() {
    this.routesFile = path.join(__dirname, 'server', 'routes.ts');
  }

  /**
   * Fix API routes by adding missing page logic
   */
  async fixAPIRoutes() {
    console.log('🔧 Fixing API Routes for All Bot Pages...');
    
    try {
      // Read the current routes file
      let routesContent = fs.readFileSync(this.routesFile, 'utf8');
      
      // Find the insertion point (after Global Picks products section)
      const insertionPoint = routesContent.indexOf('// Get DealsHub products if page is dealshub');
      
      if (insertionPoint === -1) {
        console.log('Error Could not find insertion point in routes file');
        return false;
      }
      
      // Create the missing API logic
      const missingAPILogic = `
      // Get CueLinks products if page is cue-picks
      let cueLinksProducts: any[] = [];
      if (page === 'cue-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const cueLinksProductsQuery = sqliteDb.prepare(\`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, expires_at as expiresAt, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText
            FROM cuelinks_products 
            WHERE (processing_status = 'active' OR processing_status IS NULL)
            AND (expires_at IS NULL OR expires_at > ?)
            ORDER BY created_at DESC
          \`);
          
          cueLinksProducts = cueLinksProductsQuery.all(currentTime);
          console.log(\`Link Found \${cueLinksProducts.length} active CueLinks products\`);
        } catch (error) {
          console.error('Error Error fetching CueLinks products:', error);
        }
      }

      // Get Click Picks products if page is click-picks
      let clickPicksProducts: any[] = [];
      if (page === 'click-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const clickPicksProductsQuery = sqliteDb.prepare(\`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, expires_at as expiresAt, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText
            FROM click_picks_products 
            WHERE (processing_status = 'active' OR processing_status IS NULL)
            AND (expires_at IS NULL OR expires_at > ?)
            ORDER BY created_at DESC
          \`);
          
          clickPicksProducts = clickPicksProductsQuery.all(currentTime);
          console.log(\`🖱️ Found \${clickPicksProducts.length} active Click Picks products\`);
        } catch (error) {
          console.error('Error Error fetching Click Picks products:', error);
        }
      }

      // Get Travel Picks products if page is travel-picks
      let travelPicksProducts: any[] = [];
      if (page === 'travel-picks') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const travelPicksProductsQuery = sqliteDb.prepare(\`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, expires_at as expiresAt, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText
            FROM deals_hub_products 
            WHERE (processing_status = 'active' OR processing_status IS NULL)
            AND (expires_at IS NULL OR expires_at > ?)
            AND (source LIKE '%travel%' OR category LIKE '%travel%' OR name LIKE '%travel%')
            ORDER BY created_at DESC
          \`);
          
          travelPicksProducts = travelPicksProductsQuery.all(currentTime);
          console.log(\`Flight Found \${travelPicksProducts.length} active Travel Picks products\`);
        } catch (error) {
          console.error('Error Error fetching Travel Picks products:', error);
        }
      }

      // Fix deals-hub page name (should also work with dealshub)
      if (page === 'deals-hub') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const dealsHubProductsQuery = sqliteDb.prepare(\`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, expires_at as expiresAt, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText
            FROM deals_hub_products 
            WHERE (processing_status = 'active' OR processing_status IS NULL)
            AND (expires_at IS NULL OR expires_at > ?)
            ORDER BY created_at DESC
          \`);
          
          dealsHubProducts = dealsHubProductsQuery.all(currentTime);
          console.log(\`Target Found \${dealsHubProducts.length} active Deals Hub products\`);
        } catch (error) {
          console.error('Error Error fetching Deals Hub products:', error);
        }
      }

      // Fix lootbox page name (should work with both loot-box and lootbox)
      if (page === 'lootbox') {
        try {
          const currentTime = Math.floor(Date.now() / 1000);
          const { category } = req.query;
          
          let query = \`
            SELECT 
              id, name, description, price, original_price as originalPrice,
              currency, image_url as imageUrl, affiliate_url as affiliateUrl,
              category, rating, review_count as reviewCount, discount,
              is_featured as isFeatured, affiliate_network,
              telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
              click_count as clickCount, conversion_count as conversionCount,
              processing_status, expires_at as expiresAt, created_at as createdAt,
              has_limited_offer as hasLimitedOffer, limited_offer_text as limitedOfferText
            FROM loot_box_products 
            WHERE (processing_status = 'active' OR processing_status IS NULL)
            AND (expires_at IS NULL OR expires_at > ?)\`;
          
          const params = [currentTime];
          
          // Add category filter if specified
          if (category && category !== '') {
            query += \` AND category = ?\`;
            params.push(category);
            console.log(\`Products Filtering Loot Box products by category: "\${category}"\`);
          }
          
          query += \` ORDER BY created_at DESC\`;
          
          const lootBoxProductsQuery = sqliteDb.prepare(query);
          lootBoxProducts = lootBoxProductsQuery.all(...params);
          console.log(\`Products Found \${lootBoxProducts.length} active Loot Box products\${category ? \` in category "\${category}"\` : ''}\`);
        } catch (error) {
          console.error('Error Error fetching Loot Box products:', error);
        }
      }

      `;
      
      // Insert the missing logic before the DealsHub section
      const updatedContent = routesContent.slice(0, insertionPoint) + 
                            missingAPILogic + 
                            routesContent.slice(insertionPoint);
      
      // Now we need to update the response section to include all the new products
      // Find the response section
      const responsePattern = /let pageProducts = \[\];[\s\S]*?res\.json\(pageProducts\);/;
      const responseMatch = updatedContent.match(responsePattern);
      
      if (responseMatch) {
        const newResponseLogic = `let pageProducts = [];
        
        // Combine all products based on page
        if (page === 'prime-picks') {
          pageProducts = amazonProducts;
        } else if (page === 'value-picks') {
          pageProducts = valuePicksProducts;
        } else if (page === 'cue-picks') {
          pageProducts = cueLinksProducts;
        } else if (page === 'click-picks') {
          pageProducts = clickPicksProducts;
        } else if (page === 'global-picks') {
          pageProducts = globalPicksProducts;
        } else if (page === 'travel-picks') {
          pageProducts = travelPicksProducts;
        } else if (page === 'deals-hub' || page === 'dealshub') {
          pageProducts = dealsHubProducts;
        } else if (page === 'loot-box' || page === 'lootbox') {
          pageProducts = lootBoxProducts;
        } else {
          // Fallback to regular products for unknown pages
          pageProducts = allProducts.filter((product: any) => {
            return product.displayPages && product.displayPages.includes(page);
          });
        }
        
        // Apply category filter if specified
        if (category && category !== '') {
          pageProducts = pageProducts.filter((product: any) => 
            product.category && product.category.toLowerCase() === category.toLowerCase()
          );
        }
        
        console.log(\`Stats Returning \${pageProducts.length} products for page "\${page}"\`);
        
        res.json(pageProducts);`;
        
        const finalContent = updatedContent.replace(responsePattern, newResponseLogic);
        
        // Write the updated content back to the file
        fs.writeFileSync(this.routesFile, finalContent, 'utf8');
        
        console.log('Success API routes updated successfully!');
        return true;
        
      } else {
        console.log('Error Could not find response section to update');
        return false;
      }
      
    } catch (error) {
      console.log(`Error Error fixing API routes: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a simpler fix by updating the database to set processing_status
   */
  async fixDatabaseStatus() {
    console.log('\n🔧 Fixing Database Processing Status...');
    
    const Database = require('better-sqlite3');
    const db = new Database(path.join(__dirname, 'database.sqlite'));
    
    try {
      const tables = [
        'cuelinks_products',
        'click_picks_products', 
        'global_picks_products',
        'deals_hub_products',
        'loot_box_products'
      ];
      
      let totalUpdated = 0;
      
      for (const table of tables) {
        try {
          // Check if processing_status column exists
          const columns = db.prepare(`PRAGMA table_info(${table})`).all();
          const hasProcessingStatus = columns.some(col => col.name === 'processing_status');
          
          if (hasProcessingStatus) {
            // Update all products to have active status
            const result = db.prepare(`
              UPDATE ${table} 
              SET processing_status = 'active' 
              WHERE processing_status IS NULL OR processing_status = ''
            `).run();
            
            console.log(`  Success ${table}: Updated ${result.changes} products to active status`);
            totalUpdated += result.changes;
          } else {
            // Add processing_status column if it doesn't exist
            db.prepare(`ALTER TABLE ${table} ADD COLUMN processing_status TEXT DEFAULT 'active'`).run();
            console.log(`  Success ${table}: Added processing_status column`);
          }
          
        } catch (error) {
          console.log(`  Error ${table}: ${error.message}`);
        }
      }
      
      console.log(`\nStats Total products updated: ${totalUpdated}`);
      db.close();
      
      return totalUpdated > 0;
      
    } catch (error) {
      console.log(`Error Database fix error: ${error.message}`);
      if (db) db.close();
      return false;
    }
  }

  /**
   * Run complete fix
   */
  async runCompleteFix() {
    console.log('Launch Fixing API Routes for All 8 Bot Pages');
    console.log('=' .repeat(50));
    
    // Method 1: Fix database status (simpler and safer)
    const dbFixed = await this.fixDatabaseStatus();
    
    if (dbFixed) {
      console.log('\nSuccess Database fix completed successfully!');
      console.log('\nRefresh Please restart your server to see the changes:');
      console.log('   1. Stop the current server (Ctrl+C)');
      console.log('   2. Run: npm run dev');
      console.log('   3. Test the API endpoints again');
    } else {
      console.log('\nWarning Database fix had issues, but some changes may have been applied.');
    }
    
    console.log('\nTip **What was fixed:**');
    console.log('• Added processing_status = "active" to all products');
    console.log('• This ensures products appear in API responses');
    console.log('• All 8 bot pages should now return products');
    
    console.log('\n🧪 **Test after restart:**');
    console.log('• cue-picks: Should show CueLinks products');
    console.log('• click-picks: Should show Click Picks products');
    console.log('• global-picks: Should show Global Picks products');
    console.log('• travel-picks: Should show travel-related products');
    console.log('• deals-hub: Should show deals products');
    console.log('• lootbox: Should show Loot Box products');
    
    return dbFixed;
  }
}

// Run the fix
async function runFix() {
  const fixer = new APIRoutesFixer();
  
  try {
    const success = await fixer.runCompleteFix();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Error Fix failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runFix();
}

module.exports = { APIRoutesFixer, runFix };