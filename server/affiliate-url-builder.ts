// Affiliate URL Builder Service
// Integrates with database and provides URL building functionality

import Database from 'better-sqlite3';
import { affiliateSystem } from './affiliate-system';

// Define the product tables that need affiliate processing
const tables = [
  'unified_content'
];

export interface AffiliateUrlResult {
  success: boolean;
  originalUrl: string;
  affiliateUrl: string;
  networkId: string;
  networkName: string;
  error?: string;
}

export interface BulkAffiliateResult {
  processed: number;
  successful: number;
  failed: number;
  results: AffiliateUrlResult[];
}

class AffiliateUrlBuilder {
  private db: any;

  constructor(database: any) {
    this.db = database;
    this.loadDatabaseConfigs();
  }

  /**
   * Load affiliate configurations from database
   */
  private loadDatabaseConfigs(): void {
    try {
      const configs = this.db.prepare(`
        SELECT network_id, affiliate_id, sub_id, enabled 
        FROM affiliate_configs 
        WHERE enabled = 1
      `).all();

      configs.forEach((config: any) => {
        affiliateSystem.configureNetwork(
          config.network_id,
          config.affiliate_id,
          config.enabled === 1,
          config.sub_id
        );
      });

      console.log(`Success Loaded ${configs.length} active affiliate configurations`);
    } catch (error) {
      console.error('Error Error loading affiliate configs:', error);
    }
  }

  /**
   * Build affiliate URL for a single product
   */
  buildProductAffiliateUrl(originalUrl: string, productId?: number, tableName?: string): AffiliateUrlResult {
    try {
      // Detect network
      const network = affiliateSystem.detectNetwork(originalUrl);
      if (!network) {
        return {
          success: false,
          originalUrl,
          affiliateUrl: originalUrl,
          networkId: 'unknown',
          networkName: 'Unknown',
          error: 'Network not detected'
        };
      }

      // Build affiliate URL
      const affiliateUrl = affiliateSystem.buildAffiliateUrl(originalUrl, network.id);
      
      const result: AffiliateUrlResult = {
        success: affiliateUrl !== originalUrl,
        originalUrl,
        affiliateUrl,
        networkId: network.id,
        networkName: network.name
      };

      // Update database if product info provided
      if (productId && tableName && result.success) {
        this.updateProductAffiliateInfo(productId, tableName, result);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        originalUrl,
        affiliateUrl: originalUrl,
        networkId: 'error',
        networkName: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update product with affiliate information
   */
  private updateProductAffiliateInfo(productId: number, tableName: string, result: AffiliateUrlResult): void {
    try {
      const updateStmt = this.db.prepare(`
        UPDATE ${tableName} 
        SET 
          original_url = ?,
          affiliate_url = ?,
          affiliate_network = ?,
          affiliate_tag_applied = 1,
          affiliate_config = ?
        WHERE id = ?
      `);

      const config = JSON.stringify({
        networkId: result.networkId,
        networkName: result.networkName,
        processedAt: Date.now()
      });

      updateStmt.run(
        result.originalUrl,
        result.affiliateUrl,
        result.networkId,
        config,
        productId
      );

      console.log(`Success Updated ${tableName} product ${productId} with ${result.networkName} affiliate URL`);
    } catch (error) {
      console.error(`Error Error updating product ${productId}:`, error);
    }
  }

  /**
   * Bulk process products from a table
   */
  bulkProcessTable(tableName: string, limit: number = 100): BulkAffiliateResult {
    console.log(`Refresh Bulk processing ${tableName} (limit: ${limit})...`);
    
    try {
      // Get products that haven't been processed yet
      const products = this.db.prepare(`
        SELECT id, affiliate_url 
        FROM ${tableName} 
        WHERE (affiliate_tag_applied IS NULL OR affiliate_tag_applied = 0)
        AND affiliate_url IS NOT NULL 
        AND affiliate_url != ''
        LIMIT ?
      `).all(limit);

      console.log(`📋 Found ${products.length} products to process in ${tableName}`);

      const results: AffiliateUrlResult[] = [];
      let successful = 0;
      let failed = 0;

      products.forEach((product: any) => {
        const result = this.buildProductAffiliateUrl(
          product.affiliate_url,
          product.id,
          tableName
        );
        
        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      });

      console.log(`Success Processed ${products.length} products: ${successful} successful, ${failed} failed`);

      return {
        processed: products.length,
        successful,
        failed,
        results
      };
    } catch (error) {
      console.error(`Error Error bulk processing ${tableName}:`, error);
      return {
        processed: 0,
        successful: 0,
        failed: 0,
        results: []
      };
    }
  }

  /**
   * Process all product tables
   */
  bulkProcessAllTables(limit: number = 100): { [tableName: string]: BulkAffiliateResult } {
        const results: { [tableName: string]: BulkAffiliateResult } = {};

    console.log('Launch Starting bulk processing of all product tables...');
    console.log('');

    tables.forEach(tableName => {
      results[tableName] = this.bulkProcessTable(tableName, limit);
    });

    // Summary
    const totalProcessed = Object.values(results).reduce((sum, result) => sum + result.processed, 0);
    const totalSuccessful = Object.values(results).reduce((sum, result) => sum + result.successful, 0);
    const totalFailed = Object.values(results).reduce((sum, result) => sum + result.failed, 0);

    console.log('');
    console.log('Stats BULK PROCESSING SUMMARY:');
    console.log(`   Total Processed: ${totalProcessed}`);
    console.log(`   Successful: ${totalSuccessful}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${totalProcessed > 0 ? Math.round((totalSuccessful / totalProcessed) * 100) : 0}%`);

    return results;
  }

  /**
   * Get affiliate statistics
   */
  getAffiliateStats(): any {
    try {
            const stats: any = {
        total: 0,
        processed: 0,
        networks: {}
      };

      tables.forEach(tableName => {
        // Total products
        const total = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any;
        stats.total += total.count;

        // Processed products
        const processed = this.db.prepare(`
          SELECT COUNT(*) as count 
          FROM ${tableName} 
          WHERE affiliate_tag_applied = 1
        `).get() as any;
        stats.processed += processed.count;

        // Network breakdown
        const networks = this.db.prepare(`
          SELECT affiliate_network, COUNT(*) as count 
          FROM ${tableName} 
          WHERE affiliate_tag_applied = 1 
          GROUP BY affiliate_network
        `).all();

        networks.forEach((network: any) => {
          if (!stats.networks[network.affiliate_network]) {
            stats.networks[network.affiliate_network] = 0;
          }
          stats.networks[network.affiliate_network] += network.count;
        });
      });

      stats.processingRate = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;

      return stats;
    } catch (error) {
      console.error('Error Error getting affiliate stats:', error);
      return { total: 0, processed: 0, networks: {}, processingRate: 0 };
    }
  }

  /**
   * Configure affiliate network
   */
  configureNetwork(networkId: string, affiliateId: string, enabled: boolean = true): boolean {
    try {
      // Update database
      const updateStmt = this.db.prepare(`
        UPDATE affiliate_configs 
        SET affiliate_id = ?, enabled = ?, updated_at = strftime('%s', 'now')
        WHERE network_id = ?
      `);

      const result = updateStmt.run(affiliateId, enabled ? 1 : 0, networkId);
      
      if (result.changes > 0) {
        // Update in-memory configuration
        affiliateSystem.configureNetwork(networkId, affiliateId, enabled);
        console.log(`Success Configured ${networkId} with ID: ${affiliateId} (${enabled ? 'enabled' : 'disabled'})`);
        return true;
      } else {
        console.log(`Error Network ${networkId} not found in database`);
        return false;
      }
    } catch (error) {
      console.error(`Error Error configuring network ${networkId}:`, error);
      return false;
    }
  }

  /**
   * Get all network configurations
   */
  getNetworkConfigs(): any[] {
    try {
      return this.db.prepare(`
        SELECT network_id, network_name, affiliate_id, enabled, tag_parameter, tag_format
        FROM affiliate_configs
        ORDER BY network_name
      `).all();
    } catch (error) {
      console.error('Error Error getting network configs:', error);
      return [];
    }
  }
}

export { AffiliateUrlBuilder };