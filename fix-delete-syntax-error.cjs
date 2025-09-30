/**
 * Fix Delete Syntax Error and Implement Proper Composite ID Handling
 * This script fixes the syntax error and properly implements composite ID handling
 */

const fs = require('fs');
const path = require('path');

class DeleteSyntaxFixer {
  constructor() {
    this.routesFile = path.join(__dirname, 'server', 'routes.ts');
    this.backupFile = path.join(__dirname, 'server', 'routes.ts.backup');
  }

  /**
   * Create backup of current routes file
   */
  createBackup() {
    try {
      const content = fs.readFileSync(this.routesFile, 'utf8');
      fs.writeFileSync(this.backupFile, content, 'utf8');
      console.log('✅ Created backup: routes.ts.backup');
      return true;
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Restore from backup if needed
   */
  restoreFromBackup() {
    try {
      if (fs.existsSync(this.backupFile)) {
        const content = fs.readFileSync(this.backupFile, 'utf8');
        fs.writeFileSync(this.routesFile, content, 'utf8');
        console.log('✅ Restored from backup');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * Fix the delete endpoint with proper composite ID handling
   */
  fixDeleteEndpoint() {
    try {
      let content = fs.readFileSync(this.routesFile, 'utf8');
      
      // Find the existing delete endpoint and replace it with a working version
      const deletePattern = /app\.delete\('\/api\/admin\/products\/:id'[\s\S]*?\}\);(?=\s*\/\/|\s*app\.|\s*$)/;
      
      const newDeleteEndpoint = `app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const productId = req.params.id;
      console.log(\`🗑️ Delete request for product ID: \${productId}\`);
      
      let deleted = false;
      
      // Handle composite IDs for different bot pages
      if (productId.includes('_')) {
        console.log(\`📝 Processing composite ID: \${productId}\`);
        
        let tableName = '';
        let numericId = null;
        
        // Parse different ID formats
        if (productId.startsWith('click_picks_')) {
          const match = productId.match(/click_picks_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'click_picks_products';
          }
        } else if (productId.startsWith('global_picks_')) {
          const match = productId.match(/global_picks_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'global_picks_products';
          }
        } else if (productId.startsWith('dealshub_') || productId.startsWith('deals_hub_')) {
          const match = productId.match(/deals?_?hub_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'dealshub_products';
          }
        } else if (productId.startsWith('loot_box_') || productId.startsWith('lootbox_')) {
          const match = productId.match(/loot_?box_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'loot_box_products';
          }
        } else if (productId.startsWith('travel_picks_')) {
          const match = productId.match(/travel_picks_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'travel_deals';
          }
        } else if (productId.startsWith('cuelinks_') || productId.startsWith('cue_picks_')) {
          const match = productId.match(/cue(?:links|_picks)_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'cuelinks_products';
          }
        } else if (productId.startsWith('value_picks_')) {
          const match = productId.match(/value_picks_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'value_picks_products';
          }
        } else if (productId.startsWith('prime_picks_') || productId.startsWith('amazon_')) {
          const match = productId.match(/(?:prime_picks|amazon)_(\\d+)$/);
          if (match) {
            numericId = parseInt(match[1]);
            tableName = 'amazon_products';
          }
        }
        
        // Execute delete if we have valid table and ID
        if (tableName && numericId) {
          try {
            console.log(\`🗑️ Deleting from \${tableName}, ID: \${numericId}\`);
            const deleteQuery = sqliteDb.prepare(\`DELETE FROM \${tableName} WHERE id = ?\`);
            const result = deleteQuery.run(numericId);
            deleted = result.changes > 0;
            
            if (deleted) {
              console.log(\`✅ Successfully deleted from \${tableName}\`);
              
              // Clean up category associations
              try {
                const categoryCleanup = sqliteDb.prepare(\`
                  DELETE FROM category_products 
                  WHERE product_id = ? AND product_table = ?
                \`);
                categoryCleanup.run(numericId.toString(), tableName);
              } catch (categoryError) {
                console.log(\`⚠️ Category cleanup warning: \${categoryError.message}\`);
              }
            }
          } catch (dbError) {
            console.error(\`❌ Database error: \${dbError.message}\`);
          }
        }
      } else {
        // Handle simple numeric IDs
        const id = parseInt(productId);
        if (!isNaN(id)) {
          deleted = await storage.deleteProduct(id);
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
  })`;
      
      // Replace the delete endpoint
      const updatedContent = content.replace(deletePattern, newDeleteEndpoint);
      
      // Write back to file
      fs.writeFileSync(this.routesFile, updatedContent, 'utf8');
      
      console.log('✅ Successfully fixed delete endpoint');
      return true;
      
    } catch (error) {
      console.error('❌ Error fixing delete endpoint:', error);
      return false;
    }
  }

  /**
   * Run the complete fix
   */
  async run() {
    console.log('🚀 Starting delete syntax fix...');
    
    // Create backup first
    if (!this.createBackup()) {
      console.log('❌ Cannot proceed without backup');
      return;
    }
    
    // Try to fix the delete endpoint
    const success = this.fixDeleteEndpoint();
    
    if (success) {
      console.log('\n🎉 Delete syntax fix completed successfully!');
      console.log('✅ Delete buttons should now work for all bot pages');
      console.log('🔄 Please restart your development server');
    } else {
      console.log('\n❌ Fix failed, restoring from backup...');
      this.restoreFromBackup();
    }
  }
}

// Run the fix
const fixer = new DeleteSyntaxFixer();
fixer.run().catch(console.error);