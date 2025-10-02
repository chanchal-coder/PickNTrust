/**
 * Canva Admin Routes - API endpoints for Canva automation settings management
 * Provides admin panel functionality for Canva integration configuration
 */

import { Router, Request, Response } from 'express';
import { storage } from './storage.js';
import bcrypt from 'bcrypt';
import { sqliteDb } from './db.js';

const router = Router();

// Admin password verification function (reused from other routes)
async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    // For localhost development, allow simple password
    if (password === 'pickntrust2025' || password === 'admin' || password === 'delete') {
      return true;
    }
    
    // Try to check admin_users table if it exists
    try {
      const adminUser = sqliteDb.prepare('SELECT password_hash FROM admin_users WHERE username = ?').get('admin') as any;
      if (adminUser) {
        return await bcrypt.compare(password, adminUser.password_hash);
      }
    } catch (error) {
      // admin_users table doesn't exist, fall back to simple password check
      console.log('admin_users table not found, using simple password check');
    }
    
    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * GET /api/admin/canva/settings
 * Retrieve current Canva automation settings
 */
router.get('/api/admin/canva/settings', async (req: Request, res: Response) => {
  try {
    const password = req.query.password as string;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password is required' 
      });
    }

    // Verify admin password
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - Invalid admin password' 
      });
    }

    // Get Canva settings from storage
    const settings = await storage.getCanvaSettings();
    
    if (!settings) {
      // Return default settings if none exist
      return res.json({
        success: true,
        settings: {
          isEnabled: false,
          apiKey: null,
          apiSecret: null,
          defaultTemplateId: null,
          autoGenerateCaptions: true,
          autoGenerateHashtags: true,
          defaultTitle: null,
          defaultCaption: null,
          defaultHashtags: null,
          platforms: '[]',
          scheduleType: 'immediate',
          scheduleDelayMinutes: 0
        }
      });
    }

    res.json({
      success: true,
      settings: settings
    });

  } catch (error) {
    console.error('Error fetching Canva settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Canva settings' 
    });
  }
});

/**
 * PUT /api/admin/canva/settings
 * Update Canva automation settings
 */
router.put('/api/admin/canva/settings', async (req: Request, res: Response) => {
  try {
    const { password, ...settingsData } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password is required' 
      });
    }

    // Verify admin password
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - Invalid admin password' 
      });
    }

    // Validate required settings structure
    if (!settingsData || typeof settingsData !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid settings data' 
      });
    }

    // Update Canva settings in storage
    try {
      const updatedSettings = await storage.updateCanvaSettings(settingsData);
      
      res.json({
        success: true,
        message: 'Canva settings updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      console.error('Error updating Canva settings:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update Canva settings' 
      });
    }

  } catch (error) {
    console.error('Error updating Canva settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update Canva settings' 
    });
  }
});

/**
 * POST /api/admin/canva/test
 * Test Canva automation functionality
 */
router.post('/api/admin/canva/test', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password is required' 
      });
    }

    // Verify admin password
    if (!await verifyAdminPassword(password)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - Invalid admin password' 
      });
    }

    // Get current settings to test
    const settings = await storage.getCanvaSettings();
    
    if (!settings || !settings.isEnabled) {
      return res.json({
        success: false,
        message: 'Canva automation is not enabled',
        test_results: {
          settings_loaded: !!settings,
          canva_enabled: false,
          api_configured: false
        }
      });
    }

    // Basic configuration test
    const hasApiKey = !!(settings.apiKey && settings.apiKey.trim());
    const hasApiSecret = !!(settings.apiSecret && settings.apiSecret.trim());
    
    res.json({
      success: true,
      message: 'Canva test completed',
      test_results: {
        settings_loaded: true,
        canva_enabled: settings.isEnabled,
        api_configured: hasApiKey && hasApiSecret,
        auto_captions: settings.autoGenerateCaptions,
        auto_hashtags: settings.autoGenerateHashtags,
        platforms_count: settings.platforms ? JSON.parse(settings.platforms as string).length : 0,
        schedule_type: settings.scheduleType
      }
    });

  } catch (error) {
    console.error('Error testing Canva functionality:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test Canva functionality' 
    });
  }
});

export default router;