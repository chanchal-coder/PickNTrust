import { Request, Response } from 'express';
import { storage } from './storage.js';

interface ContentData {
  id: number;
  title: string;
  affiliateUrl: string;
  expiresAt?: Date;
  countdownEnd?: Date;
  isExpired?: boolean;
  type: 'product' | 'service' | 'blog' | 'video';
}

export class RedirectHandler {
  
  // Main redirect endpoint handler
  static async handleRedirect(req: Request, res: Response): Promise<void> {
    const { type, id } = req.params;
    const baseUrl = process.env.WEBSITE_URL || 'https://pickntrust.com';
    
    try {
      console.log(`Link REDIRECT REQUEST: ${type}/${id}`);
      
      // Get content from database using storage layer
      const content = await RedirectHandler.getContentById(type, parseInt(id));
      
      if (!content) {
        console.log(`Error CONTENT NOT FOUND: ${type}/${id}`);
        return res.redirect(`${baseUrl}?notfound=true`);
      }
      
      // Check if content has expiration date
      if (content.expiresAt && new Date() > content.expiresAt) {
        console.log(`⏰ EXPIRED BY DATE: ${type}/${id} expired at ${content.expiresAt}`);
        return res.redirect(`${baseUrl}?expired=true&title=${encodeURIComponent(content.title)}`);
      }
      
      // Check if countdown has ended
      if (content.countdownEnd && new Date() > content.countdownEnd) {
        console.log(`⏰ COUNTDOWN ENDED: ${type}/${id} countdown ended at ${content.countdownEnd}`);
        return res.redirect(`${baseUrl}?expired=true&title=${encodeURIComponent(content.title)}`);
      }
      
      // Check if manually marked as expired
      if (content.isExpired) {
        console.log(`Error MANUALLY EXPIRED: ${type}/${id} marked as expired`);
        return res.redirect(`${baseUrl}?expired=true&title=${encodeURIComponent(content.title)}`);
      }
      
      // Check if affiliate link is still valid
      const isLinkValid = await RedirectHandler.checkLinkValidity(content.affiliateUrl);
      
      if (!isLinkValid) {
        console.log(`Link INVALID LINK: ${type}/${id} - affiliate link no longer valid`);
        
        // Mark as expired in database for future requests
        await RedirectHandler.markAsExpired(type, parseInt(id));
        
        return res.redirect(`${baseUrl}?invalid=true&title=${encodeURIComponent(content.title)}`);
      }
      
      // Link is valid - redirect to affiliate site
      console.log(`Success VALID REDIRECT: ${type}/${id} -> ${content.affiliateUrl}`);
      
      // Track the redirect for analytics
      await RedirectHandler.trackRedirect(type, parseInt(id));
      
      return res.redirect(content.affiliateUrl);
      
    } catch (error) {
      console.error('Alert REDIRECT ERROR:', error);
      // Safe fallback to homepage
      return res.redirect(`${baseUrl}?error=true`);
    }
  }
  
  // Get content from database by type and ID using storage layer
  private static async getContentById(type: string, id: number): Promise<ContentData | null> {
    try {
      let content: any = null;
      
      switch (type.toLowerCase()) {
        case 'product':
        case 'service':
          content = await storage.getProduct(id);
          break;
        case 'blog':
          // For blog posts, we'd need to add a getBlogPost method to storage
          // For now, return null to redirect to homepage
          return null;
        case 'video':
          // For video content, we'd need to add a getVideoContent method to storage
          // For now, return null to redirect to homepage
          return null;
        default:
          return null;
      }
      
      if (!content) {
        return null;
      }
      
      // Map the content to our ContentData interface
      const contentData: ContentData = {
        id: content.id,
        title: content.title || content.name,
        affiliateUrl: content.affiliateUrl || '',
        type: type as 'product' | 'service' | 'blog' | 'video'
      };
      
      // Handle timer-based expiration for products/services
      if (content.hasTimer && content.timerStartTime && content.timerDuration) {
        const startTime = new Date(content.timerStartTime);
        const durationHours = parseInt(content.timerDuration.toString());
        const expirationTime = new Date(startTime.getTime() + (durationHours * 60 * 60 * 1000));
        
        contentData.countdownEnd = expirationTime;
        
        // Check if timer has expired
        if (new Date() > expirationTime) {
          contentData.isExpired = true;
        }
      }
      
      return contentData;
      
    } catch (error) {
      console.error('Database error in getContentById:', error);
      return null;
    }
  }
  
  // Check if affiliate link is still valid
  private static async checkLinkValidity(url: string): Promise<boolean> {
    try {
      console.log(`Search CHECKING LINK: ${url}`);
      
      // Skip validation for empty URLs
      if (!url || url.trim() === '') {
        return false;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'PickNTrust-Bot/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Link is valid if it returns 200-399 status codes
      const isValid = response.status >= 200 && response.status < 400;
      
      console.log(`${isValid ? 'Success' : 'Error'} LINK CHECK: ${url} returned ${response.status}`);
      
      return isValid;
      
    } catch (error) {
      console.log(`Error LINK CHECK FAILED: ${url} - ${error}`);
      // If we can't reach the link, consider it invalid
      return false;
    }
  }
  
  // Mark content as expired in database using storage layer
  private static async markAsExpired(type: string, id: number): Promise<void> {
    try {
      switch (type.toLowerCase()) {
        case 'product':
        case 'service':
          // Mark product as expired by updating it
          await storage.updateProduct(id, { 
            // We can add an isExpired field to the product schema later
            // For now, we'll just log it
          });
          break;
        case 'blog':
          // Mark blog post as expired
          // await storage.updateBlogPost(id, { isExpired: true });
          break;
        case 'video':
          // Mark video content as expired
          // await storage.updateVideoContent(id, { isExpired: true });
          break;
      }
      
      console.log(`Refresh MARKED AS EXPIRED: ${type}/${id}`);
      
    } catch (error) {
      console.error('Error marking as expired:', error);
    }
  }
  
  // Track redirect for analytics (simplified version)
  private static async trackRedirect(type: string, id: number): Promise<void> {
    try {
      // For now, just log the redirect
      // In the future, we could add a redirects table to track analytics
      console.log(`Stats TRACKED REDIRECT: ${type}/${id} at ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error('Error tracking redirect:', error);
      // Don't fail the redirect if tracking fails
    }
  }
  
  // Get redirect statistics (placeholder)
  static async getRedirectStats(type?: string, id?: number): Promise<any> {
    try {
      // Placeholder for redirect statistics
      // In the future, this could query a redirects table
      return [];
      
    } catch (error) {
      console.error('Error getting redirect stats:', error);
      return [];
    }
  }
}

// Export the handler function for use in routes
export const handleRedirect = RedirectHandler.handleRedirect;
