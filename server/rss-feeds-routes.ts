/**
 * RSS Feeds Management Routes
 * API endpoints for managing external RSS feed sources for content aggregation
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import RSSParserService from './rss-parser-service.js';
import aggregationService from './rss-aggregation-service.js';
import { sqliteDb as sharedSqliteDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Use shared connection pointing to the root database.sqlite initialized in db.ts
const sqliteDb = sharedSqliteDb;

// Admin password verification
async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const adminUser = sqliteDb.prepare('SELECT password_hash FROM admin_users WHERE username = ?').get('admin') as any;
    
    if (!adminUser) return false;
    return await bcrypt.compare(password, adminUser.password_hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Get all RSS feeds
router.get('/api/admin/rss-feeds', async (req, res) => {
  try {
    const { password } = req.query;
    
    if (!password || !await verifyAdminPassword(password as string)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const feeds = sqliteDb.prepare(`
      SELECT id, name, url, description, category, update_frequency as updateFrequency,
             last_fetched as lastFetched, is_active as isActive, auto_import as autoImport,
             content_filter as contentFilter, affiliate_replace as affiliateReplace,
             created_at as createdAt, updated_at as updatedAt
      FROM rss_feeds 
      ORDER BY category ASC, created_at DESC
    `).all();
    res.json({ success: true, rssFeeds: feeds });
  } catch (error) {
    console.error('Error fetching RSS feeds:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch RSS feeds' });
  }
});

// Get active RSS feeds (for internal use)
router.get('/api/rss-feeds/active', async (req, res) => {
  try {
    const feeds = sqliteDb.prepare(`
      SELECT id, name, url, category, update_frequency as updateFrequency,
             last_fetched as lastFetched, auto_import as autoImport,
             content_filter as contentFilter, affiliate_replace as affiliateReplace
      FROM rss_feeds 
      WHERE is_active = 1
      ORDER BY category ASC
    `).all();
    res.json({ success: true, rssFeeds: feeds });
  } catch (error) {
    console.error('Error fetching active RSS feeds:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active RSS feeds' });
  }
});

// Create new RSS feed
router.post('/api/admin/rss-feeds', async (req, res) => {
  try {
    const { password, ...feedData } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { 
      name, 
      url, 
      description = '', 
      category = 'General', 
      updateFrequency = 60,
      isActive = true,
      autoImport = true,
      contentFilter = '',
      affiliateReplace = false
    } = feedData;
    
    if (!name || !url) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, url' 
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    // Check if RSS feed with same URL already exists
    const existing = sqliteDb.prepare('SELECT id FROM rss_feeds WHERE url = ?').get(url);
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'RSS feed with this URL already exists' 
      });
    }

    const currentTime = new Date().toISOString();
    const result = sqliteDb.prepare(`
      INSERT INTO rss_feeds (name, url, description, category, update_frequency, is_active, 
                            auto_import, content_filter, affiliate_replace, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, url, description, category, updateFrequency, isActive ? 1 : 0,
      autoImport ? 1 : 0, contentFilter, affiliateReplace ? 1 : 0, currentTime, currentTime
    );
    
    res.json({ 
      success: true, 
      message: 'RSS feed created successfully',
      rssFeed: { 
        id: result.lastInsertRowid, 
        name, 
        url, 
        description, 
        category, 
        updateFrequency,
        isActive,
        autoImport,
        contentFilter,
        affiliateReplace
      }
    });
  } catch (error) {
    console.error('Error creating RSS feed:', error);
    res.status(500).json({ success: false, error: 'Failed to create RSS feed' });
  }
});

// Update RSS feed
router.put('/api/admin/rss-feeds/:id', async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    const { 
      name, 
      url, 
      description, 
      category, 
      updateFrequency, 
      isActive, 
      autoImport, 
      contentFilter, 
      affiliateReplace 
    } = updates;
    
    // Check if RSS feed exists
    const existing = sqliteDb.prepare('SELECT id FROM rss_feeds WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'RSS feed not found' });
    }

    // Check if URL conflicts with another feed (if URL is being updated)
    if (url) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid URL format' 
        });
      }

      const urlConflict = sqliteDb.prepare('SELECT id FROM rss_feeds WHERE url = ? AND id != ?').get(url, id);
      if (urlConflict) {
        return res.status(400).json({ 
          success: false, 
          error: 'RSS feed with this URL already exists' 
        });
      }
    }

    const currentTime = new Date().toISOString();
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
    if (url !== undefined) { updateFields.push('url = ?'); updateValues.push(url); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (category !== undefined) { updateFields.push('category = ?'); updateValues.push(category); }
    if (updateFrequency !== undefined) { updateFields.push('update_frequency = ?'); updateValues.push(updateFrequency); }
    if (isActive !== undefined) { updateFields.push('is_active = ?'); updateValues.push(isActive ? 1 : 0); }
    if (autoImport !== undefined) { updateFields.push('auto_import = ?'); updateValues.push(autoImport ? 1 : 0); }
    if (contentFilter !== undefined) { updateFields.push('content_filter = ?'); updateValues.push(contentFilter); }
    if (affiliateReplace !== undefined) { updateFields.push('affiliate_replace = ?'); updateValues.push(affiliateReplace ? 1 : 0); }
    
    updateFields.push('updated_at = ?');
    updateValues.push(currentTime, id);
    
    sqliteDb.prepare(`
      UPDATE rss_feeds 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...updateValues);
    
    res.json({ success: true, message: 'RSS feed updated successfully' });
  } catch (error) {
    console.error('Error updating RSS feed:', error);
    res.status(500).json({ success: false, error: 'Failed to update RSS feed' });
  }
});

// Delete RSS feed
router.delete('/api/admin/rss-feeds/:id', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    const result = sqliteDb.prepare('DELETE FROM rss_feeds WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'RSS feed not found' });
    }
    
    res.json({ success: true, message: 'RSS feed deleted successfully' });
  } catch (error) {
    console.error('Error deleting RSS feed:', error);
    res.status(500).json({ success: false, error: 'Failed to delete RSS feed' });
  }
});

// Toggle RSS feed active status
router.patch('/api/admin/rss-feeds/:id/toggle', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    
    // Get current status
    const current = sqliteDb.prepare('SELECT is_active FROM rss_feeds WHERE id = ?').get(id) as any;
    if (!current) {
      return res.status(404).json({ success: false, error: 'RSS feed not found' });
    }
    
    const newStatus = current.is_active ? 0 : 1;
    const currentTime = new Date().toISOString();
    
    sqliteDb.prepare('UPDATE rss_feeds SET is_active = ?, updated_at = ? WHERE id = ?')
      .run(newStatus, currentTime, id);
    
    res.json({ 
      success: true, 
      message: `RSS feed ${newStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: Boolean(newStatus)
    });
  } catch (error) {
    console.error('Error toggling RSS feed status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle RSS feed status' });
  }
});

// Test RSS feed (fetch and parse without saving)
router.post('/api/admin/rss-feeds/test', async (req, res) => {
  try {
    const { password, url } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format' 
      });
    }

    // Test the RSS feed using RSSParserService
    const testResult = await RSSParserService.testRSSFeed(url);
    
    if (!testResult.valid) {
      return res.status(400).json({ 
        success: false, 
        error: testResult.error || 'Failed to fetch RSS feed'
      });
    }

    res.json({ 
      success: true, 
      message: 'RSS feed is valid and accessible',
      title: testResult.title,
      itemCount: testResult.itemCount
    });
  } catch (error) {
    console.error('Error testing RSS feed:', error);
    res.status(500).json({ success: false, error: 'Failed to test RSS feed' });
  }
});

// Manual RSS feed import
router.post('/api/admin/rss-feeds/:id/import', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const feedId = parseInt(req.params.id);
    
    // Trigger manual aggregation for specific feed
    const result = await aggregationService.manualAggregation(feedId);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Feed not found or failed to import' 
      });
    }

    res.json({ 
      success: true, 
      message: 'RSS feed imported successfully',
      stats: result
    });
  } catch (error) {
    console.error('Error importing RSS feed:', error);
    res.status(500).json({ success: false, error: 'Failed to import RSS feed' });
  }
});

// Get aggregation statistics
router.get('/api/admin/rss-feeds/aggregation/stats', async (req, res) => {
  try {
    const { password } = req.query;
    
    if (!await verifyAdminPassword(password as string)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stats = aggregationService.getStats();
    
    res.json({ 
      success: true, 
      stats: {
        ...stats,
        isRunning: aggregationService.isAggregationRunning(),
        feedsDue: aggregationService.getFeedsDueForUpdate().length
      }
    });
  } catch (error) {
    console.error('Error getting aggregation stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get aggregation stats' });
  }
});

// Manual aggregation trigger
router.post('/api/admin/rss-feeds/aggregation/run', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (aggregationService.isAggregationRunning()) {
      return res.status(409).json({ 
        success: false, 
        error: 'Aggregation is already running' 
      });
    }

    // Trigger manual aggregation (don't wait for completion)
    aggregationService.runManualAggregation().catch(error => {
      console.error('Manual aggregation error:', error);
    });

    res.json({ 
      success: true, 
      message: 'Manual aggregation started' 
    });
  } catch (error) {
    console.error('Error starting manual aggregation:', error);
    res.status(500).json({ success: false, error: 'Failed to start manual aggregation' });
  }
});

export default router;