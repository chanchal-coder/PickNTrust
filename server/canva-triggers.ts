/**
 * Canva Database Triggers
 * Hooks into content creation to automatically trigger Canva automation
 */

import { canvaAutomation } from './canva-automation.js';

interface Product {
  id: number;
  name: string;
  description: string;
  price?: number | string | null;
  // Support both snake_case and camelCase from various sources
  image_url?: string;
  imageUrl?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  category?: string;
  is_service?: boolean;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt?: string;
  content?: string;
  category?: string;
  // Support both snake_case and camelCase
  image_url?: string;
  imageUrl?: string;
}

interface VideoContent {
  id: number;
  title: string;
  description: string;
  // Support both snake_case and camelCase
  video_url?: string;
  videoUrl?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  category?: string;
}

/**
 * Trigger Canva automation for new products
 */
export async function triggerCanvaForProduct(product: Product): Promise<void> {
  try {
    console.log(`Refresh Triggering Canva automation for product: ${product.name}`);
    
    const imageUrl = product.image_url ?? product.imageUrl ?? product.thumbnail_url ?? product.thumbnailUrl;
    const priceVal = typeof product.price === 'string' ? Number(product.price) : product.price;
    const contentItem = {
      id: product.id,
      type: product.is_service ? 'service' as const : 'product' as const,
      title: product.name,
      description: product.description,
      image_url: imageUrl,
      price: typeof priceVal === 'number' && isFinite(priceVal as number) ? (priceVal as number) : undefined,
      category: product.category
    };

    await canvaAutomation.triggerContentCreation(contentItem);
  } catch (error) {
    console.error('Failed to trigger Canva automation for product:', error);
    // Don't throw error to avoid breaking product creation
  }
}

/**
 * Trigger Canva automation for new blog posts
 */
export async function triggerCanvaForBlog(blogPost: BlogPost): Promise<void> {
  try {
    console.log(`Refresh Triggering Canva automation for blog: ${blogPost.title}`);
    
    const description = blogPost.excerpt ?? (blogPost.content ? blogPost.content.substring(0, 200) : '');
    const imageUrl = blogPost.image_url ?? blogPost.imageUrl;
    const contentItem = {
      id: blogPost.id,
      type: 'blog' as const,
      title: blogPost.title,
      description,
      image_url: imageUrl,
      category: blogPost.category
    };

    await canvaAutomation.triggerContentCreation(contentItem);
  } catch (error) {
    console.error('Failed to trigger Canva automation for blog:', error);
    // Don't throw error to avoid breaking blog creation
  }
}

/**
 * Trigger Canva automation for new video content
 */
export async function triggerCanvaForVideo(video: VideoContent): Promise<void> {
  try {
    console.log(`Refresh Triggering Canva automation for video: ${video.title}`);
    
    const thumbUrl = video.thumbnail_url ?? video.thumbnailUrl;
    const contentItem = {
      id: video.id,
      type: 'video' as const,
      title: video.title,
      description: video.description,
      image_url: thumbUrl,
      category: video.category
    };

    await canvaAutomation.triggerContentCreation(contentItem);
  } catch (error) {
    console.error('Failed to trigger Canva automation for video:', error);
    // Don't throw error to avoid breaking video creation
  }
}

/**
 * Generic trigger function for any content type
 */
export async function triggerCanvaForContent(
  contentType: 'product' | 'service' | 'blog' | 'video',
  contentData: any
): Promise<void> {
  try {
    switch (contentType) {
      case 'product':
      case 'service':
        await triggerCanvaForProduct(contentData);
        break;
      case 'blog':
        await triggerCanvaForBlog(contentData);
        break;
      case 'video':
        await triggerCanvaForVideo(contentData);
        break;
      default:
        console.warn(`Unknown content type for Canva automation: ${contentType}`);
    }
  } catch (error) {
    console.error(`Failed to trigger Canva automation for ${contentType}:`, error);
  }
}

/**
 * Middleware function to add Canva triggers to existing routes
 */
export function withCanvaTrigger<T extends (...args: any[]) => Promise<any>>(
  originalHandler: T,
  contentType: 'product' | 'service' | 'blog' | 'video'
): T {
  return (async (...args: any[]) => {
    // Execute original handler first
    const result = await originalHandler(...args);
    
    // If successful, trigger Canva automation
    if (result && result.id) {
      // Run Canva automation in background (don't await)
      triggerCanvaForContent(contentType, result).catch(error => {
        console.error(`Background Canva automation failed for ${contentType}:`, error);
      });
    }
    
    return result;
  }) as T;
}

/**
 * Hook function to be called after successful content creation
 */
export async function onContentCreated(
  contentType: 'product' | 'service' | 'blog' | 'video',
  contentId: number,
  contentData: any
): Promise<void> {
  try {
    console.log(`📢 Content created hook triggered: ${contentType} #${contentId}`);
    
    // Add ID to content data if not present
    const enrichedData = { ...contentData, id: contentId };
    
    // Trigger Canva automation
    await triggerCanvaForContent(contentType, enrichedData);
    
    console.log(`Success Canva automation triggered successfully for ${contentType} #${contentId}`);
  } catch (error) {
    console.error(`Error Failed to trigger Canva automation for ${contentType} #${contentId}:`, error);
  }
}

/**
 * Batch trigger for multiple content items
 */
export async function triggerCanvaForBatch(
  items: Array<{
    type: 'product' | 'service' | 'blog' | 'video';
    data: any;
  }>
): Promise<void> {
  console.log(`Refresh Triggering Canva automation for ${items.length} items...`);
  
  const promises = items.map(item => 
    triggerCanvaForContent(item.type, item.data)
  );
  
  try {
    await Promise.allSettled(promises);
    console.log(`Success Batch Canva automation completed for ${items.length} items`);
  } catch (error) {
    console.error('Error Batch Canva automation failed:', error);
  }
}

/**
 * Check if Canva automation should be triggered for content type
 */
export function shouldTriggerCanva(contentType: string): boolean {
  const supportedTypes = ['product', 'service', 'blog', 'video'];
  return supportedTypes.includes(contentType);
}

/**
 * Get Canva automation status for content
 */
export function getCanvaAutomationStatus(contentType: string, contentId: number): {
  supported: boolean;
  triggered: boolean;
} {
  return {
    supported: shouldTriggerCanva(contentType),
    triggered: true // This would check database in real implementation
  };
}