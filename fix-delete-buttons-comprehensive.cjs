/**
 * Fix Delete Buttons for All Bot Pages
 * This script fixes the DELETE endpoint to handle composite IDs like 'click_picks_123', 'global_picks_456', etc.
 */

const fs = require('fs');
const path = require('path');

class DeleteButtonsFixer {
  constructor() {
    this.routesFile = path.join(__dirname, 'server', 'routes.ts');
  }

  /**
   * Fix the DELETE endpoint to handle composite IDs
   */
  async fixDeleteEndpoint() {
    console.log('🔧 Fixing DELETE endpoint for composite IDs...');
    
    try {
      let routesContent = fs.readFileSync(this.routesFile, 'utf8');
      
      // Find the current DELETE endpoint
      const deleteEndpointPattern = /app\.delete\('\/api\/admin\/products\/:id'[\s\S]*?\}\);/;
      const deleteMatch = routesContent.match(deleteEndpointPattern);
      
      if (!deleteMatch) {
        console.log('❌ Could not find DELETE endpoint in routes.ts');
        return false;
      }
      
      console.log('✅ Found existing DELETE endpoint');
      
      // Create the new comprehensive DELETE endpoint
      const newDeleteEndpoint = `app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const productId = req.params.id;
      console.log(\`🗑️ Delete request for product ID: \${productId}\`);
      
      let deleted = false;
      let tableName = '';
      let numericId = null;
      
      // Handle composite IDs (e.g., 'click_picks_123', 'global_picks_456')
      if (productId.includes('_')) {
        console.log(\`📝 Processing composite ID: \${productId}\`);
        
        // Extract table type and numeric ID
        if (productId.startsWith('click_picks_')) {
          const match = productId.match(/click_picks_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'click_picks_products';
            console.log(\`🖱️ Click Picks product - ID: \${numericId}\`);
          }
        } else if (productId.startsWith('global_picks_')) {
          const match = productId.match(/global_picks_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'global_picks_products';
            console.log(\`🌍 Global Picks product - ID: \${numericId}\`);
          }
        } else if (productId.startsWith('dealshub_') || productId.startsWith('deals_hub_')) {
          const match = productId.match(/deals?_?hub_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'dealshub_products';
            console.log(\`🛒 DealsHub product - ID: \${numericId}\`);
          }
        } else if (productId.startsWith('loot_box_') || productId.startsWith('lootbox_')) {
          const match = productId.match(/loot_?box_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'loot_box_products';
            console.log(\`🎁 Loot Box product - ID: \${numericId}\`);
          }
        } else if (productId.startsWith('travel_picks_')) {
          const match = productId.match(/travel_picks_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'travel_deals'; // Travel picks uses travel_deals table
            console.log(\`✈️ Travel Picks product - ID: \${numericId}\`);
          }
        } else if (productId.startsWith('cuelinks_') || productId.startsWith('cue_picks_')) {
          const match = productId.match(/cue(?:links|_picks)_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'cuelinks_products';
            console.log(\`🔗 CueLinks product - ID: \${numericId}\`);
          }
        } else if (productId.startsWith('value_picks_')) {
          const match = productId.match(/value_picks_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'value_picks_products';
            console.log(\`💎 Value Picks product - ID: \${numericId}\`);
          }
        } else if (productId.startsWith('prime_picks_') || productId.startsWith('amazon_')) {
          const match = productId.match(/(?:prime_picks|amazon)_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'amazon_products';
            console.log(\`📦 Prime Picks/Amazon product - ID: \${numericId}\`);
          }
        }
        
        // Delete from specific table
        if (tableName && numericId) {
          try {
            console.log(\`🗑️ Deleting from table: \${tableName}, ID: \${numericId}\`);
            
            const deleteQuery = sqliteDb.prepare(\`DELETE FROM \${tableName} WHERE id = ?\`);
            const result = deleteQuery.run(numericId);
            
            if (result.changes > 0) {
              deleted = true;
              console.log(\`✅ Successfully deleted product from \${tableName}\`);
              
              // Also remove from category associations
              try {
                const categoryCleanup = sqliteDb.prepare(\`
                  DELETE FROM category_products 
                  WHERE product_id = ? AND product_table = ?
                \`);
                categoryCleanup.run(numericId.toString(), tableName);
                console.log(\`🧹 Cleaned up category associations\`);
              } catch (categoryError) {
                console.log(\`⚠️ Category cleanup failed (non-critical): \${categoryError.message}\`);
              }
            } else {
              console.log(\`❌ No product found in \${tableName} with ID \${numericId}\`);
            }
          } catch (dbError) {
            console.error(\`❌ Database error deleting from \${tableName}:\`, dbError);
          }
        } else {
          console.log(\`❌ Could not parse composite ID: \${productId}\`);
        }
      } else {
        // Handle simple numeric IDs (fallback to storage.deleteProduct)
        console.log(\`📝 Processing simple numeric ID: \${productId}\`);
        const id = parseInt(productId);
        if (!isNaN(id)) {
          deleted = await storage.deleteProduct(id);
          console.log(\`\${deleted ? '✅' : '❌'} Storage delete result: \${deleted}\`);
        } else {
          console.log(\`❌ Invalid ID format: \${productId}\`);
        }
      }
      
      if (deleted) {
        res.json({ message: 'Product deleted successfully' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('❌ Delete product error:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });`;
      
      // Replace the old DELETE endpoint with the new one
      const updatedContent = routesContent.replace(deleteEndpointPattern, newDeleteEndpoint);
      
      // Write the updated content back to the file
      fs.writeFileSync(this.routesFile, updatedContent, 'utf8');
      
      console.log('✅ Successfully updated DELETE endpoint in routes.ts');
      console.log('🎯 The endpoint now handles:');
      console.log('   - click_picks_123 → click_picks_products table');
      console.log('   - global_picks_456 → global_picks_products table');
      console.log('   - dealshub_789 → dealshub_products table');
      console.log('   - loot_box_101 → loot_box_products table');
      console.log('   - travel_picks_202 → travel_deals table');
      console.log('   - cuelinks_303 → cuelinks_products table');
      console.log('   - value_picks_404 → value_picks_products table');
      console.log('   - prime_picks_505 → amazon_products table');
      console.log('   - Simple numeric IDs → storage.deleteProduct()');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error fixing DELETE endpoint:', error);
      return false;
    }
  }

  /**
   * Run the complete fix
   */
  async run() {
    console.log('🚀 Starting comprehensive delete buttons fix...');
    console.log('📋 This will fix delete functionality for:');
    console.log('   - Click Picks');
    console.log('   - Global Picks');
    console.log('   - Travel Picks');
    console.log('   - DealsHub');
    console.log('   - Loot Box');
    console.log('   - CueLinks');
    console.log('   - Value Picks');
    console.log('   - Prime Picks/Amazon');
    console.log('');
    
    const success = await this.fixDeleteEndpoint();
    
    if (success) {
      console.log('\n🎉 Delete buttons fix completed successfully!');
      console.log('✅ All bot pages should now have working delete buttons');
      console.log('🔄 Please restart your development server to apply changes');
    } else {
      console.log('\n❌ Delete buttons fix failed');
      console.log('🔍 Please check the error messages above');
    }
  }
}

// Run the fix
const fixer = new DeleteButtonsFixer();
fixer.run().catch(console.error);