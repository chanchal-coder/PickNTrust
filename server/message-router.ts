/**
 * Intelligent Message Router for Prime Picks and CueLinks
 * Routes messages to appropriate bot systems based on URL type and platform
 */

import { UniversalUrlDetector, DetectedUrl } from './url-detector';

export interface MessageRoutingDecision {
  shouldProcessPrimePicks: boolean;
  shouldProcessCueLinks: boolean;
  shouldProcessClickPicks: boolean;
  detectedUrl: DetectedUrl | null;
  reason: string;
}

export class MessageRouter {
  
  /**
   * Analyze message and decide which bot systems should process it
   */
  static async analyzeMessage(text: string, channelId: string): Promise<MessageRoutingDecision> {
    const detectedUrl = await UniversalUrlDetector.detectAnyUrl(text);
    
    if (!detectedUrl) {
      return {
        shouldProcessPrimePicks: false,
        shouldProcessCueLinks: false,
        shouldProcessClickPicks: false,
        detectedUrl: null,
        reason: 'No e-commerce URL detected in message'
      };
    }
    
    // Determine which systems should process this URL
    const targetSystem = UniversalUrlDetector.getTargetSystem(detectedUrl);
    
    switch (targetSystem) {
      case 'prime-picks':
        return {
          shouldProcessPrimePicks: true,
          shouldProcessCueLinks: false,
          shouldProcessClickPicks: false,
          detectedUrl,
          reason: `Amazon URL detected - routing to Prime Picks only`
        };
        
      case 'cue-picks':
        return {
          shouldProcessPrimePicks: false,
          shouldProcessCueLinks: true,
          shouldProcessClickPicks: false,
          detectedUrl,
          reason: `${detectedUrl.platform} URL detected - routing to CueLinks only`
        };
        
      case 'click-picks':
        return {
          shouldProcessPrimePicks: false,
          shouldProcessCueLinks: false,
          shouldProcessClickPicks: true,
          detectedUrl,
          reason: `Trending URL detected - routing to Click Picks only`
        };
        
      case 'both':
        // For Amazon URLs, decide based on channel and URL type
        return this.handleAmazonUrl(detectedUrl, channelId);
        
      default:
        return {
          shouldProcessPrimePicks: false,
          shouldProcessCueLinks: true,
          shouldProcessClickPicks: false,
          detectedUrl,
          reason: `Unknown platform - defaulting to CueLinks`
        };
    }
  }
  
  /**
   * Handle Amazon URLs that could go to either system
   */
  private static handleAmazonUrl(detectedUrl: DetectedUrl, channelId: string): MessageRoutingDecision {
    const isPrimePicksChannel = this.isPrimePicksChannel(channelId);
    const isCueLinksChannel = this.isCueLinksChannel(channelId);
    
    // If it's a CueLinks affiliate URL, always route to CueLinks
    if (detectedUrl.type === 'affiliate' && detectedUrl.url.includes('clnk.in')) {
      return {
        shouldProcessPrimePicks: false,
        shouldProcessCueLinks: true,
        shouldProcessClickPicks: false,
        detectedUrl,
        reason: 'CueLinks affiliate URL - routing to CueLinks system'
      };
    }
    
    // If it's an Amazon affiliate URL with existing tag, route to Prime Picks
    if (detectedUrl.type === 'affiliate' && detectedUrl.url.includes('tag=')) {
      return {
        shouldProcessPrimePicks: true,
        shouldProcessCueLinks: false,
        shouldProcessClickPicks: false,
        detectedUrl,
        reason: 'Amazon affiliate URL - routing to Prime Picks system'
      };
    }
    
    // Route based on channel
    if (isPrimePicksChannel && !isCueLinksChannel) {
      return {
        shouldProcessPrimePicks: true,
        shouldProcessCueLinks: false,
        shouldProcessClickPicks: false,
        detectedUrl,
        reason: 'Amazon URL in Prime Picks channel - routing to Prime Picks'
      };
    }
    
    if (isCueLinksChannel && !isPrimePicksChannel) {
      return {
        shouldProcessPrimePicks: false,
        shouldProcessCueLinks: true,
        shouldProcessClickPicks: false,
        detectedUrl,
        reason: 'Amazon URL in CueLinks channel - routing to CueLinks'
      };
    }
    
    // Default: route to both systems for maximum coverage
    return {
      shouldProcessPrimePicks: true,
      shouldProcessCueLinks: true,
      shouldProcessClickPicks: false,
      detectedUrl,
      reason: 'Amazon URL - routing to both systems for maximum coverage'
    };
  }
  
  /**
   * Check if channel is configured for Prime Picks
   */
  private static isPrimePicksChannel(channelId: string): boolean {
    const primePicksChannelId = process.env.PRIME_PICKS_CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID;
    return channelId === primePicksChannelId;
  }
  
  /**
   * Check if channel is configured for CueLinks
   */
  private static isCueLinksChannel(channelId: string): boolean {
    const cueLinksChannelId = process.env.CUE_PICKS_CHANNEL_ID;
    return channelId === cueLinksChannelId;
  }
  
  /**
   * Get processing priority for URL type
   */
  static getProcessingPriority(detectedUrl: DetectedUrl): 'high' | 'medium' | 'low' {
    // CueLinks affiliate URLs get high priority
    if (detectedUrl.type === 'affiliate' && detectedUrl.platform === 'cuelinks') {
      return 'high';
    }
    
    // Amazon URLs get high priority
    if (detectedUrl.platform === 'amazon') {
      return 'high';
    }
    
    // Other major platforms get medium priority
    if (['flipkart', 'myntra', 'nykaa', 'ajio'].includes(detectedUrl.platform)) {
      return 'medium';
    }
    
    // Everything else gets low priority
    return 'low';
  }
  
  /**
   * Log routing decision for debugging
   */
  static logRoutingDecision(decision: MessageRoutingDecision, messageId: number): void {
    console.log(`Target Message ${messageId} routing decision:`);
    console.log(`   Prime Picks: ${decision.shouldProcessPrimePicks ? 'Success' : 'Error'}`);
    console.log(`   CueLinks: ${decision.shouldProcessCueLinks ? 'Success' : 'Error'}`);
    console.log(`   Reason: ${decision.reason}`);
    
    if (decision.detectedUrl) {
      console.log(`   URL: ${decision.detectedUrl.platform} (${decision.detectedUrl.type})`);
      console.log(`   Priority: ${this.getProcessingPriority(decision.detectedUrl)}`);
    }
  }
  
  /**
   * Validate routing decision
   */
  static validateRoutingDecision(decision: MessageRoutingDecision): boolean {
    // At least one system should process if URL is detected
    if (decision.detectedUrl) {
      return decision.shouldProcessPrimePicks || decision.shouldProcessCueLinks;
    }
    
    // If no URL detected, no processing is expected
    return !decision.shouldProcessPrimePicks && !decision.shouldProcessCueLinks;
  }
}

// Export for backward compatibility
export { MessageRouter as Router };