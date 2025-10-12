/**
 * Static Banner Management Routes
 * API endpoints for managing static banner configuration without database dependency
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Robust static config path resolution to handle different deployment CWDs
function resolveStaticConfigPath(): string | null {
  // Highest priority: explicit env override
  const envPath = process.env.STATIC_BANNERS_PATH;
  if (envPath) {
    try {
      if (fs.existsSync(envPath)) return envPath;
      console.warn('[static-banners] STATIC_BANNERS_PATH set but file not found:', envPath);
    } catch (e) {
      console.warn('[static-banners] STATIC_BANNERS_PATH access error:', (e as any)?.message || e);
    }
  }

  const candidates = [
    // Relative to current working directory (PM2/systemd start location)
    path.join(process.cwd(), 'client', 'src', 'config', 'banners.json'),
    // Relative to compiled server directory
    path.join(__dirname, '..', 'client', 'src', 'config', 'banners.json'),
    // Common absolute deploy locations
    '/home/ec2-user/pickntrust/client/src/config/banners.json',
    '/var/www/pickntrust/client/src/config/banners.json',
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        if (process.env.DEBUG_BANNERS === '1') {
          console.log('[static-banners] Using static config at:', p);
        }
        return p;
      }
    } catch {}
  }
  if (process.env.DEBUG_BANNERS === '1') {
    console.warn('[static-banners] Static banner config not found. CWD:', process.cwd(), 'DIR:', __dirname);
    console.warn('[static-banners] Checked candidates:', candidates);
  }
  return null;
}

// Middleware to verify admin access
const verifyAdminAccess = (req: any, res: any, next: any) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'pickntrust2025';
  
  if (password !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  next();
};

// Get current static banner configuration
router.get('/api/admin/banners/static-config', (req, res) => {
  try {
    const configPath = resolveStaticConfigPath();
    if (!configPath || !fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, error: 'Banner config file not found' });
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error reading banner config:', error);
    res.status(500).json({ success: false, error: 'Failed to read banner configuration' });
  }
});

// Update static banner configuration
router.post('/api/admin/banners/static-config', verifyAdminAccess, (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({ success: false, error: 'Configuration data is required' });
    }
    
    // Validate configuration structure
    if (typeof config !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid configuration format' });
    }
    
    // Create backup of current config
    const configPath = resolveStaticConfigPath();
    if (configPath && fs.existsSync(configPath)) {
      const backupPath = configPath.replace('.json', `.backup.${Date.now()}.json`);
      fs.copyFileSync(configPath, backupPath);
      
      // Keep only last 5 backups
      const backupDir = path.dirname(configPath);
      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.includes('banners.backup.'))
        .sort()
        .reverse();
      
      if (backupFiles.length > 5) {
        backupFiles.slice(5).forEach(file => {
          fs.unlinkSync(path.join(backupDir, file));
        });
      }
    }
    
    // Ensure config directory exists
    const configDir = path.dirname(configPath ?? path.join(process.cwd(), 'client', 'src', 'config', 'banners.json'));
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write new configuration
    const targetPath = configPath ?? path.join(process.cwd(), 'client', 'src', 'config', 'banners.json');
    fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), 'utf8');
    
    console.log('✅ Static banner configuration updated successfully');
    res.json({ success: true, message: 'Banner configuration updated successfully' });
    
  } catch (error) {
    console.error('Error updating banner config:', error);
    res.status(500).json({ success: false, error: 'Failed to update banner configuration' });
  }
});

// Get banners for a specific page (static version)
router.get('/api/banners/static/:page', (req, res) => {
  try {
    const { page } = req.params;
    
    const configPath = resolveStaticConfigPath();
    if (!configPath || !fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, error: 'Banner config file not found' });
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    const pageBanners = config[page] || [];
    const activeBanners = pageBanners.filter((banner: any) => banner.isActive);
    
    res.json(activeBanners);
  } catch (error) {
    console.error('Error reading page banners:', error);
    res.status(500).json({ success: false, error: 'Failed to read page banners' });
  }
});

// Add a new banner to a specific page
router.post('/api/admin/banners/static/:page', verifyAdminAccess, (req, res) => {
  try {
    const { page } = req.params;
    const { banner } = req.body;
    
    if (!banner) {
      return res.status(400).json({ success: false, error: 'Banner data is required' });
    }
    
    // Read current config
    let config = {};
    const configPath = resolveStaticConfigPath();
    const targetPath = configPath ?? path.join(process.cwd(), 'client', 'src', 'config', 'banners.json');
    if (configPath && fs.existsSync(targetPath)) {
      const configData = fs.readFileSync(targetPath, 'utf8');
      config = JSON.parse(configData);
    }
    
    // Initialize page if it doesn't exist
    if (!(config as any)[page]) {
      (config as any)[page] = [];
    }
    
    // Generate new ID
    const allBanners = Object.values(config).flat() as any[];
    const maxId = allBanners.length > 0 ? Math.max(...allBanners.map(b => b.id || 0)) : 0;
    banner.id = maxId + 1;
    banner.page = page;
    
    // Add banner
    (config as any)[page].push(banner);
    
    // Save config
    fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ success: true, banner, message: 'Banner added successfully' });
  } catch (error) {
    console.error('Error adding banner:', error);
    res.status(500).json({ success: false, error: 'Failed to add banner' });
  }
});

// Update a specific banner
router.put('/api/admin/banners/static/:page/:id', verifyAdminAccess, (req, res) => {
  try {
    const { page, id } = req.params;
    const { banner } = req.body;
    const bannerId = parseInt(id);
    
    if (!banner) {
      return res.status(400).json({ success: false, error: 'Banner data is required' });
    }
    
    // Read current config
    const configPath = resolveStaticConfigPath();
    if (!configPath || !fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, error: 'Banner config file not found' });
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    if (!config[page]) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    
    // Find and update banner
    const bannerIndex = config[page].findIndex((b: any) => b.id === bannerId);
    if (bannerIndex === -1) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    banner.id = bannerId;
    banner.page = page;
    config[page][bannerIndex] = banner;
    
    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ success: true, banner, message: 'Banner updated successfully' });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ success: false, error: 'Failed to update banner' });
  }
});

// Delete a specific banner
router.delete('/api/admin/banners/static/:page/:id', verifyAdminAccess, (req, res) => {
  try {
    const { page, id } = req.params;
    const bannerId = parseInt(id);
    
    // Read current config
    const configPath = resolveStaticConfigPath();
    if (!configPath || !fs.existsSync(configPath)) {
      return res.status(404).json({ success: false, error: 'Banner config file not found' });
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    if (!config[page]) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    
    // Find and remove banner
    const bannerIndex = config[page].findIndex((b: any) => b.id === bannerId);
    if (bannerIndex === -1) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }
    
    config[page].splice(bannerIndex, 1);
    
    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ success: false, error: 'Failed to delete banner' });
  }
});

// Get banner statistics
router.get('/api/admin/banners/static/stats', (req, res) => {
  try {
    const configPath = resolveStaticConfigPath();
    if (!configPath || !fs.existsSync(configPath)) {
      return res.json({ 
        success: true, 
        stats: { totalBanners: 0, activePages: 0, inactivePages: 0, totalPages: 0 } 
      });
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    const stats = {
      totalBanners: 0,
      activeBanners: 0,
      inactiveBanners: 0,
      totalPages: Object.keys(config).length,
      pageStats: {} as any
    };
    
    Object.entries(config).forEach(([page, banners]: [string, any]) => {
      const activeBanners = banners.filter((b: any) => b.isActive).length;
      const inactiveBanners = banners.length - activeBanners;
      
      stats.totalBanners += banners.length;
      stats.activeBanners += activeBanners;
      stats.inactiveBanners += inactiveBanners;
      
      stats.pageStats[page] = {
        total: banners.length,
        active: activeBanners,
        inactive: inactiveBanners
      };
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting banner stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get banner statistics' });
  }
});

export default router;