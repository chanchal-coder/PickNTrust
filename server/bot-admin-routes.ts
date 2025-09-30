/**
 * Bot Admin Routes - API endpoints for managing single master bot system
 * Provides admin panel functionality for bot management and method selection
 */

import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';

// Type definitions for database query results
interface CommissionRate {
  commission_rate: number;
  min_rate?: number;
  max_rate?: number;
  data_source: string;
  keywords?: string;
  url_patterns?: string;
  priority?: number;
  category?: string;
  maxPriority?: number;
}

interface AffiliateUrl {
  affiliateUrl: string;
  tag: string;
  category?: string;
  commissionRate?: number;
  attempt?: number;
}

interface CategoryKeyword {
  category: string;
  keywords: string;
  url_patterns?: string;
  priority: number;
}

interface MaxPriorityResult {
  maxPriority: number;
}

const router = Router();

// Database connection for affiliate tags
const db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Get all bot statuses - now returns empty/placeholder data since enhanced manager is removed
router.get('/api/admin/bots/status', async (req, res) => {
  try {
    // Return placeholder data since enhanced telegram manager is no longer used
    const botsData = [];
    
    res.json({
      success: true,
      data: {
        bots: botsData,
        totalBots: 0,
        activeBots: 0,
        errorBots: 0,
        healthPercentage: 100,
        isHealthy: true
      }
    });
  } catch (error) {
    console.error('Error getting bot statuses:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get bot statuses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== COMMISSION RATE METHOD MANAGEMENT =====

// Update commission rate method for a bot
router.put('/api/admin/bots/:botName/commission-method', async (req, res) => {
  try {
    const { botName } = req.params;
    const { method } = req.body;
    
    if (!['manual', 'scraping', 'api', 'performance'].includes(method)) {
      return res.status(400).json({ success: false, error: 'Invalid commission rate method' });
    }
    
    // Store the method preference (you might want to add a bot_configurations table)
    // For now, we'll just return success as the method is stored in frontend state
    
    res.json({ success: true, method });
  } catch (error) {
    console.error('Error updating commission rate method:', error);
    res.status(500).json({ success: false, error: 'Failed to update commission rate method' });
  }
});

// Upload CSV commission rates
router.post('/api/admin/bots/commission-rates/upload', async (req, res) => {
  try {
    // This would handle CSV file upload and parsing
    // For now, return a mock response
    const { botName } = req.body;
    
    // In a real implementation, you would:
    // 1. Parse the uploaded CSV file
    // 2. Validate the data format
    // 3. Insert/update commission rates in the database
    // 4. Return the count of processed rates
    
    res.json({ 
      success: true, 
      count: 25, // Mock count
      message: `Commission rates uploaded for ${botName}` 
    });
  } catch (error) {
    console.error('Error uploading commission rates:', error);
    res.status(500).json({ success: false, error: 'Failed to upload commission rates' });
  }
});

// Get commission rates for a specific bot and category
router.get('/api/admin/bots/:botName/commission-rate', async (req, res) => {
  try {
    const { botName } = req.params;
    const { category, network } = req.query;
    
    // Query commission rates based on bot's affiliate network and product category
    const rate = db.prepare(`
      SELECT commission_rate, min_rate, max_rate, data_source
      FROM commission_rates 
      WHERE affiliate_network = ? AND category = ? AND is_active = 1
      ORDER BY 
        CASE data_source 
          WHEN 'api' THEN 1 
          WHEN 'scraped' THEN 2 
          WHEN 'csv' THEN 3 
          WHEN 'manual' THEN 4 
          ELSE 5 
        END
      LIMIT 1
    `).get(network, category) as CommissionRate | undefined;
    
    if (rate) {
      res.json({ success: true, rate: rate.commission_rate, source: rate.data_source });
    } else {
      // Return default rate if no specific rate found
      res.json({ success: true, rate: 4.0, source: 'default' });
    }
  } catch (error) {
    console.error('Error getting commission rate:', error);
    res.status(500).json({ success: false, error: 'Failed to get commission rate' });
  }
});

// Get category for a product URL (smart category detection)
router.post('/api/admin/bots/detect-category', async (req, res) => {
  try {
    const { url, title } = req.body;
    
    // Get category keywords for matching
    const keywords = db.prepare(`
      SELECT category, keywords, url_patterns, priority
      FROM category_keywords 
      WHERE is_active = 1
      ORDER BY priority DESC
    `).all() as CategoryKeyword[];
    
    let detectedCategory = 'General';
    let confidence = 0;
    
    for (const keywordSet of keywords) {
      const keywordList = JSON.parse(keywordSet.keywords);
      const urlPatterns = keywordSet.url_patterns ? JSON.parse(keywordSet.url_patterns) : [];
      
      let matches = 0;
      
      // Check URL patterns
      for (const pattern of urlPatterns) {
        if (url.toLowerCase().includes(pattern.toLowerCase())) {
          matches += 3; // URL patterns have higher weight
        }
      }
      
      // Check title keywords
      if (title) {
        for (const keyword of keywordList) {
          if (title.toLowerCase().includes(keyword.toLowerCase())) {
            matches += 1;
          }
        }
      }
      
      // Check URL keywords
      for (const keyword of keywordList) {
        if (url.toLowerCase().includes(keyword.toLowerCase())) {
          matches += 2;
        }
      }
      
      const currentConfidence = matches * keywordSet.priority;
      if (currentConfidence > confidence) {
        confidence = currentConfidence;
        detectedCategory = keywordSet.category;
      }
    }
    
    res.json({ 
      success: true, 
      category: detectedCategory, 
      confidence: Math.min(confidence / 10, 1) // Normalize to 0-1
    });
  } catch (error) {
    console.error('Error detecting category:', error);
    res.status(500).json({ success: false, error: 'Failed to detect category' });
  }
});

// ===== AFFILIATE TAG MANAGEMENT ROUTES =====

// Get all affiliate tags
router.get('/api/admin/bots/affiliate-tags', async (req, res) => {
  try {
    const tags = db.prepare(`
      SELECT id, bot_name as botName, network_name as networkName, 
             affiliate_tag as affiliateTag, tag_type as tagType, 
             priority, is_active as isActive, commission_rate as commissionRate,
             success_rate as successRate, last_used as lastUsed,
             created_at as createdAt, updated_at as updatedAt
      FROM bot_affiliate_tags 
      ORDER BY bot_name, priority
    `).all();
    
    res.json(tags);
  } catch (error) {
    console.error('Error fetching affiliate tags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch affiliate tags' });
  }
});

// Get affiliate tags for specific bot
router.get('/api/admin/bots/:botName/affiliate-tags', async (req, res) => {
  try {
    const { botName } = req.params;
    const tags = db.prepare(`
      SELECT id, bot_name as botName, network_name as networkName, 
             affiliate_tag as affiliateTag, tag_type as tagType, 
             priority, is_active as isActive, commission_rate as commissionRate,
             success_rate as successRate, last_used as lastUsed,
             created_at as createdAt, updated_at as updatedAt
      FROM bot_affiliate_tags 
      WHERE bot_name = ?
      ORDER BY priority
    `).all(botName);
    
    res.json(tags);
  } catch (error) {
    console.error('Error fetching bot affiliate tags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bot affiliate tags' });
  }
});

// Add new affiliate tag
router.post('/api/admin/bots/affiliate-tags', async (req, res) => {
  try {
    const { botName, networkName, affiliateTag, tagType = 'parameter', commissionRate = 0 } = req.body;
    
    if (!botName || !networkName || !affiliateTag) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    // Get next priority for this bot
    const maxPriority = db.prepare(`
      SELECT COALESCE(MAX(priority), 0) as maxPriority 
      FROM bot_affiliate_tags 
      WHERE bot_name = ?
    `).get(botName) as MaxPriorityResult | undefined;
    
    const nextPriority = (maxPriority?.maxPriority || 0) + 1;
    
    const result = db.prepare(`
      INSERT INTO bot_affiliate_tags (
        bot_name, network_name, affiliate_tag, tag_type, 
        priority, commission_rate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(botName, networkName, affiliateTag, tagType, nextPriority, commissionRate);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding affiliate tag:', error);
    res.status(500).json({ success: false, error: 'Failed to add affiliate tag' });
  }
});

// Update affiliate tag
router.put('/api/admin/bots/affiliate-tags/:tagId', async (req, res) => {
  try {
    const { tagId } = req.params;
    const { networkName, affiliateTag, tagType, priority, isActive, commissionRate } = req.body;
    
    const result = db.prepare(`
      UPDATE bot_affiliate_tags 
      SET network_name = ?, affiliate_tag = ?, tag_type = ?, 
          priority = ?, is_active = ?, commission_rate = ?, 
          updated_at = datetime('now')
      WHERE id = ?
    `).run(networkName, affiliateTag, tagType, priority, isActive ? 1 : 0, commissionRate, tagId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Affiliate tag not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating affiliate tag:', error);
    res.status(500).json({ success: false, error: 'Failed to update affiliate tag' });
  }
});

// Delete affiliate tag
router.delete('/api/admin/bots/affiliate-tags/:tagId', async (req, res) => {
  try {
    const { password } = req.body;
    
    // Verify admin password
    if (!password || password !== 'pickntrust2025') {
      return res.status(401).json({ success: false, error: 'Invalid admin password' });
    }
    
    const { tagId } = req.params;
    
    const result = db.prepare('DELETE FROM bot_affiliate_tags WHERE id = ?').run(tagId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Affiliate tag not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting affiliate tag:', error);
    res.status(500).json({ success: false, error: 'Failed to delete affiliate tag' });
  }
});

// Update tag usage statistics (called by bots when using a tag)
router.post('/api/admin/bots/affiliate-tags/:tagId/usage', async (req, res) => {
  try {
    const { tagId } = req.params;
    const { success = true } = req.body;
    
    // Update last used timestamp
    db.prepare(`
      UPDATE bot_affiliate_tags 
      SET last_used = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(tagId);
    
    // Update success rate (simplified - in production you'd want more sophisticated tracking)
    if (success) {
      db.prepare(`
        UPDATE bot_affiliate_tags 
        SET success_rate = CASE 
          WHEN success_rate IS NULL THEN 100
          ELSE (success_rate * 0.9) + (100 * 0.1)
        END
        WHERE id = ?
      `).run(tagId);
    } else {
      db.prepare(`
        UPDATE bot_affiliate_tags 
        SET success_rate = CASE 
          WHEN success_rate IS NULL THEN 0
          ELSE (success_rate * 0.9) + (0 * 0.1)
        END
        WHERE id = ?
      `).run(tagId);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating tag usage:', error);
    res.status(500).json({ success: false, error: 'Failed to update tag usage' });
  }
});

// Get optimal affiliate tag for a bot (used by bots)
router.get('/api/admin/bots/:botName/optimal-tag', async (req, res) => {
  try {
    const { botName } = req.params;
    const { productType, url } = req.query;
    
    // Get active tags for this bot, ordered by priority and success rate
    const tags = db.prepare(`
      SELECT id, network_name as networkName, affiliate_tag as affiliateTag, 
             tag_type as tagType, commission_rate as commissionRate,
             success_rate as successRate, priority
      FROM bot_affiliate_tags 
      WHERE bot_name = ? AND is_active = 1
      ORDER BY 
        (commission_rate * 0.6 + COALESCE(success_rate, 100) * 0.4) DESC,
        priority ASC
    `).all(botName);
    
    if (tags.length === 0) {
      return res.status(404).json({ success: false, error: 'No active affiliate tags found' });
    }
    
    // Return the best tag (first in sorted list)
    res.json({ success: true, tag: tags[0], alternatives: tags.slice(1) });
  } catch (error) {
    console.error('Error getting optimal tag:', error);
    res.status(500).json({ success: false, error: 'Failed to get optimal tag' });
  }
});

// Enable/disable a bot - placeholder since enhanced manager is removed
router.post('/api/admin/bots/:botName/toggle', async (req, res) => {
  try {
    const { botName } = req.params;
    const { enabled } = req.body;
    
    // Return success response since enhanced telegram manager is no longer used
    res.json({ 
      success: true, 
      message: `Bot ${botName} ${enabled ? 'enabled' : 'disabled'} successfully (placeholder response)` 
    });
  } catch (error) {
    console.error('Error toggling bot:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle bot' });
  }
});

// Restart a bot - placeholder since enhanced manager is removed
router.post('/api/admin/bots/:botName/restart', async (req, res) => {
  try {
    const { botName } = req.params;
    
    // Return success response since enhanced telegram manager is no longer used
    res.json({ 
      success: true, 
      message: `Bot ${botName} restarted successfully (placeholder response)` 
    });
  } catch (error) {
    console.error('Error restarting bot:', error);
    res.status(500).json({ success: false, error: 'Failed to restart bot' });
  }
});

// Update bot method - placeholder since enhanced manager is removed
router.post('/api/admin/bots/:botName/method', async (req, res) => {
  try {
    const { botName } = req.params;
    const { method } = req.body;
    
    if (!['telegram', 'scraping', 'api'].includes(method)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid method. Must be telegram, scraping, or api' 
      });
    }
    
    // Return success response since enhanced telegram manager is no longer used
    res.json({ 
      success: true, 
      message: `Bot ${botName} method updated to ${method} (placeholder response)` 
    });
  } catch (error) {
    console.error('Error updating bot method:', error);
    res.status(500).json({ success: false, error: 'Failed to update bot method' });
  }
});

// Enable API for a bot - placeholder since enhanced manager is removed
router.post('/api/admin/bots/:botName/api', async (req, res) => {
  try {
    const { botName } = req.params;
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'API key is required' 
      });
    }
    
    // Return success response since enhanced telegram manager is no longer used
    res.json({ 
      success: true, 
      message: `API enabled for bot ${botName} (placeholder response)` 
    });
  } catch (error) {
    console.error('Error enabling API for bot:', error);
    res.status(500).json({ success: false, error: 'Failed to enable API' });
  }
});

// Get system health - placeholder since enhanced manager is removed
router.get('/api/admin/health', async (req, res) => {
  try {
    // Return placeholder health status since enhanced telegram manager is no longer used
    res.json({
      success: true,
      data: {
        totalBots: 0,
        activeBots: 0,
        errorBots: 0,
        healthPercentage: 100,
        isHealthy: true
      }
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({ success: false, error: 'Failed to get system health' });
  }
});

// Initialize all bots - placeholder since enhanced manager is removed
router.post('/api/admin/bots/initialize', async (req, res) => {
  try {
    // Return success response since enhanced telegram manager is no longer used
    res.json({ 
      success: true, 
      message: 'All bots initialized successfully (placeholder response)' 
    });
  } catch (error) {
    console.error('Error initializing bots:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize bots' });
  }
});

// Get bot performance metrics - placeholder since enhanced manager is removed
router.get('/api/admin/bots/:botName/performance', async (req, res) => {
  try {
    const { botName } = req.params;
    
    // Return placeholder performance data since enhanced telegram manager is no longer used
    res.json({
      success: true,
      data: {
        botName,
        displayName: `${botName} Bot`,
        performance: { messagesProcessed: 0, successRate: 100 },
        status: 'inactive',
        currentMethod: 'telegram',
        errorCount: 0,
        conflictCount: 0,
        lastActivity: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting bot performance:', error);
    res.status(500).json({ success: false, error: 'Failed to get bot performance' });
  }
});

// Get available methods for a bot - placeholder since enhanced manager is removed
router.get('/api/admin/bots/:botName/methods', async (req, res) => {
  try {
    const { botName } = req.params;
    
    // Return placeholder methods data since enhanced telegram manager is no longer used
    res.json({
      success: true,
      data: {
        botName,
        displayName: `${botName} Bot`,
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: false, priority: 2 },
          api: { enabled: false, priority: 3 }
        },
        affiliateNetwork: 'placeholder',
        tableName: `${botName}_products`
      }
    });
  } catch (error) {
    console.error('Error getting bot methods:', error);
    res.status(500).json({ success: false, error: 'Failed to get bot methods' });
  }
});

export default router;