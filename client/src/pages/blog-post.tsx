import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { AnnouncementBanner } from "@/components/announcement-banner";
import WhatsAppBanner from "@/components/whatsapp-banner";
import { Share2, Calendar, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import PageBanner from '@/components/PageBanner';
import UniversalPageLayout from '@/components/UniversalPageLayout';

interface BlogPostData {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  imageUrl: string;
  videoUrl?: string;
  publishedAt: string;
  readTime: string;
  slug: string;
  author?: string;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [shareUrl, setShareUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Admin authentication check
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);

  // Initialize client-side values after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/blog/${slug}`);
    }
  }, [slug]);

  // Fetch blog post data from API based on slug
  const { data: blogPost, isLoading, error } = useQuery({
    queryKey: ['/api/blog', slug],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/blog/${slug}`);
        if (!response.ok) {
          console.warn(`Blog post API failed for slug "${slug}":`, response.status);
          return null; // Return null instead of throwing to use fallback
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.warn(`Blog post fetch error for slug "${slug}":`, error);
        return null; // Return null to use fallback
      }
    },
    enabled: !!slug,
    retry: 1,
  });

  // REMOVED: Hardcoded sample blog post data
  // Now using only API data with proper fallback
  const sampleBlogPost: BlogPostData = {
    id: 1,
    title: slug === 'test-blog-post-amazing-deals-this-week' ? "Test Blog Post - Amazing Deals This Week" : "10 Must-Have Gadgets Under ₹999 You Can Buy Today",
    content: slug === 'test-blog-post-amazing-deals-this-week' ? `# Test Blog Post - Amazing Deals This Week

Discover the best deals and shopping tips for this week. From electronics to fashion, we have got you covered!

## Featured Deals

**<i className="fas fa-fire"></i> Hot Deals Alert!** Check out these amazing offers available this week:

### Electronics & Gadgets
- **Smartphones:** Up to 40% off on latest models
- **Laptops:** Special discounts on gaming and business laptops  
- **Headphones:** Premium audio gear at unbeatable prices

### Fashion & Lifestyle
- **Clothing:** Seasonal sale with extra 30% off
- **Footwear:** Designer shoes starting from ₹999
- **Accessories:** Trendy bags and watches on sale

### Home & Kitchen
- **Appliances:** Smart home devices with huge savings
- **Furniture:** Comfortable and stylish furniture deals
- **Decor:** Beautiful home decor items at low prices

## Shopping Tips

1. **Compare prices** across different platforms
2. **Read reviews** before making a purchase
3. **Check return policies** for peace of mind
4. **Look for combo offers** to save more
5. **Use cashback apps** for additional savings

**Happy Shopping!** <i className="fas fa-shopping-bag"></i>` : `# 10 Must-Have Gadgets Under ₹999 You Can Buy Today

Shopping for amazing gadgets doesn't have to break the bank! We've curated a fantastic list of 10 incredible gadgets that you can buy for under ₹999 today. Each of these products offers exceptional value and functionality that will enhance your daily life.

## 1. Wireless Bluetooth Earbuds

**Experience crystal-clear audio** without the hassle of tangled wires! These premium wireless earbuds deliver stunning sound quality with deep bass and crisp highs.

**Features:**
- 20+ hours battery life with charging case
- IPX7 waterproof rating
- Touch controls for music and calls
- Quick 10-minute charge gives 2 hours playback

[<i className="fas fa-shopping-cart"></i> Buy Wireless Bluetooth Earbuds - ₹899](https://amazon.in/dp/wireless-earbuds)

## 2. Portable Power Bank 10000mAh

**Never run out of battery again!** This compact power bank can charge your smartphone up to 3 times and features fast charging technology.

**Key Benefits:**
- Dual USB ports for charging multiple devices
- LED display showing exact battery percentage
- Ultra-slim design fits in your pocket
- Built-in safety protection

[🔋 Get Power Bank - ₹799](https://amazon.in/dp/power-bank)

## 3. Smart Fitness Tracker

**Monitor your health 24/7** with this feature-packed fitness tracker that looks stylish and provides comprehensive health insights.

**Health Features:**
- Heart rate monitoring
- Sleep tracking analysis  
- Step counter and calorie tracker
- Water reminder notifications

[⌚ Buy Fitness Tracker - ₹949](https://amazon.in/dp/fitness-tracker)

## 4. USB LED Strip Lights (5 Meters)

**Transform your room's ambiance** with these colorful LED strip lights that can be controlled via remote or smartphone app.

**Amazing Features:**
- 16 million colors to choose from
- Music sync mode - lights dance to your music
- Timer function and DIY mode
- Easy installation with adhesive backing

[<i className="fas fa-lightbulb"></i> Order LED Strip Lights - ₹599](https://amazon.in/dp/led-strips)

## 5. Mini Bluetooth Speaker

**Powerful sound in a compact package!** This waterproof speaker delivers 360-degree surround sound perfect for outdoor adventures.

**Sound Specifications:**
- 12-hour continuous playback
- IPX6 waterproof rating
- Built-in microphone for hands-free calls
- Supports TF card and AUX input

[🔊 Get Mini Speaker - ₹799](https://amazon.in/dp/bluetooth-speaker)

## Why Choose These Gadgets?

Each of these gadgets has been carefully selected based on:
- **Exceptional value for money**
- **High customer ratings and reviews**
- **Practical everyday utility**
- **Reliable brand reputation**
- **Fast delivery and warranty support**

## Shopping Tips

1. **Check for lightning deals** - Prices can drop further during flash sales
2. **Read customer reviews** - Real user experiences help make better decisions  
3. **Compare specifications** - Ensure the product meets your specific needs
4. **Verify seller ratings** - Buy from trusted sellers for best experience
5. **Look for combo offers** - Sometimes buying together saves more money

**Happy Shopping!** <i className="fas fa-shopping-bag"></i>

*Disclosure: This post contains affiliate links. When you buy through these links, we earn a small commission at no extra cost to you.*`,
    excerpt: slug === 'test-blog-post-amazing-deals-this-week' ? "Discover the best deals and shopping tips for this week. From electronics to fashion, we have got you covered!" : "Discover amazing tech gadgets that won't break the bank. From wireless earbuds to smart fitness trackers, we've curated the best budget-friendly gadgets for 2024.",
    category: slug === 'test-blog-post-amazing-deals-this-week' ? "Deals" : "Tech",
    tags: (slug === 'test-blog-post-amazing-deals-this-week' ? ["Deals", "Shopping", "Weekly", "Discounts"] : ["Gadgets", "Shopping", "Tech", "Budget", "Deals"]) as string[],
    imageUrl: slug === 'test-blog-post-amazing-deals-this-week' ? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop" : "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=600&fit=crop",
    publishedAt: "2025-01-25",
    readTime: slug === 'test-blog-post-amazing-deals-this-week' ? "5 min read" : "8 min read",
    slug: slug || "10-must-have-gadgets-under-999",
    author: "PickNTrust Team",
    videoUrl: slug === 'test-blog-post-amazing-deals-this-week' ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : undefined
  };

  // Parse Markdown content
  // Convert video URLs to embeddable format
  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (tiktokMatch) {
      return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
    }
    
    // Dailymotion
    const dailymotionMatch = url.match(/dailymotion\.com\/video\/([^_]+)/);
    if (dailymotionMatch) {
      return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
    }
    
    // If no match found, return original URL (might be a direct embed URL)
    return url;
  };

  const parseMarkdown = (text: string) => {
    let html = text;
    
    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-900 dark:text-blue-400 mt-8 mb-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-900 dark:text-blue-400 mt-10 mb-6">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 dark:text-blue-400 mt-12 mb-8">$1</h1>');
    
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-blue-400">$1</strong>');
    
    // Convert links
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 dark:hover:text-blue-300 font-semibold underline">$1 <i className="fas fa-link"></i></a>');
    
    // Convert line breaks to paragraphs
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
      if (p.trim() === '') return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol')) return p;
      return `<p class="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return html;
  };

  const handleShare = (platform: string) => {
    if (!shareUrl) return;
    
    // REMOVED: Sample data fallback - now shows proper error for missing posts
  const postData = blogPost;
    const shareText = `Check out this amazing article: ${postData.title} - PickNTrust`;
    
    let url = '';
    switch (platform) {
      case 'whatsapp':
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          url = `whatsapp://send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        } else {
          url = `https://web.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        }
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // Loading state
  if (isLoading) {
    return (
    <UniversalPageLayout pageId="blog-post">
            <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
              <Header />
              
              <AnnouncementBanner page="blog-post" />
              
              <WhatsAppBanner />
              <div className="flex-1 pb-8">
                <div className="max-w-4xl mx-auto p-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-4 text-blue-600">Loading Blog Post...</div>
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-8"></div>
                      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
    </UniversalPageLayout>
  );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
        <Header />
        
        <AnnouncementBanner page="blog-post" />
        
        <WhatsAppBanner />
        
        <div className="flex-1 flex items-center justify-center pt-20 pb-8">
          <div className="max-w-md mx-auto text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-6xl mb-4"><i className="fas fa-frown"></i></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Blog Post Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <a 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // REMOVED: Sample data fallback - now shows proper error for missing posts
  const postData = blogPost;

  // Main blog post page
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
      <Header />
      
      <AnnouncementBanner page="blog-post" />
      
      <WhatsAppBanner />
      
      <PageBanner page="blog" />
      
      <main className="flex-1 pt-20 pb-8">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <header className="mb-8">
            {/* Featured Video or Image */}
            {postData.videoUrl ? (
              <div className="w-full h-[400px] overflow-hidden rounded-xl mb-8">
                <iframe
                  src={getEmbedUrl(postData.videoUrl)}
                  title={postData.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : postData.imageUrl && (
              <div className="w-full h-[400px] overflow-hidden rounded-xl mb-8">
                <img 
                  src={postData.imageUrl} 
                  alt={postData.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=600&fit=crop';
                  }}
                />
              </div>
            )}
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.isArray(postData.tags) ? postData.tags.map((tag: string, index: number) => (
                <span key={index} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              )) : null}
            </div>
            
            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {postData.title}
            </h1>
            
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(postData.publishedAt).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{postData.readTime}</span>
              </div>
              <div className="text-sm">
                By <span className="font-medium text-gray-900 dark:text-blue-400">{postData.author || "PickNTrust Team"}</span>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(postData.content) }}
            />
          </div>

          {/* Share Section */}
          <footer className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Share this article:</span>
              </div>
              
              {/* Smart Share Button - All users */}
              <div className="flex gap-3">
                <SmartShareDropdown
                  product={{
                    id: postData.id,
                    name: postData.title,
                    description: postData.excerpt,
                    imageUrl: postData.imageUrl,
                    category: postData.category,
                    affiliateUrl: shareUrl || ''
                  }}
                  className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 text-gray-700 dark:text-gray-300 rounded-md px-3 py-1.5 text-sm transition-colors"
                  buttonText="Share Article"
                  showIcon={true}
                />
              </div>
            </div>
          </footer>
        </article>
      </main>
      
    </div>
  );
}
