// URL Processing API Routes
// Backend endpoints for both automated and manual URL processing

import { Request, Response, Express } from "express";
import { urlProcessingService, ProcessingResult, BulkProcessingResult } from './url-processing-service.js';
import { urlResolver } from './universal-url-resolver.js';
import { platformDetector } from './platform-detector.js';
import { enhancedScraper } from './enhanced-universal-scraper.js';
import { affiliateConverter } from './affiliate-converter.js';

// Middleware for admin authentication
async function verifyAdminPassword(password: string): Promise<boolean> {
  return password === 'pickntrust2025'; // Use your actual admin password
}

export function setupURLProcessingRoutes(app: Express) {
  console.log('🔧 Setting up URL processing routes...');

  /**
   * POST /api/process-url
   * Process a single URL and optionally save to database
   */
  app.post('/api/process-url', async (req: Request, res: Response) => {
    try {
      const { url, targetPage, saveToDatabase = false, password } = req.body;
      
      // Validate input
      if (!url) {
        return res.status(400).json({ 
          success: false, 
          error: 'URL is required' 
        });
      }
      
      // Check admin password if saving to database
      if (saveToDatabase && !await verifyAdminPassword(password)) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - Invalid admin password' 
        });
      }
      
      console.log(`Target Processing URL: ${url}`);
      
      // Process the URL through the complete pipeline
      const result = await urlProcessingService.processURL(url, targetPage);
      
      // Save to database if requested and successful
      if (saveToDatabase && result.success && result.productCard) {
        const saved = await urlProcessingService.saveProductToDatabase(result.productCard, targetPage || 'prime-picks');
        
        if (!saved) {
          console.warn('Warning Product processing succeeded but database save failed');
        }
      }
      
      res.json(result);
      
    } catch (error) {
      console.error('Error URL processing error:', error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  });

  /**
   * POST /api/process-bulk-urls
   * Process multiple URLs in batch
   */
  app.post('/api/process-bulk-urls', async (req: Request, res: Response) => {
    try {
      const { urls, targetPage, saveToDatabase = false, password } = req.body;
      
      // Validate input
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'URLs array is required' 
        });
      }
      
      // Check admin password if saving to database
      if (saveToDatabase && !await verifyAdminPassword(password)) {
        return res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - Invalid admin password' 
        });
      }
      
      console.log(`Target Bulk processing ${urls.length} URLs`);
      
      // Process URLs in batch
      const result = await urlProcessingService.processBulkURLs(urls, targetPage);
      
      // Save successful results to database if requested
      if (saveToDatabase) {
        const savePromises = result.results
          .filter(r => r.success && r.productCard)
          .map(r => urlProcessingService.saveProductToDatabase(r.productCard!, targetPage || 'prime-picks'));
        
        await Promise.all(savePromises);
      }
      
      res.json(result);
      
    } catch (error) {
      console.error('Error Bulk URL processing error:', error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  });

  /**
   * POST /api/resolve-url
   * Just resolve a URL (handle shortened URLs)
   */
  app.post('/api/resolve-url', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      const resolved = await urlResolver.resolveURL(url);
      res.json(resolved);
      
    } catch (error) {
      console.error('Error URL resolution error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/detect-platform
   * Detect e-commerce platform from URL
   */
  app.post('/api/detect-platform', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      // First resolve the URL
      const resolved = await urlResolver.resolveURL(url);
      
      // Then detect platform
      const platformInfo = platformDetector.detectPlatform(resolved);
      
      res.json({ resolved, platformInfo });
      
    } catch (error) {
      console.error('Error Platform detection error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/scrape-product
   * Scrape product data from URL
   */
  app.post('/api/scrape-product', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      // Resolve URL first
      const resolved = await urlResolver.resolveURL(url);
      
      // Scrape product data
      const scrapedData = await enhancedScraper.scrapeProduct(resolved);
      
      res.json({ resolved, scrapedData });
      
    } catch (error) {
      console.error('Error Product scraping error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/convert-affiliate
   * Convert URL to affiliate link
   */
  app.post('/api/convert-affiliate', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      // Resolve URL and detect platform
      const resolved = await urlResolver.resolveURL(url);
      const platformInfo = platformDetector.detectPlatform(resolved);
      
      // Convert to affiliate link
      const affiliateLink = affiliateConverter.convertToAffiliate(resolved, platformInfo);
      
      res.json({ resolved, platformInfo, affiliateLink });
      
    } catch (error) {
      console.error('Error Affiliate conversion error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/processing-status
   * Get current processing queue status
   */
  app.get('/api/processing-status', (req: Request, res: Response) => {
    try {
      const status = urlProcessingService.getQueueStatus();
      res.json(status);
    } catch (error) {
      console.error('Error Status check error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * GET /api/supported-platforms
   * Get list of supported platforms and services
   */
  app.get('/api/supported-platforms', (req: Request, res: Response) => {
    try {
      const platforms = urlProcessingService.getSupportedPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error('Error Platform list error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/test-processing
   * Test the complete processing pipeline with a URL
   */
  app.post('/api/test-processing', async (req: Request, res: Response) => {
    try {
      const { url, password } = req.body;
      
      // Verify admin password
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      console.log(`🧪 Testing processing pipeline with: ${url}`);
      
      const result = await urlProcessingService.testProcessingPipeline(url);
      res.json(result);
      
    } catch (error) {
      console.error('Error Pipeline test error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/admin/clear-queue
   * Clear the processing queue (admin only)
   */
  app.post('/api/admin/clear-queue', async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      
      if (!await verifyAdminPassword(password)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      urlProcessingService.clearQueue();
      res.json({ message: 'Processing queue cleared' });
      
    } catch (error) {
      console.error('Error Queue clear error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /**
   * POST /api/admin/process-telegram-url
   * Process URL from Telegram message (used by automation)
   */
  app.post('/api/admin/process-telegram-url', async (req: Request, res: Response) => {
    try {
      const { url, messageId, channelId, targetPage = 'value-picks' } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      console.log(`Mobile Processing Telegram URL: ${url} (Message: ${messageId})`);
      
      // Process URL with Telegram context
      const result = await urlProcessingService.processURL(url, targetPage);
      
      // Save to database if successful
      if (result.success && result.productCard) {
        // Add Telegram metadata
        result.productCard.id = `${targetPage}_${messageId}_${Date.now()}`;
        
        const targetTable = getTargetTable(targetPage);
        const saved = await urlProcessingService.saveProductToDatabase(result.productCard, targetTable);
        
        if (saved) {
          console.log(`Success Telegram URL processed and saved: ${result.productCard.name}`);
        }
      }
      
      res.json(result);
      
    } catch (error) {
      console.error('Error Telegram URL processing error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  console.log('Success URL processing routes setup complete');
}

/**
 * Helper function to determine target database table
 */
function getTargetTable(targetPage?: string): string {
  switch (targetPage) {
    case 'prime-picks':
      return 'unified_content';
    case 'cue-picks':
      return 'unified_content';
    case 'click-picks':
      return 'unified_content';
    case 'value-picks':
      return 'unified_content';
    default:
      return 'unified_content';
  }
}

/**
 * Helper function to process URL from any source (Telegram, manual, etc.)
 */
export async function processURLFromSource(
  params: {
    url: string;
    source: string;
    messageId?: number;
    chatId?: number;
    messageGroupId?: string;
    productSequence?: number;
    totalInGroup?: number;
    targetPage?: string;
    userId?: string;
  }
): Promise<ProcessingResult> {
  const { url, source, targetPage = 'value-picks' } = params;
  console.log(`Refresh Processing URL from ${source}: ${url}`);
  
  try {
    const result = await urlProcessingService.processURL(url, targetPage);
    
    // Save to database if successful
    if (result.success && result.productCard) {
      // Add source metadata
      if (params.messageId) {
        result.productCard.id = `${targetPage}_${params.messageId}_${Date.now()}`;
      }
      
      const saved = await urlProcessingService.saveProductToDatabase(result.productCard, targetPage);
      
      if (saved) {
        console.log(`Success URL from ${source} processed and saved: ${result.productCard.name}`);
        // Add to products array for compatibility
        result.products = [result.productCard];
      }
    }
    
    return result;
    
  } catch (error) {
    console.error(`Error Error processing URL from ${source}:`, error);
    return {
      success: false,
      originalUrl: url,
      error: (error as Error).message,
      processingTime: 0
    };
  }
}