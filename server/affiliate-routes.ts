// Affiliate System API Routes
// Provides REST API for affiliate management and URL building

import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { AffiliateUrlBuilder } from './affiliate-url-builder';
import { affiliateSystem } from './affiliate-system';

export function setupAffiliateRoutes(router: Router, db: any): void {
  const affiliateBuilder = new AffiliateUrlBuilder(db);

  // Get affiliate system status
  router.get('/api/affiliate/status', (req, res) => {
    try {
      const stats = affiliateBuilder.getAffiliateStats();
      const networks = affiliateBuilder.getNetworkConfigs();
      const supportedNetworks = affiliateSystem.getSupportedNetworks();

      res.json({
        success: true,
        stats,
        networks,
        supportedNetworks: supportedNetworks.map(n => ({
          id: n.id,
          name: n.name,
          tagParameter: n.tagParameter
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Configure affiliate network
  router.post('/api/affiliate/configure', (req, res) => {
    try {
      const { networkId, affiliateId, enabled = true } = req.body;

      if (!networkId || !affiliateId) {
        return res.status(400).json({
          success: false,
          error: 'Network ID and Affiliate ID are required'
        });
      }

      const success = affiliateBuilder.configureNetwork(networkId, affiliateId, enabled);
      
      if (success) {
        res.json({
          success: true,
          message: `${networkId} configured successfully`
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to configure network'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Build affiliate URL for single product
  router.post('/api/affiliate/build-url', (req, res) => {
    try {
      const { url, productId, tableName } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL is required'
        });
      }

      const result = affiliateBuilder.buildProductAffiliateUrl(url, productId, tableName);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Bulk process products
  router.post('/api/affiliate/bulk-process', (req, res) => {
    try {
      const { tableName, limit = 100 } = req.body;

      if (tableName) {
        // Process specific table
        const result = affiliateBuilder.bulkProcessTable(tableName, limit);
        res.json({
          success: true,
          result
        });
      } else {
        // Process all tables
        const results = affiliateBuilder.bulkProcessAllTables(limit);
        res.json({
          success: true,
          results
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get products with affiliate URLs for a specific page
  router.get('/api/affiliate/products/:page', (req, res) => {
    try {
      const { page } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      let tableName: string;
      switch (page) {
        case 'click-picks':
          tableName =           break;
        case 'prime-picks':
        case 'amazon':
          tableName =           break;
        case 'cue-picks':
        case 'cuelinks':
          tableName =           break;
        case 'value-picks':
          tableName =           break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid page specified'
          });
      }

      // Get products with affiliate URLs
      const products = db.prepare(`
        SELECT 
          id,
          name,
          price,
          currency,
          image_url,
          affiliate_url,
          original_url,
          affiliate_network,
          affiliate_tag_applied,
          category,
          rating,
          discount
        FROM ${tableName}
        WHERE affiliate_url IS NOT NULL
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      // Build affiliate URLs for products that don't have tags applied
      const processedProducts = products.map((product: any) => {
        if (!product.affiliate_tag_applied && product.affiliate_url) {
          const result = affiliateBuilder.buildProductAffiliateUrl(
            product.affiliate_url,
            product.id,
            tableName
          );
          
          return {
            ...product,
            affiliate_url: result.affiliateUrl,
            affiliate_network: result.networkId,
            affiliate_tag_applied: result.success ? 1 : 0
          };
        }
        return product;
      });

      res.json({
        success: true,
        products: processedProducts,
        page,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Validate affiliate URL
  router.post('/api/affiliate/validate', (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'URL is required'
        });
      }

      const validation = affiliateSystem.validateAffiliateUrl(url);
      res.json({
        success: true,
        validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get affiliate analytics
  router.get('/api/affiliate/analytics', (req, res) => {
    try {
      const { networkId, days = 30 } = req.query;
      
      let query = `
        SELECT 
          network_id,
          COUNT(*) as total_products,
          SUM(clicks) as total_clicks,
          SUM(conversions) as total_conversions,
          SUM(revenue) as total_revenue,
          AVG(clicks) as avg_clicks_per_product
        FROM affiliate_analytics
        WHERE created_at > strftime('%s', 'now', '-${days} days')
      `;
      
      const params: any[] = [];
      
      if (networkId) {
        query += ' AND network_id = ?';
        params.push(networkId);
      }
      
      query += ' GROUP BY network_id ORDER BY total_revenue DESC';
      
      const analytics = db.prepare(query).all(...params);
      
      res.json({
        success: true,
        analytics,
        period: `${days} days`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Track affiliate click
  router.post('/api/affiliate/track-click', (req, res) => {
    try {
      const { productId, tableName, networkId, affiliateUrl } = req.body;

      if (!productId || !tableName || !networkId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID, table name, and network ID are required'
        });
      }

      // Update or insert analytics record
      const upsertAnalytics = db.prepare(`
        INSERT INTO affiliate_analytics 
        (product_id, product_table, network_id, affiliate_url, clicks, last_clicked_at)
        VALUES (?, ?, ?, ?, 1, strftime('%s', 'now'))
        ON CONFLICT(product_id, product_table, network_id) DO UPDATE SET
          clicks = clicks + 1,
          last_clicked_at = strftime('%s', 'now')
      `);

      upsertAnalytics.run(productId, tableName, networkId, affiliateUrl);

      res.json({
        success: true,
        message: 'Click tracked successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  console.log('Success Affiliate system routes configured');
}