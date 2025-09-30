import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { sqliteDb as sharedSqliteDb } from './db.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use shared connection pointing to the root database.sqlite initialized in db.ts
// This unifies all routes to operate on the same database file.
const sqliteDb = sharedSqliteDb;

const router = express.Router();

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify advertiser JWT token
const verifyAdvertiserToken = (req: any, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.advertiserId = decoded.advertiserId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get available ad placements
router.get('/placements', (req: Request, res: Response) => {
  try {
    const placements = sqliteDb.prepare(`
      SELECT id, placement_name as name, placement_type as description, dimensions, pricing_cpm as base_price, page_location
      FROM ad_placements
      WHERE status = 'active'
      ORDER BY pricing_cpm ASC
    `).all();

    res.json(placements);
  } catch (error) {
    console.error('Get placements error:', error);
    res.status(500).json({ error: 'Failed to get placements' });
  }
});

// Register new advertiser
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      contactName,
      email,
      phone,
      website,
      industry,
      campaignType,
      monthlyBudget,
      targetAudience,
      businessAddress,
      taxId,
      billingAddress,
      paymentMethod,
      password,
      agreeToTerms,
      agreeToPrivacy
    } = req.body;

    // Validate required fields
    if (!companyName || !contactName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!agreeToTerms || !agreeToPrivacy) {
      return res.status(400).json({ error: 'Must agree to terms and privacy policy' });
    }

    // Check if email already exists
    const existingAdvertiser = sqliteDb.prepare(
      'SELECT id FROM advertisers WHERE email = ?'
    ).get(email);

    if (existingAdvertiser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new advertiser
    const insertAdvertiser = sqliteDb.prepare(`
      INSERT INTO advertisers (
        company_name, contact_person, email, phone, website_url, business_type,
        billing_address, payment_method, password_hash, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = insertAdvertiser.run(
      companyName,
      contactName,
      email,
      phone || null,
      website || null,
      industry || null,
      billingAddress || null,
      paymentMethod || null,
      hashedPassword
    );

    res.status(201).json({
      message: 'Registration successful! Your account is pending approval.',
      advertiserId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Advertiser registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Advertiser login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get advertiser by email
    const advertiser = sqliteDb.prepare(
      'SELECT id, email, password_hash, status, company_name FROM advertisers WHERE email = ?'
    ).get(email) as any;

    if (!advertiser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, advertiser.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is approved
    if (advertiser.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account is pending approval or has been suspended',
        status: advertiser.status
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { advertiserId: advertiser.id, email: advertiser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      advertiser: {
        id: advertiser.id,
        email: advertiser.email,
        companyName: advertiser.company_name,
        status: advertiser.status
      }
    });

  } catch (error) {
    console.error('Advertiser login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get advertiser profile
router.get('/profile', verifyAdvertiserToken, (req: any, res: Response) => {
  try {
    const advertiser = sqliteDb.prepare(`
      SELECT id, company_name, contact_name, email, phone, website, industry,
             campaign_type, monthly_budget, target_audience, status, created_at
      FROM advertisers WHERE id = ?
    `).get(req.advertiserId);

    if (!advertiser) {
      return res.status(404).json({ error: 'Advertiser not found' });
    }

    res.json(advertiser);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Create new campaign
router.post('/campaigns', verifyAdvertiserToken, (req: any, res: Response) => {
  try {
    const {
      name,
      type,
      budget,
      startDate,
      endDate,
      targetAudience,
      adTitle,
      adDescription,
      clickUrl,
      imageUrl
    } = req.body;

    if (!name || !type || !budget || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required campaign fields' });
    }

    // Insert campaign
    const insertCampaign = sqliteDb.prepare(`
      INSERT INTO ad_campaigns (
        advertiser_id, campaign_name, campaign_type, budget_total, start_date, end_date,
        targeting_options, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
    `);

    const campaignResult = insertCampaign.run(
      req.advertiserId,
      name,
      type,
      budget,
      startDate,
      endDate,
      targetAudience || null
    );

    // Insert ad creative
    const insertCreative = sqliteDb.prepare(`
      INSERT INTO ad_creatives (
        campaign_id, ad_title, ad_description, image_url, click_url, ad_size, ad_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    insertCreative.run(
      campaignResult.lastInsertRowid,
      adTitle || 'Default Ad Title',
      adDescription || null,
      imageUrl || null,
      clickUrl || 'https://example.com',
      '300x250',
      type
    );

    res.status(201).json({
      message: 'Campaign created successfully',
      campaignId: campaignResult.lastInsertRowid
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get advertiser campaigns
router.get('/campaigns', verifyAdvertiserToken, (req: any, res: Response) => {
  try {
    const campaigns = sqliteDb.prepare(`
      SELECT c.*, 
             COALESCE(SUM(p.impressions), 0) as total_impressions,
             COALESCE(SUM(p.clicks), 0) as total_clicks,
             COALESCE(SUM(p.conversions), 0) as total_conversions,
             COALESCE(SUM(p.revenue), 0) as total_revenue
      FROM ad_campaigns c
      LEFT JOIN ad_creatives cr ON c.id = cr.campaign_id
      LEFT JOIN ad_performance p ON cr.id = p.creative_id
      WHERE c.advertiser_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all(req.advertiserId);

    res.json(campaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to get campaigns' });
  }
});

// Update campaign status
router.patch('/campaigns/:id/status', verifyAdvertiserToken, (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify campaign belongs to advertiser
    const campaign = sqliteDb.prepare(
      'SELECT id FROM ad_campaigns WHERE id = ? AND advertiser_id = ?'
    ).get(id, req.advertiserId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update status
    sqliteDb.prepare(
      'UPDATE ad_campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(status, id);

    res.json({ message: 'Campaign status updated' });
  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

// Get campaign performance
router.get('/campaigns/:id/performance', verifyAdvertiserToken, (req: any, res: Response) => {
  try {
    const { id } = req.params;

    // Verify campaign belongs to advertiser
    const campaign = sqliteDb.prepare(
      'SELECT id FROM ad_campaigns WHERE id = ? AND advertiser_id = ?'
    ).get(id, req.advertiserId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get performance data
    const performance = sqliteDb.prepare(`
      SELECT date, impressions, clicks, conversions, spend
      FROM ad_performance
      WHERE campaign_id = ?
      ORDER BY date DESC
      LIMIT 30
    `).all(id);

    res.json(performance);
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ error: 'Failed to get performance data' });
  }
});

// Get dashboard analytics
router.get('/analytics/dashboard', verifyAdvertiserToken, (req: any, res: Response) => {
  try {
    // Get overall stats
    const stats = sqliteDb.prepare(`
      SELECT 
        COUNT(DISTINCT c.id) as total_campaigns,
        COALESCE(SUM(p.impressions), 0) as total_impressions,
        COALESCE(SUM(p.clicks), 0) as total_clicks,
        COALESCE(SUM(p.conversions), 0) as total_conversions,
        COALESCE(SUM(p.spend), 0) as total_spent,
        COALESCE(SUM(c.budget), 0) as total_budget
      FROM ad_campaigns c
      LEFT JOIN ad_performance p ON c.id = p.campaign_id
      WHERE c.advertiser_id = ?
    `).get(req.advertiserId);

    // Get recent performance (last 7 days)
    const recentPerformance = sqliteDb.prepare(`
      SELECT 
        p.date,
        SUM(p.impressions) as impressions,
        SUM(p.clicks) as clicks,
        SUM(p.conversions) as conversions,
        SUM(p.spend) as spend
      FROM ad_performance p
      JOIN ad_campaigns c ON p.campaign_id = c.id
      WHERE c.advertiser_id = ? AND p.date >= date('now', '-7 days')
      GROUP BY p.date
      ORDER BY p.date DESC
    `).all(req.advertiserId);

    res.json({
      stats,
      recentPerformance
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;