import fs from 'fs';
import path from 'path';
import { storage } from './storage.js';

interface TemplateMetadata {
  id: string;
  filename: string;
  type: 'image' | 'video' | 'gif';
  characteristics: {
    dominantColors: string[];
    mood: string[];
    suitableFor: string[];
    priceRange: string[];
    style: string;
  };
  compatibility: Record<string, number>;
}

interface AudioMetadata {
  id: string;
  filename: string;
  duration: number;
  characteristics: {
    genre: string;
    mood: string[];
    tempo: string;
    energy: string;
    suitableFor: string[];
  };
  compatibility: Record<string, number>;
}

interface ProductAnalysis {
  category: string;
  colors: string[];
  mood: string[];
  priceRange: string;
  timeContext: string;
  brandStyle: string;
}

interface UsageRecord {
  templateId: string;
  audioId?: string;
  contentId: number;
  timestamp: number;
  category: string;
  performance?: {
    engagement: number;
    clicks: number;
  };
}

export class BackendTemplateEngine {
  private templatesMetadata: TemplateMetadata[] = [];
  private audioMetadata: AudioMetadata[] = [];
  private usageHistory: UsageRecord[] = [];
  private assetsPath = path.join(process.cwd(), 'backend-assets');
  
  constructor() {
    this.loadMetadata();
  }

  private async loadMetadata() {
    try {
      // Load templates metadata
      const templatesPath = path.join(this.assetsPath, 'metadata', 'templates.json');
      if (fs.existsSync(templatesPath)) {
        const templatesData = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        this.templatesMetadata = templatesData.templates || [];
        this.usageHistory = templatesData.usage_history || [];
      }

      // Load audio metadata
      const audioPath = path.join(this.assetsPath, 'metadata', 'audio.json');
      if (fs.existsSync(audioPath)) {
        const audioData = JSON.parse(fs.readFileSync(audioPath, 'utf8'));
        this.audioMetadata = audioData.music || [];
      }

      console.log(`✅ Loaded ${this.templatesMetadata.length} templates and ${this.audioMetadata.length} audio files`);
    } catch (error) {
      console.error('❌ Error loading template metadata:', error);
    }
  }

  async generateContent(productData: any, contentType: 'image' | 'video' = 'image'): Promise<string> {
    try {
      console.log(`🎨 Generating ${contentType} content for: ${productData.name}`);
      
      // 1. Analyze product characteristics
      const analysis = this.analyzeProduct(productData);
      console.log(`📊 Product analysis:`, analysis);
      
      // 2. Select best template
      const selectedTemplate = await this.selectBestTemplate(analysis, contentType, productData.id);
      if (!selectedTemplate) {
        throw new Error('No suitable template found');
      }
      console.log(`🖼️ Selected template: ${selectedTemplate.filename}`);
      
      // 3. Select matching audio (for video content)
      let selectedAudio = null;
      if (contentType === 'video') {
        selectedAudio = await this.selectBestAudio(analysis, selectedTemplate);
        console.log(`🎵 Selected audio: ${selectedAudio?.filename || 'none'}`);
      }
      
      // 4. Generate final content
      const contentUrl = await this.createFinalContent({
        template: selectedTemplate,
        audio: selectedAudio,
        productData,
        analysis,
        contentType
      });
      
      // 5. Record usage for rotation and learning
      this.recordUsage({
        templateId: selectedTemplate.id,
        audioId: selectedAudio?.id,
        contentId: productData.id,
        timestamp: Date.now(),
        category: analysis.category
      });
      
      console.log(`✅ Generated content: ${contentUrl}`);
      return contentUrl;
      
    } catch (error) {
      console.error('❌ Error generating content:', error);
      throw error;
    }
  }

  private analyzeProduct(productData: any): ProductAnalysis {
    // Extract category from product data
    const category = this.detectCategory(productData);
    
    // Analyze colors from product image (simplified)
    const colors = this.extractColors(productData.imageUrl);
    
    // Detect mood from description
    const mood = this.analyzeMood(productData.description || productData.name);
    
    // Classify price range
    const priceRange = this.classifyPriceRange(productData.price);
    
    // Get time context
    const timeContext = this.getTimeContext();
    
    // Detect brand style
    const brandStyle = this.detectBrandStyle(productData.name);
    
    return {
      category,
      colors,
      mood,
      priceRange,
      timeContext,
      brandStyle
    };
  }

  private detectCategory(productData: any): string {
    const text = `${productData.name} ${productData.description || ''} ${productData.category || ''}`.toLowerCase();
    
    // Category keywords mapping
    const categoryKeywords = {
      electronics: ['phone', 'laptop', 'computer', 'gadget', 'tech', 'electronic', 'device', 'smart', 'digital'],
      fashion: ['dress', 'shirt', 'shoes', 'clothing', 'fashion', 'style', 'wear', 'apparel', 'outfit'],
      food: ['food', 'snack', 'drink', 'cooking', 'kitchen', 'recipe', 'meal', 'restaurant', 'eat'],
      travel: ['travel', 'trip', 'vacation', 'hotel', 'flight', 'tour', 'adventure', 'explore', 'journey'],
      beauty: ['beauty', 'makeup', 'skincare', 'cosmetic', 'hair', 'nail', 'perfume', 'fragrance'],
      home: ['home', 'furniture', 'decor', 'kitchen', 'bedroom', 'living', 'house', 'interior'],
      sports: ['sport', 'fitness', 'gym', 'exercise', 'outdoor', 'athletic', 'training', 'workout']
    };
    
    let bestMatch = 'general';
    let maxScore = 0;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (text.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    }
    
    return bestMatch;
  }

  private extractColors(imageUrl?: string): string[] {
    // Simplified color extraction - in real implementation, you'd analyze the image
    // For now, return common colors based on category hints
    if (!imageUrl) return ['blue', 'white'];
    
    // This would be replaced with actual image analysis
    return ['blue', 'white', 'gray'];
  }

  private analyzeMood(text: string): string[] {
    const moodKeywords = {
      professional: ['business', 'professional', 'corporate', 'office', 'work'],
      luxury: ['luxury', 'premium', 'exclusive', 'high-end', 'elegant'],
      casual: ['casual', 'everyday', 'comfortable', 'relaxed', 'simple'],
      energetic: ['energy', 'power', 'fast', 'dynamic', 'active'],
      calm: ['calm', 'peaceful', 'quiet', 'gentle', 'soft']
    };
    
    const detectedMoods: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedMoods.push(mood);
      }
    }
    
    return detectedMoods.length > 0 ? detectedMoods : ['modern'];
  }

  private classifyPriceRange(price?: string): string {
    if (!price) return 'mid';
    
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    
    if (numPrice < 50) return 'low';
    if (numPrice < 200) return 'mid';
    return 'high';
  }

  private getTimeContext(): string {
    const hour = new Date().getHours();
    
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private detectBrandStyle(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('apple') || lowerName.includes('samsung')) return 'tech';
    if (lowerName.includes('nike') || lowerName.includes('adidas')) return 'sports';
    if (lowerName.includes('gucci') || lowerName.includes('prada')) return 'luxury';
    
    return 'general';
  }

  private async selectBestTemplate(analysis: ProductAnalysis, contentType: string, contentId: number): Promise<TemplateMetadata | null> {
    // Filter templates by type
    let availableTemplates = this.templatesMetadata.filter(template => {
      if (contentType === 'video') {
        return template.type === 'video' || template.type === 'gif';
      }
      return template.type === 'image';
    });
    
    if (availableTemplates.length === 0) {
      // Fallback to any template if no specific type found
      availableTemplates = this.templatesMetadata;
    }
    
    // Calculate compatibility scores
    const scoredTemplates = availableTemplates.map(template => ({
      ...template,
      score: this.calculateCompatibilityScore(analysis, template)
    }));
    
    // Apply rotation logic to avoid repetition
    const rotatedTemplates = this.applyRotationLogic(scoredTemplates, contentId);
    
    // Select best available template
    const sortedTemplates = rotatedTemplates.sort((a, b) => b.score - a.score);
    
    return sortedTemplates.length > 0 ? sortedTemplates[0] : null;
  }

  private calculateCompatibilityScore(analysis: ProductAnalysis, template: TemplateMetadata): number {
    let score = 0;
    
    // Category compatibility (40% weight)
    const categoryScore = template.compatibility[analysis.category] || 0;
    score += categoryScore * 0.4;
    
    // Color harmony (25% weight)
    const colorScore = this.calculateColorHarmony(analysis.colors, template.characteristics.dominantColors);
    score += colorScore * 0.25;
    
    // Mood matching (20% weight)
    const moodScore = this.calculateMoodMatch(analysis.mood, template.characteristics.mood);
    score += moodScore * 0.2;
    
    // Price range appropriateness (15% weight)
    const priceScore = template.characteristics.priceRange.includes(analysis.priceRange) ? 1 : 0.5;
    score += priceScore * 0.15;
    
    return Math.min(score, 1); // Cap at 1.0
  }

  private calculateColorHarmony(productColors: string[], templateColors: string[]): number {
    if (productColors.length === 0 || templateColors.length === 0) return 0.5;
    
    const matches = productColors.filter(color => templateColors.includes(color)).length;
    return matches / Math.max(productColors.length, templateColors.length);
  }

  private calculateMoodMatch(productMoods: string[], templateMoods: string[]): number {
    if (productMoods.length === 0 || templateMoods.length === 0) return 0.5;
    
    const matches = productMoods.filter(mood => templateMoods.includes(mood)).length;
    return matches / Math.max(productMoods.length, templateMoods.length);
  }

  private applyRotationLogic(templates: any[], contentId: number): any[] {
    const rotationWindow = 10;
    const recentUsage = this.usageHistory
      .slice(-rotationWindow)
      .map(usage => usage.templateId);
    
    // Filter out recently used templates
    const availableTemplates = templates.filter(template => 
      !recentUsage.includes(template.id)
    );
    
    // If all templates were used recently, reset and use all
    if (availableTemplates.length === 0) {
      console.log('🔄 All templates used recently, resetting rotation');
      return templates;
    }
    
    return availableTemplates;
  }

  private async selectBestAudio(analysis: ProductAnalysis, template: TemplateMetadata): Promise<AudioMetadata | null> {
    if (this.audioMetadata.length === 0) return null;
    
    // Calculate compatibility scores for audio
    const scoredAudio = this.audioMetadata.map(audio => ({
      ...audio,
      score: this.calculateAudioCompatibilityScore(analysis, template, audio)
    }));
    
    // Apply rotation for audio
    const rotationWindow = 8;
    const recentAudioUsage = this.usageHistory
      .slice(-rotationWindow)
      .map(usage => usage.audioId)
      .filter(Boolean);
    
    const availableAudio = scoredAudio.filter(audio => 
      !recentAudioUsage.includes(audio.id)
    );
    
    const finalAudio = availableAudio.length > 0 ? availableAudio : scoredAudio;
    const sortedAudio = finalAudio.sort((a, b) => b.score - a.score);
    
    return sortedAudio.length > 0 ? sortedAudio[0] : null;
  }

  private calculateAudioCompatibilityScore(analysis: ProductAnalysis, template: TemplateMetadata, audio: AudioMetadata): number {
    let score = 0;
    
    // Category compatibility (50% weight)
    const categoryScore = audio.compatibility[analysis.category] || 0;
    score += categoryScore * 0.5;
    
    // Mood matching (30% weight)
    const moodScore = this.calculateMoodMatch(analysis.mood, audio.characteristics.mood);
    score += moodScore * 0.3;
    
    // Template style harmony (20% weight)
    const styleScore = this.calculateStyleHarmony(template.characteristics.style, audio.characteristics.genre);
    score += styleScore * 0.2;
    
    return Math.min(score, 1);
  }

  private calculateStyleHarmony(templateStyle: string, audioGenre: string): number {
    const harmonyMap: Record<string, string[]> = {
      minimalist: ['ambient', 'electronic'],
      elegant: ['classical', 'jazz'],
      warm: ['jazz', 'acoustic'],
      natural: ['acoustic', 'ambient'],
      gradient: ['pop', 'electronic']
    };
    
    const compatibleGenres = harmonyMap[templateStyle] || [];
    return compatibleGenres.includes(audioGenre) ? 1 : 0.5;
  }

  private async createFinalContent(params: {
    template: TemplateMetadata;
    audio: AudioMetadata | null;
    productData: any;
    analysis: ProductAnalysis;
    contentType: string;
  }): Promise<string> {
    const { template, audio, productData, contentType } = params;
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = contentType === 'video' ? 'mp4' : 'png';
    const filename = `generated-${productData.id}-${timestamp}.${extension}`;
    const outputPath = path.join(process.cwd(), 'public', 'generated-content', filename);
    
    try {
      if (contentType === 'video') {
        // Create video content with template + audio
        await this.createVideoContent({
          templatePath: path.join(this.assetsPath, 'templates', 'universal', template.filename),
          audioPath: audio ? path.join(this.assetsPath, 'audio', 'universal', audio.filename) : null,
          productData,
          outputPath
        });
      } else {
        // Create image content with template
        await this.createImageContent({
          templatePath: path.join(this.assetsPath, 'templates', 'universal', template.filename),
          productData,
          outputPath
        });
      }
      
      // Return public URL
      return `/generated-content/${filename}`;
      
    } catch (error) {
      console.error('❌ Error creating final content:', error);
      // Fallback to original product image
      return productData.imageUrl || '/placeholder-image.png';
    }
  }

  private async createVideoContent(params: {
    templatePath: string;
    audioPath: string | null;
    productData: any;
    outputPath: string;
  }): Promise<void> {
    // Simplified video creation - in real implementation, use FFmpeg or similar
    console.log('🎬 Creating video content:', params);
    
    // For now, copy template as placeholder
    // In real implementation, overlay product image, add text, combine with audio
    if (fs.existsSync(params.templatePath)) {
      fs.copyFileSync(params.templatePath, params.outputPath);
    }
  }

  private async createImageContent(params: {
    templatePath: string;
    productData: any;
    outputPath: string;
  }): Promise<void> {
    // Simplified image creation - in real implementation, use Sharp or Canvas
    console.log('🖼️ Creating image content:', params);
    
    // For now, copy template as placeholder
    // In real implementation, overlay product image, add text, apply effects
    if (fs.existsSync(params.templatePath)) {
      fs.copyFileSync(params.templatePath, params.outputPath);
    }
  }

  private recordUsage(usage: UsageRecord): void {
    this.usageHistory.push(usage);
    
    // Keep only recent history (last 100 records)
    if (this.usageHistory.length > 100) {
      this.usageHistory = this.usageHistory.slice(-100);
    }
    
    // Save to file
    this.saveUsageHistory();
  }

  private saveUsageHistory(): void {
    try {
      const templatesPath = path.join(this.assetsPath, 'metadata', 'templates.json');
      if (fs.existsSync(templatesPath)) {
        const data = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        data.usage_history = this.usageHistory;
        fs.writeFileSync(templatesPath, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('❌ Error saving usage history:', error);
    }
  }

  // Public method to track performance for learning
  trackPerformance(contentId: number, metrics: { engagement: number; clicks: number }): void {
    const usage = this.usageHistory.find(u => u.contentId === contentId);
    if (usage) {
      usage.performance = metrics;
      this.saveUsageHistory();
      console.log(`📊 Performance tracked for content ${contentId}:`, metrics);
    }
  }

  // Get template statistics
  getTemplateStats(): any {
    const stats = {
      totalTemplates: this.templatesMetadata.length,
      totalAudio: this.audioMetadata.length,
      totalUsage: this.usageHistory.length,
      categoryDistribution: {} as Record<string, number>,
      topPerformingTemplates: [] as any[]
    };
    
    // Calculate category distribution
    this.usageHistory.forEach(usage => {
      stats.categoryDistribution[usage.category] = (stats.categoryDistribution[usage.category] || 0) + 1;
    });
    
    // Find top performing templates
    const templatePerformance = new Map<string, { usage: number; avgEngagement: number }>();
    
    this.usageHistory.forEach(usage => {
      if (!templatePerformance.has(usage.templateId)) {
        templatePerformance.set(usage.templateId, { usage: 0, avgEngagement: 0 });
      }
      
      const perf = templatePerformance.get(usage.templateId)!;
      perf.usage++;
      
      if (usage.performance) {
        perf.avgEngagement = (perf.avgEngagement + usage.performance.engagement) / 2;
      }
    });
    
    stats.topPerformingTemplates = Array.from(templatePerformance.entries())
      .map(([id, perf]) => ({ templateId: id, ...perf }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);
    
    return stats;
  }
}

// Export singleton instance
export const backendTemplateEngine = new BackendTemplateEngine();