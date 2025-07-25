import { useState, useEffect } from 'react';
import { Share2, Calendar, Clock, Tag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';

interface BlogPostProps {
  title: string;
  content: string;
  publishDate: string;
  readTime: string;
  featuredImage?: string;
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
  tags, 
  author = "PickNTrust Team",
  slug 
}: BlogPostProps) {
  const [isSticky, setIsSticky] = useState(false);
  const [shareSticky, setShareSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const titleHeight = 200; // Approximate height of title section
      const contentHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      setIsSticky(scrollTop > titleHeight);
      setShareSticky(scrollTop > contentHeight * 0.3);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parse Markdown content
  const parseMarkdown = (text: string) => {
    // Convert headers
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-navy dark:text-blue-400 mt-8 mb-4">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-navy dark:text-blue-400 mt-10 mb-6">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-navy dark:text-blue-400 mt-12 mb-8">$1</h1>');
    
    // Convert numbered lists
    text = text.replace(/^\d+\.\s+(.*$)/gim, '<li class="mb-3 pl-2">$1</li>');
    text = text.replace(/(<li.*<\/li>)/gim, '<ol class="list-decimal list-inside space-y-2 mb-6 ml-4">$1</ol>');
    
    // Convert affiliate links with special styling
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, linkText, url) => {
      const isAffiliate = url.includes('amazon') || url.includes('flipkart') || url.includes('amzn.to') || url.includes('bit.ly');
      const linkClass = isAffiliate 
        ? 'inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800'
        : 'text-blue-600 dark:text-blue-400 hover:underline';
      
      const icon = isAffiliate ? '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>' : '';
      
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${linkClass}">${linkText}${icon}</a>`;
    });
    
    // Convert images with SEO-friendly alt text
    text = text.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="w-full max-w-2xl mx-auto rounded-lg shadow-md my-6" loading="lazy" />');
    
    // Convert paragraphs
    text = text.replace(/\n\s*\n/g, '</p><p class="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">');
    text = '<p class="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">' + text + '</p>';
    
    // Convert bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-navy dark:text-blue-400">$1</strong>');
    
    return text;
  };

  const shareUrl = `${window.location.origin}/blog/${slug}`;
  const shareText = `Check out this amazing article: ${title} - PickNTrust`;

  const handleShare = (platform: string) => {
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <article className="max-w-4xl mx-auto bg-white dark:bg-gray-900 transition-colors">
      {/* Sticky Title Bar */}
      <div className={`fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-40 transition-all duration-300 ${
        isSticky ? 'translate-y-0 shadow-lg border-b border-gray-200 dark:border-gray-700' : '-translate-y-full'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-bold text-navy dark:text-blue-400 truncate">{title}</h1>
        </div>
      </div>

      {/* Hero Section */}
      <header className="relative">
        {featuredImage && (
          <div className="w-full h-96 overflow-hidden rounded-t-xl">
            <img 
              src={featuredImage} 
              alt={`Featured image for ${title}`}
              className="w-full h-full object-cover"
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
          
          <h1 className="text-4xl lg:text-5xl font-bold text-navy dark:text-white mb-6 leading-tight">
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
              By <span className="font-medium text-navy dark:text-blue-400">{author}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-8 lg:px-12 pb-12">
        <div 
          className="prose prose-lg max-w-none prose-headings:text-navy dark:prose-headings:text-blue-400 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-navy dark:prose-strong:text-blue-400"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
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
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleShare('facebook')}
            className="w-10 h-10 rounded-full p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
            title="Share on Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleShare('twitter')}
            className="w-10 h-10 rounded-full p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500"
            title="Share on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
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
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              WhatsApp
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-500 dark:hover:text-blue-400"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Twitter
            </Button>
          </div>
        </div>
      </footer>
    </article>
  );
}