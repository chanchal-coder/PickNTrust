// @ts-nocheck
// Image Proxy Service
// Bypasses CORS restrictions and serves authentic product images through our domain

import express from 'express';
import fetch from 'node-fetch';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

interface ProxyImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  cache?: boolean;
}

class ImageProxyService {
  private cacheDir: string;
  private maxCacheSize: number;
  private defaultOptions: ProxyImageOptions;

  constructor() {
    this.cacheDir = path.join(process.cwd(), 'image-cache');
    this.maxCacheSize = 500; // MB
    this.defaultOptions = {
      width: 400,
      height: 400,
      quality: 80,
      format: 'webp',
      cache: true
    };
    
    this.ensureCacheDir();
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.access(this.cacheDir);
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  // Generate cache key for image URL and options
  private generateCacheKey(imageUrl: string, options: ProxyImageOptions): string {
    const optionsStr = JSON.stringify(options);
    return createHash('md5').update(imageUrl + optionsStr).digest('hex');
  }

  // Get cached image path
  private getCachedImagePath(cacheKey: string, format: string): string {
    return path.join(this.cacheDir, `${cacheKey}.${format}`);
  }

  // Check if image is cached and valid
  private async isCached(cacheKey: string, format: string): Promise<boolean> {
    try {
      const filePath = this.getCachedImagePath(cacheKey, format);
      const stats = await fs.stat(filePath);
      
      // Cache valid for 24 hours
      const maxAge = 24 * 60 * 60 * 1000;
      return (Date.now() - stats.mtime.getTime()) < maxAge;
    } catch {
      return false;
    }
  }

  // Fetch and process image
  async proxyImage(imageUrl: string, options: Partial<ProxyImageOptions> = {}): Promise<Buffer> {
    const finalOptions = { ...this.defaultOptions, ...options };
    const cacheKey = this.generateCacheKey(imageUrl, finalOptions);
    const cachedPath = this.getCachedImagePath(cacheKey, finalOptions.format!);

    // Return cached image if available
    if (finalOptions.cache && await this.isCached(cacheKey, finalOptions.format!)) {
      console.log(`Products Serving cached image: ${imageUrl}`);
      return await fs.readFile(cachedPath);
    }

    console.log(`Global Fetching and processing image: ${imageUrl}`);

    try {
      // Fetch original image
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site'
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const imageBuffer = await response.buffer();
      
      // Process image with Sharp
      let processedImage = sharp(imageBuffer);
      
      // Resize if dimensions specified
      if (finalOptions.width || finalOptions.height) {
        processedImage = processedImage.resize(finalOptions.width, finalOptions.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Convert format and set quality
      switch (finalOptions.format) {
        case 'jpeg':
          processedImage = processedImage.jpeg({ quality: finalOptions.quality });
          break;
        case 'png':
          processedImage = processedImage.png({ quality: finalOptions.quality });
          break;
        case 'webp':
        default:
          processedImage = processedImage.webp({ quality: finalOptions.quality });
          break;
      }
      
      const finalBuffer = await processedImage.toBuffer();
      
      // Cache the processed image
      if (finalOptions.cache) {
        try {
          await fs.writeFile(cachedPath, finalBuffer);
          console.log(`Save Cached processed image: ${cacheKey}`);
        } catch (error) {
          console.warn(`Warning Failed to cache image: ${error.message}`);
        }
      }
      
      return finalBuffer;
      
    } catch (error) {
      console.error(`Error Failed to proxy image ${imageUrl}:`, error.message);
      throw error;
    }
  }

  // Clean old cache files
  async cleanCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`🗑️ Cleaned old cache file: ${file}`);
        }
      }
    } catch (error) {
      console.warn(`Warning Cache cleanup failed: ${error.message}`);
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<{files: number, size: number}> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return {
        files: files.length,
        size: Math.round(totalSize / (1024 * 1024)) // MB
      };
    } catch {
      return { files: 0, size: 0 };
    }
  }

  // Setup Express routes for image proxy
  setupRoutes(app: express.Application): void {
    // Main image proxy endpoint
    app.get('/api/image-proxy', async (req, res) => {
      try {
        const { url, width, height, quality, format } = req.query;
        
        if (!url || typeof url !== 'string') {
          return res.status(400).json({ error: 'Image URL is required' });
        }
        
        const options: Partial<ProxyImageOptions> = {};
        
        if (width) options.width = parseInt(width as string);
        if (height) options.height = parseInt(height as string);
        if (quality) options.quality = parseInt(quality as string);
        if (format) options.format = format as 'jpeg' | 'png' | 'webp';
        
        const imageBuffer = await this.proxyImage(url, options);
        const contentType = `image/${options.format || 'webp'}`;
        
        res.set({
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // 24 hours
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
        
        res.send(imageBuffer);
        
      } catch (error) {
        console.error('Image proxy error:', error.message);
        res.status(500).json({ error: 'Failed to proxy image' });
      }
    });
    
    // Cache management endpoints
    app.get('/api/image-proxy/stats', async (req, res) => {
      try {
        const stats = await this.getCacheStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get cache stats' });
      }
    });
    
    app.post('/api/image-proxy/clean-cache', async (req, res) => {
      try {
        await this.cleanCache();
        res.json({ message: 'Cache cleaned successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to clean cache' });
      }
    });
    
    console.log('🖼️ Image proxy routes setup complete');
  }
}

// Export singleton instance
export const imageProxyService = new ImageProxyService();

// Auto-cleanup cache every 6 hours
setInterval(async () => {
  await imageProxyService.cleanCache();
}, 6 * 60 * 60 * 1000);

export type { ProxyImageOptions };