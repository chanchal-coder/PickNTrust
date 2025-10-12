import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
// Removed direct header import; using header widgets instead
import WidgetRenderer from '@/components/WidgetRenderer';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ScrollNavigation from '@/components/scroll-navigation';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import { Loader2, Calendar, User, Clock, Share2, Facebook, Twitter, Linkedin, Link2, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AnnouncementBanner } from "@/components/announcement-banner";
import PageBanner from '@/components/PageBanner';

interface BlogPostData {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  imageUrl: string;
  videoUrl?: string;
  pdfUrl?: string;
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

  // No hardcoded fallback; rely solely on API. If missing, show a proper not-found UI.

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
              {/* Header Top above dynamic banner */}
              <WidgetRenderer page={'blog-post'} position="header-top" />
              
              <AnnouncementBanner page="blog-post" />
              {/* Page Banner */}
              <PageBanner page="blog" />
              {/* Header Bottom below dynamic banner */}
              <WidgetRenderer page={'blog-post'} position="header-bottom" />
              
              <div className="header-spacing">
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
            </div>
    </UniversalPageLayout>
  );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'blog-post'} position="header-top" />
        
        <AnnouncementBanner page="blog-post" />
        {/* Page Banner */}
        <PageBanner page="blog" />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'blog-post'} position="header-bottom" />
        
        <div className="header-spacing">
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
      </div>
    );
  }

  // Handle missing post (e.g., 404) with a friendly not-found UI
  if (!blogPost) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'blog-post'} position="header-top" />
        <AnnouncementBanner page="blog-post" />
        {/* Page Banner */}
        <PageBanner page="blog" />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'blog-post'} position="header-bottom" />
        <div className="header-spacing">
        <div className="flex-1 flex items-center justify-center pt-20 pb-8">
          <div className="max-w-md mx-auto text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-6xl mb-4"><i className="fas fa-search-minus"></i></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">We couldn’t find this article. It may have been removed or the link is incorrect.</p>
            <a href="/blog" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">← Back to Blog</a>
          </div>
        </div>
        </div>
      </div>
    );
  }

  const postData = blogPost;

  // Main blog post page
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-slate-900 to-black">
      {/* Global Header matching Home */}
      <Header />
      {/* Header widgets */}
      <WidgetRenderer page={'blog-post'} position="header-top" />
      <AnnouncementBanner page="blog-post" />
      <WidgetRenderer page={'blog-post'} position="header-bottom" />
      
      {/* Banner Top Widgets */}
      <WidgetRenderer page={'blog-post'} position="banner-top" />
      
      {/* Main Content */}
      <div className="header-spacing">
      {/* Page Banner */}
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

          {/* Document viewer: PDF or Office docs */}
          {postData.pdfUrl && (
            <div className="mb-8">
              <div className="w-full h-[800px] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                {(() => {
                  const url = String(postData.pdfUrl);
                  const lower = url.toLowerCase();
                  const isPdf = lower.endsWith('.pdf') || lower.includes('application/pdf');
                  const isOfficeDoc = /(\.docx?$|\.xlsx?$|\.pptx?$)/i.test(url);
                  if (isPdf) {
                    const fileForViewer = (() => {
                      if (typeof window !== 'undefined') {
                        if (url.startsWith('/uploads/')) {
                          // Keep relative path so dev proxy (/uploads -> backend) works
                          return url;
                        }
                        if (url.startsWith('/')) {
                          // Make other root-relative paths absolute to current origin
                          return window.location.origin + url;
                        }
                      }
                      return url;
                    })();
                    // Use the dedicated PDF viewer (iframe) as before
                    return (
                      <iframe
                        src={`/pdf-viewer.html?file=${encodeURIComponent(fileForViewer)}`}
                        title={postData.title + ' PDF'}
                        className="w-full h-full"
                      />
                    );
                  } else if (isOfficeDoc) {
                    const officeViewer = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
                    return (
                      <iframe
                        src={officeViewer}
                        title={postData.title + ' Document'}
                        className="w-full h-full"
                      />
                    );
                  }
                  // Fallback: attempt inline iframe
                  return (
                    <iframe
                      src={url}
                      title={postData.title + ' Document'}
                      className="w-full h-full"
                    />
                  );
                })()}
              </div>
            </div>
          )}

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
                  contentType="blog"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-md transition-colors"
                  buttonText=""
                  showIcon={true}
                />
              </div>
            </div>
          </footer>
        </article>
      </main>
      </div>
      
      {/* Banner Bottom Widgets */}
      <WidgetRenderer page={'blog-post'} position="banner-bottom" />
      
      {/* Footer Widgets and Footer */}
      <WidgetRenderer page={'blog-post'} position="footer-top" />
      <WidgetRenderer page={'blog-post'} position="footer-bottom" />
      <Footer />
      {/* Fixed Elements */}
      <ScrollNavigation />
    </div>
  );
}
