/**
 * Credential Management Routes - API endpoints for secure credential management
 * Provides admin panel functionality for network credential CRUD operations
 */

import { Router } from 'express';
import credentialManager from './credential-manager.js';

const router = Router();

// Middleware for admin authentication (basic check)
const requireAdmin = (req: any, res: any, next: any) => {
  // In production, implement proper JWT or session-based auth
  const adminSession = req.headers['x-admin-session'];
  if (adminSession !== 'active') {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
};

// Get all available networks (without sensitive data)
router.get('/api/admin/credentials/networks', requireAdmin, async (req, res) => {
  try {
    const networks = await credentialManager.getAvailableNetworks();
    res.json({
      success: true,
      networks
    });
  } catch (error) {
    console.error('Error Failed to get networks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve networks'
    });
  }
});

// Get credential statistics
router.get('/api/admin/credentials/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await credentialManager.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error Failed to get credential stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

// Store new network credentials
router.post('/api/admin/credentials', requireAdmin, async (req, res) => {
  try {
    const { network, email, password, apiKey, isActive = true } = req.body;

    // Validation
    if (!network || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Network, email, and password are required'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const success = await credentialManager.storeCredentials({
      network: network.toLowerCase(),
      email,
      password,
      apiKey,
      isActive
    });

    if (success) {
      res.json({
        success: true,
        message: `Credentials stored securely for ${network}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to store credentials'
      });
    }
  } catch (error) {
    console.error('Error Failed to store credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Test network credentials (without exposing sensitive data)
router.post('/api/admin/credentials/:network/test', requireAdmin, async (req, res) => {
  try {
    const { network } = req.params;
    const result = await credentialManager.testCredentials(network.toLowerCase());
    
    res.json({
      success: true,
      test: result
    });
  } catch (error) {
    console.error('Error Failed to test credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test credentials'
    });
  }
});

// Delete network credentials
router.delete('/api/admin/credentials/:network', requireAdmin, async (req, res) => {
  try {
    const { network } = req.params;
    const success = await credentialManager.deleteCredentials(network.toLowerCase());
    
    if (success) {
      res.json({
        success: true,
        message: `Credentials deleted for ${network}`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Credentials not found'
      });
    }
  } catch (error) {
    console.error('Error Failed to delete credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete credentials'
    });
  }
});

// Initialize credentials with provided data (one-time setup)
router.post('/api/admin/credentials/initialize', requireAdmin, async (req, res) => {
  try {
    await credentialManager.initializeWithCredentials();
    res.json({
      success: true,
      message: 'Credentials initialized successfully'
    });
  } catch (error) {
    console.error('Error Failed to initialize credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize credentials'
    });
  }
});

// Update last used timestamp (called by scrapers)
router.put('/api/admin/credentials/:network/used', async (req, res) => {
  try {
    const { network } = req.params;
    await credentialManager.updateLastUsed(network.toLowerCase());
    res.json({
      success: true,
      message: 'Last used timestamp updated'
    });
  } catch (error) {
    console.error('Error Failed to update last used:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update timestamp'
    });
  }
});

// Get network credentials for internal use (by scrapers)
// This endpoint should be protected and only accessible internally
router.get('/api/internal/credentials/:network', async (req, res) => {
  try {
    // Check if request is from internal services
    const internalKey = req.headers['x-internal-key'];
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ error: 'Internal access only' });
    }

    const { network } = req.params;
    const credentials = await credentialManager.getCredentials(network.toLowerCase());
    
    if (credentials) {
      res.json({
        success: true,
        credentials: {
          email: credentials.email,
          password: credentials.password,
          apiKey: credentials.apiKey
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Credentials not found'
      });
    }
  } catch (error) {
    console.error('Error Failed to get internal credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check for credential system
router.get('/api/admin/credentials/health', requireAdmin, async (req, res) => {
  try {
    const stats = await credentialManager.getStats();
    const networks = await credentialManager.getAvailableNetworks();
    
    // Test each network's credentials
    const tests = await Promise.all(
      networks.map(async (network) => {
        const test = await credentialManager.testCredentials(network.network);
        return {
          network: network.network,
          isActive: network.isActive,
          valid: test.valid,
          error: test.error,
          lastUsed: network.lastUsed
        };
      })
    );

    res.json({
      success: true,
      health: {
        totalNetworks: stats.total,
        activeNetworks: stats.active,
        validCredentials: tests.filter(t => t.valid).length,
        tests
      }
    });
  } catch (error) {
    console.error('Error Failed to get credential health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check credential health'
    });
  }
});

export default router;