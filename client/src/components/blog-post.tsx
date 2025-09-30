import { useState, useEffect } from 'react';
import { Share2, Calendar, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Simple HTML sanitizer to prevent XSS
const sanitizeHtml = (html: string): string => {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove script tags and event handlers
  const scripts = temp.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove dangerous attributes
  const allElements = temp.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove event handler attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.name === 'javascript:') {
        element.removeAttribute(attr.name);
      }
    });
    
    // Only allow safe attributes for links
    if (element.tagName === 'A') {
      const allowedAttrs = ['href', 'target', 'rel', 'style', 'class'];
      Array.from(element.attributes).forEach(attr => {
        if (!allowedAttrs.includes(attr.name)) {
          element.removeAttribute(attr.name);
        }
      });
    }
  });
  
  return temp.innerHTML;
};

interface BlogPostProps {
  title: string;
  content: string;
  publishDate: string;
  readTime: string;
  featuredImage?: string;
  videoUrl?: string;
  tags: string[];
  author?: string;
  slug: string;
}

export default function BlogPost({ 
  title, 
  content, 
  publishDate, 
  readTime, 
  featuredImage, 
  videoUrl,
  tags, 
  author = "PickNTrust Team",
  slug 
}: BlogPostProps) {
  const [isSticky, setIsSticky] = useState(false);
  const [shareSticky, setShareSticky] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [currentHostname, setCurrentHostname] = useState('');

  // Initialize client-side values after mount to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/blog/${slug}`);
      setCurrentHostname(window.location.hostname);
    }
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      try {
        const scrollTop = window.scrollY || 0;
        const titleHeight = 200;
        const documentHeight = document.documentElement?.scrollHeight || 0;
        const windowHeight = window.innerHeight || 0;
        const contentHeight = Math.max(0, documentHeight - windowHeight);
        
        setIsSticky(scrollTop > titleHeight);
        setShareSticky(scrollTop > contentHeight * 0.3);
      } catch (error) {
        console.warn('Scroll handler error:', error);
      }
    };

    // Initial call to set correct state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced function to extract video info from various platforms
  const getVideoInfo = (url: string) => {
    if (!url || url.trim() === '') return null;

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return {
        platform: 'youtube',
        id: youtubeMatch[1],
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
      };
    }

    // Instagram
    const instagramRegex = /(?:instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+))/;
    const instagramMatch = url.match(instagramRegex);
    if (instagramMatch) {
      return {
        platform: 'instagram',
        id: instagramMatch[1],
        embedUrl: `https://www.instagram.com/p/${instagramMatch[1]}/embed/`,
        thumbnailUrl: undefined
      };
    }

    // TikTok
    const tiktokRegex = /(?:tiktok\.com\/@[^\/]+\/video\/(\d+)|vm\.tiktok\.com\/([A-Za-z0-9]+))/;
    const tiktokMatch = url.match(tiktokRegex);
    if (tiktokMatch) {
      const videoId = tiktokMatch[1] || tiktokMatch[2];
      return {
        platform: 'tiktok',
        id: videoId,
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
        thumbnailUrl: undefined
      };
    }

    // Facebook
    const facebookRegex = /(?:facebook\.com\/(?:watch\/\?v=|.*\/videos\/)(\d+))/;
    const facebookMatch = url.match(facebookRegex);
    if (facebookMatch) {
      return {
        platform: 'facebook',
        id: facebookMatch[1],
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`,
        thumbnailUrl: undefined
      };
    }

    // Twitter/X
    const twitterRegex = /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;
    const twitterMatch = url.match(twitterRegex);
    if (twitterMatch) {
      return {
        platform: 'twitter',
        id: twitterMatch[1],
        embedUrl: undefined,
        thumbnailUrl: undefined
      };
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return {
        platform: 'vimeo',
        id: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        thumbnailUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`
      };
    }

    // Dailymotion
    const dailymotionRegex = /(?:dailymotion\.com\/video\/)([A-Za-z0-9]+)/;
    const dailymotionMatch = url.match(dailymotionRegex);
    if (dailymotionMatch) {
      return {
        platform: 'dailymotion',
        id: dailymotionMatch[1],
        embedUrl: `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`,
        thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${dailymotionMatch[1]}`
      };
    }

    // Twitch
    const twitchRegex = /(?:twitch\.tv\/videos\/(\d+)|clips\.twitch\.tv\/([A-Za-z0-9_-]+))/;
    const twitchMatch = url.match(twitchRegex);
    if (twitchMatch) {
      const videoId = twitchMatch[1];
      const clipId = twitchMatch[2];
      if (videoId) {
        return {
          platform: 'twitch',
          id: videoId,
          embedUrl: `https://player.twitch.tv/?video=${videoId}&parent=${currentHostname || 'localhost'}`,
          thumbnailUrl: undefined
        };
      } else if (clipId) {
        return {
          platform: 'twitch',
          id: clipId,
          embedUrl: `https://clips.twitch.tv/embed?clip=${clipId}&parent=${currentHostname || 'localhost'}`,
          thumbnailUrl: undefined
        };
      }
    }

    // Generic video file
    if (url.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i)) {
      return {
        platform: 'generic',
        id: undefined,
        embedUrl: url,
        thumbnailUrl: undefined
      };
    }

    return null;
  };

  // Function to render video content
  const renderVideoContent = () => {
    try {
      if (!videoUrl || videoUrl.trim() === '') return null;

      const videoInfo = getVideoInfo(videoUrl);
      if (!videoInfo) return null;

      const commonIframeProps = {
        className: "w-full h-full border-0",
        allowFullScreen: true,
        loading: "lazy" as const
      };

      switch (videoInfo.platform) {
        case 'youtube':
          return (
            <div className="w-full aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                {...commonIframeProps}
              />
            </div>
          );

        case 'instagram':
          return (
            <div className="w-full max-w-lg mx-auto overflow-hidden rounded-xl bg-white shadow-2xl">
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                className="w-full h-[600px] border-0"
                allowFullScreen
                loading="lazy"
              />
            </div>
          );

        case 'tiktok':
          return (
            <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-black shadow-2xl">
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                className="w-full h-[700px] border-0"
                allowFullScreen
                loading="lazy"
              />
            </div>
          );

        case 'facebook':
          return (
            <div className="w-full aspect-video overflow-hidden rounded-xl bg-blue-50 shadow-2xl">
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                {...commonIframeProps}
              />
            </div>
          );

        case 'vimeo':
          return (
            <div className="w-full aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                {...commonIframeProps}
              />
            </div>
          );

        case 'dailymotion':
          return (
            <div className="w-full aspect-video overflow-hidden rounded-xl bg-black shadow-2xl">
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                allow="autoplay; fullscreen"
                {...commonIframeProps}
              />
            </div>
          );

        case 'twitch':
          return (
            <div className="w-full aspect-video overflow-hidden rounded-xl bg-purple-900 shadow-2xl">
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                allow="autoplay; fullscreen"
                {...commonIframeProps}
              />
            </div>
          );

        case 'twitter':
          return (
            <div className="w-full max-w-lg mx-auto p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-center">
                <i className="fab fa-twitter text-4xl text-blue-400 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-300 mb-4">View this video on Twitter/X</p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                >
                  <i className="fab fa-twitter mr-2"></i>
                  Open on X
                </a>
              </div>
            </div>
          );

        case 'generic':
          return (
            <div className="w-full overflow-hidden rounded-xl bg-black shadow-2xl">
              <video
                src={videoUrl}
                controls
                className="w-full h-auto"
                preload="metadata"
                {...(videoInfo.thumbnailUrl && { poster: videoInfo.thumbnailUrl })}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );

        default:
          return (
            <div className="w-full p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="text-center">
                <i className="fas fa-video text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Video content available</p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  Watch Video
                </a>
              </div>
            </div>
          );
      }
    } catch (error) {
      console.warn('Video rendering error:', error);
      return (
        <div className="w-full p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Unable to load video content</p>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              Watch Video
            </a>
          </div>
        </div>
      );
    }
  };

  // Parse Markdown content with proper list handling
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    let html = '';
    let inOrderedList = false;
    let inUnorderedList = false;
    let orderedListItems: string[] = [];
    let unorderedListItems: string[] = [];
    
    const flushLists = () => {
      if (inOrderedList) {
        html += `<ol class="list-decimal list-inside space-y-3 mb-6 ml-4 text-gray-700 dark:text-gray-300">${orderedListItems.join('')}</ol>`;
        orderedListItems = [];
        inOrderedList = false;
      }
      if (inUnorderedList) {
        html += `<ul class="list-disc list-inside space-y-2 mb-6 ml-4 text-gray-700 dark:text-gray-300">${unorderedListItems.join('')}</ul>`;
        unorderedListItems = [];
        inUnorderedList = false;
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      if (line.startsWith('### ')) {
        flushLists();
        html += `<h3 class="text-xl font-semibold text-gray-900 dark:text-blue-400 mt-8 mb-4">${line.substring(4)}</h3>`;
      } else if (line.startsWith('## ')) {
        flushLists();
        html += `<h2 class="text-2xl font-bold text-gray-900 dark:text-blue-400 mt-10 mb-6">${line.substring(3)}</h2>`;
      } else if (line.startsWith('# ')) {
        flushLists();
        html += `<h1 class="text-3xl font-bold text-gray-900 dark:text-blue-400 mt-12 mb-8">${line.substring(2)}</h1>`;
      } else if (line.match(/^\d+\.\s+/)) {
        if (inUnorderedList) {
          html += `<ul class="list-disc list-inside space-y-2 mb-6 ml-4 text-gray-700 dark:text-gray-300">${unorderedListItems.join('')}</ul>`;
          unorderedListItems = [];
          inUnorderedList = false;
        }
        const content = line.replace(/^\d+\.\s+/, '');
        if (!inOrderedList) {
          inOrderedList = true;
        }
        orderedListItems.push(`<li class="mb-3 pl-2 text-gray-700 dark:text-gray-300">${content}</li>`);
      } else if (line.startsWith('- ')) {
        if (inOrderedList) {
          html += `<ol class="list-decimal list-inside space-y-3 mb-6 ml-4 text-gray-700 dark:text-gray-300">${orderedListItems.join('')}</ol>`;
          orderedListItems = [];
          inOrderedList = false;
        }
        const content = line.substring(2);
        if (!inUnorderedList) {
          inUnorderedList = true;
        }
        unorderedListItems.push(`<li class="mb-2 pl-2 text-gray-700 dark:text-gray-300">${content}</li>`);
      } else if (line === '') {
        flushLists();
        html += '<br>';
      } else if (line.length > 0) {
        flushLists();
        html += `<p class="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">${line}</p>`;
      }
    }
    
    // Flush any remaining lists
    flushLists();
    
    // Process markdown-style links with proper rel attributes
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, linkText, url) => {
      const isAffiliate = url.includes('amazon') || url.includes('flipkart') || url.includes('amzn.to') || url.includes('bit.ly') || url.includes('affiliate');
      const baseStyle = 'color: #2563eb; text-decoration: underline; cursor: pointer; display: inline; pointer-events: auto;';
      const relAttr = isAffiliate ? 'noopener noreferrer nofollow sponsored' : 'noopener noreferrer';
      
      if (isAffiliate) {
        return `<a href="${url}" target="_blank" rel="${relAttr}" style="${baseStyle} background-color: #eff6ff; padding: 4px 8px; border-radius: 6px; border: 1px solid #dbeafe; font-weight: 600; margin: 2px;">${linkText} <i className="fas fa-link"></i></a>`;
      } else {
        return `<a href="${url}" target="_blank" rel="${relAttr}" style="${baseStyle} font-weight: 500;">${linkText}</a>`;
      }
    });
    
    // Process plain URLs with proper rel attributes
    html = html.replace(/(^|[^"'>])(https?:\/\/[^\s<>&"']+)/g, (match, prefix, url) => {
      const isAffiliate = url.includes('amazon') || url.includes('flipkart') || url.includes('amzn.to') || url.includes('bit.ly') || url.includes('affiliate');
      const baseStyle = 'color: #2563eb; text-decoration: underline; cursor: pointer; display: inline; pointer-events: auto; word-break: break-all;';
      const relAttr = isAffiliate ? 'noopener noreferrer nofollow sponsored' : 'noopener noreferrer';
      
      if (isAffiliate) {
        return `${prefix}<a href="${url}" target="_blank" rel="${relAttr}" style="${baseStyle} background-color: #eff6ff; padding: 4px 8px; border-radius: 6px; border: 1px solid #dbeafe; font-weight: 600; margin: 2px;">${url} <i className="fas fa-link"></i></a>`;
      } else {
        return `${prefix}<a href="${url}" target="_blank" rel="${relAttr}" style="${baseStyle} font-weight: 500;">${url}</a>`;
      }
    });
    
    // Convert images
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<div class="my-8"><img src="$2" alt="$1" class="w-full rounded-lg shadow-lg" loading="lazy" /></div>');
    
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-blue-400">$1</strong>');
    
    return html;
  };

  const shareText = `Check out this amazing article: ${title} - PickNTrust`;

  const handleShare = (platform: string) => {
    if (!shareUrl) return; // Don't share if URL isn't ready
    
    let url = '';
    switch (platform) {
      case 'whatsapp':
        // Use proper WhatsApp share URL
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
          url = `whatsapp://send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        } else {
          url = `https://web.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        }
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support web sharing, copy to clipboard
        try {
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
              alert('Content copied to clipboard! You can now paste it on Instagram.');
            }).catch(() => {
              alert(`Please copy this text to share on Instagram:\n\n${shareText} ${shareUrl}`);
            });
          } else {
            alert(`Please copy this text to share on Instagram:\n\n${shareText} ${shareUrl}`);
          }
        } catch (error) {
          alert(`Please copy this text to share on Instagram:\n\n${shareText} ${shareUrl}`);
        }
        return;
    }
    
    if (url) {
      try {
        window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
      } catch (error) {
        console.warn('Failed to open share window:', error);
        // Fallback: try to navigate directly
        window.open(url, '_blank');
      }
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-gray-900 dark:text-white transition-colors">
      {/* Sticky Title Bar */}
      <div className={`fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-40 transition-all duration-300 ${
        isSticky ? 'translate-y-0 shadow-lg border-b border-gray-200 dark:border-gray-700' : '-translate-y-full'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-blue-400 truncate">{title}</h1>
        </div>
      </div>

      {/* Hero Section */}
      <header className="relative">
        {/* Video or Image Display */}
        {videoUrl && videoUrl.trim() !== '' ? (
          <div className="w-full mb-8">
            {renderVideoContent()}
          </div>
        ) : featuredImage && (
          <div className="w-full h-[500px] overflow-hidden rounded-t-xl">
            <img 
              src={featuredImage} 
              alt={`Featured image for ${title}`}
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </div>
        )}
        
        <div className="p-8 lg:p-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(publishDate).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readTime}</span>
            </div>
            <div className="text-sm">
              By <span className="font-medium text-gray-900 dark:text-blue-400">{author}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-8 lg:px-12 pb-12">
        <div 
          className="blog-content max-w-none text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(parseMarkdown(content)) }}
        />
      </main>

      {/* Sticky Share Bar */}
      <div className={`fixed right-6 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-30 ${
        shareSticky ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex flex-col gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleShare('whatsapp')}
            className="w-10 h-10 rounded-full p-0 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600"
            title="Share on WhatsApp"
            aria-label="Share article on WhatsApp"
          >
            <i className="fab fa-whatsapp text-lg" aria-hidden="true"></i>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleShare('facebook')}
            className="w-10 h-10 rounded-full p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
            title="Share on Facebook"
            aria-label="Share article on Facebook"
          >
            <i className="fab fa-facebook text-lg" aria-hidden="true"></i>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleShare('twitter')}
            className="w-10 h-10 rounded-full p-0 hover:bg-gray-50 dark:hover:bg-gray-800 text-black dark:text-white"
            title="Share on X (Twitter)"
            aria-label="Share article on X (formerly Twitter)"
          >
            <div className="w-5 h-5 bg-black dark:bg-white rounded-sm flex items-center justify-center">
              <span className="text-white dark:text-black text-sm font-bold" aria-hidden="true">𝕏</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Bottom Share Section */}
      <footer className="border-t border-gray-200 dark:border-gray-700 px-8 lg:px-12 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share this article:</span>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 hover:text-green-700 dark:hover:text-green-400"
              aria-label="Share article on WhatsApp"
            >
              <i className="fab fa-whatsapp mr-2" aria-hidden="true"></i>
              WhatsApp
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400"
              aria-label="Share article on Facebook"
            >
              <i className="fab fa-facebook mr-2" aria-hidden="true"></i>
              Facebook
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-500 dark:hover:text-blue-400"
              aria-label="Share article on X (formerly Twitter)"
            >
              <i className="fab fa-twitter mr-2" aria-hidden="true"></i>
              Twitter
            </Button>
          </div>
        </div>
      </footer>
    </article>
  );
}
