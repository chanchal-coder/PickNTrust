import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sqliteDb } from './db.js';

const router = Router();

// File paths to store ad requests and approved ads (config-driven, DB-less)
const requestsPath = path.join(process.cwd(), 'client', 'src', 'config', 'ad-requests.json');
const exploreAdsPath = path.join(process.cwd(), 'client', 'src', 'config', 'explore-ads.json');

function ensureFile(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
  } catch (e) {
    console.error('Failed to ensure file', filePath, e);
  }
}

function readJsonArray(filePath: string): any[] {
  ensureFile(filePath);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeJsonArray(filePath: string, data: any[]) {
  ensureFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function isAdmin(req: Request): boolean {
  const headerPwd = (req.headers['x-admin-password'] || req.headers['X-Admin-Password']) as string | undefined;
  // Very simple check aligned with current admin panel flow
  return headerPwd === 'pickntrust2025';
}

// Public: submit an ad request
router.post('/api/ad-requests', (req: Request, res: Response) => {
  try {
    const { title, imageUrl, clickUrl, type, description, companyName, contactEmail, viewMode, advertiserId, campaignId } = req.body || {};
    if (!title || !clickUrl) {
      return res.status(400).json({ message: 'title and clickUrl are required' });
    }
    const existing = readJsonArray(requestsPath);
    const item = {
      id: Date.now(),
      title,
      imageUrl: imageUrl || null,
      clickUrl,
      type: type || null,
      description: description || null,
      companyName: companyName || null,
      contactEmail: contactEmail || null,
      viewMode: viewMode || null,
      advertiserId: advertiserId || null,
      campaignId: campaignId || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    existing.unshift(item);
    writeJsonArray(requestsPath, existing);
    res.json({ message: 'Request submitted', request: item });
  } catch (error) {
    console.error('Submit ad request error:', error);
    res.status(500).json({ message: 'Failed to submit request' });
  }
});

// Admin: list all ad requests
router.get('/api/admin/ad-requests', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const items = readJsonArray(requestsPath);
    res.json(items);
  } catch (error) {
    console.error('Get ad requests error:', error);
    res.status(500).json({ message: 'Failed to fetch ad requests' });
  }
});

// Admin: approve a request and add to explore-ads config
router.post('/api/admin/ad-requests/:id/approve', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const id = parseInt(req.params.id);
    const requests = readJsonArray(requestsPath);
    const idx = requests.findIndex((r: any) => r.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Request not found' });

    // Mark as approved
    requests[idx].status = 'approved';
    requests[idx].approvedAt = new Date().toISOString();
    writeJsonArray(requestsPath, requests);

    // Append to explore ads config
    const ads = readJsonArray(exploreAdsPath);
    const adItem = {
      id: Date.now(),
      title: requests[idx].title,
      imageUrl: requests[idx].imageUrl || undefined,
      clickUrl: requests[idx].clickUrl,
      type: requests[idx].type || undefined,
      description: requests[idx].description || undefined,
      viewMode: requests[idx].viewMode || undefined,
      advertiserId: requests[idx].advertiserId || undefined,
      campaignId: requests[idx].campaignId || undefined,
      source: 'approved-request',
    };
    ads.unshift(adItem);
    writeJsonArray(exploreAdsPath, ads);

    res.json({ message: 'Approved and added to Explore ads', ad: adItem });
  } catch (error) {
    console.error('Approve ad request error:', error);
    res.status(500).json({ message: 'Failed to approve request' });
  }
});

// Admin: reject a request
router.post('/api/admin/ad-requests/:id/reject', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body || {};
    const requests = readJsonArray(requestsPath);
    const idx = requests.findIndex((r: any) => r.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Request not found' });
    requests[idx].status = 'rejected';
    requests[idx].rejectedAt = new Date().toISOString();
    requests[idx].rejectReason = reason || null;
    writeJsonArray(requestsPath, requests);
    res.json({ message: 'Request rejected' });
  } catch (error) {
    console.error('Reject ad request error:', error);
    res.status(500).json({ message: 'Failed to reject request' });
  }
});

// Public: get approved Explore ads (config-driven)
router.get('/api/config/explore-ads', (_req: Request, res: Response) => {
  try {
    const ads = readJsonArray(exploreAdsPath);
    res.json(ads);
  } catch (error) {
    console.error('Get explore ads config error:', error);
    res.status(500).json({ message: 'Failed to fetch explore ads config' });
  }
});

// Admin: add an Explore ad directly (bypass requests)
router.post('/api/admin/explore-ads', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const {
      title,
      imageUrl,
      clickUrl,
      type,
      description,
      viewMode,
      advertiserId,
      campaignId,
      logoUrl,
      imageAlt,
      colorAccent,
      buttonText,
      utmSource,
      utmMedium,
      utmCampaign,
      priority,
      rotationWeight,
      publishAt,
      status,
      pinFirst,
      badges,
      titleStyle,
      descriptionStyle
    } = req.body || {};
    if (!title || !clickUrl) {
      return res.status(400).json({ message: 'title and clickUrl are required' });
    }
    const ads = readJsonArray(exploreAdsPath);
    const adItem = {
      id: Date.now(),
      title,
      imageUrl: imageUrl || undefined,
      clickUrl,
      type: type || undefined,
      description: description || undefined,
      viewMode: viewMode || undefined,
      advertiserId: advertiserId || undefined,
      campaignId: campaignId || undefined,
      logoUrl: logoUrl || undefined,
      imageAlt: imageAlt || undefined,
      colorAccent: colorAccent || undefined,
      buttonText: buttonText || undefined,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      priority: priority || 'normal',
      rotationWeight: typeof rotationWeight === 'number' ? rotationWeight : 50,
      publishAt: publishAt || undefined,
      status: status || 'draft',
      pinFirst: !!pinFirst,
      badges: Array.isArray(badges) ? badges : undefined,
      titleStyle: titleStyle || undefined,
      descriptionStyle: descriptionStyle || undefined,
      source: 'admin-direct',
    };
    ads.unshift(adItem);
    writeJsonArray(exploreAdsPath, ads);
    res.json({ message: 'Ad added', ad: adItem });
  } catch (error) {
    console.error('Add explore ad error:', error);
    res.status(500).json({ message: 'Failed to add explore ad' });
  }
});

// Admin: delete an Explore ad
router.delete('/api/admin/explore-ads/:id', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const id = parseInt(req.params.id);
    const ads = readJsonArray(exploreAdsPath);
    const next = ads.filter((a: any) => a.id !== id);
    writeJsonArray(exploreAdsPath, next);
    res.json({ message: 'Ad deleted' });
  } catch (error) {
    console.error('Delete explore ad error:', error);
    res.status(500).json({ message: 'Failed to delete explore ad' });
  }
});

// Admin: update an Explore ad
router.put('/api/admin/explore-ads/:id', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const id = parseInt(req.params.id);
    const ads = readJsonArray(exploreAdsPath);
    const idx = ads.findIndex((a: any) => a.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Ad not found' });

    const {
      title,
      imageUrl,
      clickUrl,
      type,
      description,
      viewMode,
      advertiserId,
      campaignId,
      logoUrl,
      imageAlt,
      colorAccent,
      buttonText,
      utmSource,
      utmMedium,
      utmCampaign,
      priority,
      rotationWeight,
      publishAt,
      status,
      pinFirst,
      badges,
      titleStyle,
      descriptionStyle
    } = req.body || {};

    const current = ads[idx] || {};
    const updated = {
      ...current,
      // Only update provided fields; keep existing otherwise
      title: title ?? current.title,
      imageUrl: imageUrl ?? current.imageUrl,
      clickUrl: clickUrl ?? current.clickUrl,
      type: type ?? current.type,
      description: description ?? current.description,
      viewMode: viewMode ?? current.viewMode,
      advertiserId: advertiserId ?? current.advertiserId,
      campaignId: campaignId ?? current.campaignId,
      logoUrl: logoUrl ?? current.logoUrl,
      imageAlt: imageAlt ?? current.imageAlt,
      colorAccent: colorAccent ?? current.colorAccent,
      buttonText: buttonText ?? current.buttonText,
      utmSource: utmSource ?? current.utmSource,
      utmMedium: utmMedium ?? current.utmMedium,
      utmCampaign: utmCampaign ?? current.utmCampaign,
      priority: priority ?? current.priority,
      rotationWeight: typeof rotationWeight === 'number' ? rotationWeight : current.rotationWeight,
      publishAt: publishAt ?? current.publishAt,
      status: status ?? current.status,
      pinFirst: typeof pinFirst === 'boolean' ? pinFirst : current.pinFirst,
      badges: Array.isArray(badges) ? badges : current.badges,
      titleStyle: titleStyle ?? current.titleStyle,
      descriptionStyle: descriptionStyle ?? current.descriptionStyle,
    };

    ads[idx] = updated;
    writeJsonArray(exploreAdsPath, ads);
    res.json({ message: 'Ad updated', ad: updated });
  } catch (error) {
    console.error('Update explore ad error:', error);
    res.status(500).json({ message: 'Failed to update explore ad' });
  }
});

// Admin: list approved (active) campaigns for dropdown selection
router.get('/api/admin/campaigns', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const rows = sqliteDb.prepare(`
      SELECT id, campaign_name AS name, advertiser_id AS advertiserId, status
      FROM ad_campaigns
      WHERE status = 'active'
      ORDER BY created_at DESC, id DESC
    `).all();
    // Normalize output
    const campaigns = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      advertiserId: r.advertiserId,
      status: r.status
    }));
    res.json(campaigns);
  } catch (error) {
    console.error('List campaigns error:', error);
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
});

// Admin: list pending advertisers
router.get('/api/admin/advertisers/pending', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const rows = sqliteDb.prepare(`
      SELECT id, company_name, contact_person, email, status, created_at
      FROM advertisers
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `).all();
    res.json(rows);
  } catch (error) {
    console.error('List pending advertisers error:', error);
    res.status(500).json({ message: 'Failed to fetch pending advertisers' });
  }
});

// Admin: list approved advertisers
router.get('/api/admin/advertisers/approved', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const rows = sqliteDb.prepare(`
      SELECT id, company_name, contact_person, email, status, created_at
      FROM advertisers
      WHERE status = 'approved'
      ORDER BY created_at DESC
    `).all();
    res.json(rows);
  } catch (error) {
    console.error('List approved advertisers error:', error);
    res.status(500).json({ message: 'Failed to fetch approved advertisers' });
  }
});

// Admin: approve an advertiser
router.post('/api/admin/advertisers/:id/approve', (req: Request, res: Response) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const { id } = req.params;
    const result = sqliteDb.prepare(
      `UPDATE advertisers SET status = 'approved' WHERE id = ?`
    ).run(id);
    if (!result || result.changes === 0) {
      return res.status(404).json({ message: 'Advertiser not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Approve advertiser error:', error);
    res.status(500).json({ message: 'Failed to approve advertiser' });
  }
});

export default router;