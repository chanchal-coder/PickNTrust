/**
 * Migrate Canva Database Columns
 * Adds missing columns to existing Canva tables
 */

const Database = require('better-sqlite3');
const path = require('path');

function migrateCanvaColumns() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  try {
    console.log('Refresh Migrating Canva database columns...');
    
    // Check current structure
    const columns = db.prepare(`PRAGMA table_info(canva_settings)`).all();
    const columnNames = columns.map(c => c.name);
    console.log('📋 Current columns:', columnNames.join(', '));
    
    // Add missing columns to canva_settings
    const columnsToAdd = [
      { name: 'default_caption', type: 'TEXT' },
      { name: 'default_hashtags', type: 'TEXT' },
      { name: 'enable_blog_posts', type: 'INTEGER', default: '1' },
      { name: 'enable_videos', type: 'INTEGER', default: '1' }
    ];
    
    console.log('\n🔧 Adding missing columns...');
    
    columnsToAdd.forEach(column => {
      if (!columnNames.includes(column.name)) {
        const sql = `ALTER TABLE canva_settings ADD COLUMN ${column.name} ${column.type}${column.default ? ` DEFAULT ${column.default}` : ''}`;
        console.log(`   Adding: ${column.name}`);
        db.exec(sql);
      } else {
        console.log(`   Success ${column.name} already exists`);
      }
    });
    
    // Verify the changes
    console.log('\nSuccess Verifying changes...');
    const updatedColumns = db.prepare(`PRAGMA table_info(canva_settings)`).all();
    const updatedColumnNames = updatedColumns.map(c => c.name);
    console.log('📋 Updated columns:', updatedColumnNames.join(', '));
    
    // Update existing settings with default values if they don't exist
    console.log('\nRefresh Updating existing settings...');
    const existingSettings = db.prepare('SELECT * FROM canva_settings LIMIT 1').get();
    
    if (existingSettings) {
      const updateSql = `
        UPDATE canva_settings 
        SET 
          default_caption = COALESCE(default_caption, 'Check out this amazing find! Hot'),
          default_hashtags = COALESCE(default_hashtags, '#amazing #deals #shopping #affiliate #picktrust'),
          enable_blog_posts = COALESCE(enable_blog_posts, 1),
          enable_videos = COALESCE(enable_videos, 1),
          updated_at = strftime('%s', 'now')
        WHERE id = ?
      `;
      
      db.prepare(updateSql).run(existingSettings.id);
      console.log('Success Updated existing settings with default values');
    } else {
      // Insert default settings if none exist
      const insertSql = `
        INSERT INTO canva_settings (
          is_enabled,
          auto_generate_captions,
          auto_generate_hashtags,
          default_caption,
          default_hashtags,
          platforms,
          schedule_type,
          schedule_delay_minutes,
          enable_blog_posts,
          enable_videos
        ) VALUES (
          0,
          1,
          1,
          'Check out this amazing find! Hot',
          '#amazing #deals #shopping #affiliate #picktrust',
          '["instagram", "facebook"]',
          'immediate',
          0,
          1,
          1
        )
      `;
      
      db.exec(insertSql);
      console.log('Success Inserted default settings');
    }
    
    // Final verification
    console.log('\nTarget Final verification...');
    const finalSettings = db.prepare('SELECT * FROM canva_settings LIMIT 1').get();
    if (finalSettings) {
      console.log('Success Settings record found:');
      console.log('   - ID:', finalSettings.id);
      console.log('   - Enabled:', finalSettings.is_enabled ? 'Yes' : 'No');
      console.log('   - Default Caption:', finalSettings.default_caption || 'Not set');
      console.log('   - Default Hashtags:', finalSettings.default_hashtags || 'Not set');
      console.log('   - Platforms:', finalSettings.platforms);
    }
    
    // Check template tables
    const platformTemplateCount = db.prepare('SELECT COUNT(*) as count FROM canva_platform_templates').get();
    const extraTemplateCount = db.prepare('SELECT COUNT(*) as count FROM canva_extra_templates').get();
    
    console.log('\nStats Template counts:');
    console.log('   - Platform templates:', platformTemplateCount.count);
    console.log('   - Extra templates:', extraTemplateCount.count);
    
    console.log('\nCelebration Migration completed successfully!');
    
  } catch (error) {
    console.error('Error Migration failed:', error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  migrateCanvaColumns();
}

module.exports = { migrateCanvaColumns };