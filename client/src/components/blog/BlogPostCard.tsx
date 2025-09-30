import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Instagram, MessageCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EnhancedShare from '@/components/enhanced-share';

interface BlogPostCardProps {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string;
  videoUrl?: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({
  id,
  title,
  excerpt,
  imageUrl,
  videoUrl,
  publishedAt,
  readTime,
  category,
  tags,
}) => {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    if (adminAuth === 'active') {
      setIsAdmin(true);
    }
  }, []);

  // Listen for admin session changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { toast } = useToast();

  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const shareUrl = `${window.location.origin}/blog/${encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`;
  const shareText = `${title} - ${excerpt}`;

  const handleShare = async (platform: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url: shareUrl,
        });
        setShowShareMenu(false);
      } catch (error) {
        toast({
          title: 'Share Cancelled',
          description: 'You cancelled the share action.',
          variant: 'destructive',
        });
      }
      return;
    }

    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'instagram':
        // Instagram does not support direct sharing, copy link to clipboard
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link Copied',
          description: 'Link copied to clipboard. Paste it in your Instagram story or bio.',
        });
        setShowShareMenu(false);
        return;
      default:
        return;
    }
    window.open(url, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 max-w-sm shadow-lg relative">
      {videoUrl ? (
        <video controls className="rounded-lg w-full h-48 object-cover mb-4">
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <img src={imageUrl} alt={title} className="rounded-lg w-full h-48 object-cover mb-4" />
      )}
      <div className="text-gray-400 text-sm flex items-center space-x-4 mb-2">
        <span>{formattedDate}</span>
        <span>•</span>
        <span>{readTime}</span>
        <span className="ml-auto bg-blue-600 text-white px-2 py-0.5 rounded text-xs">{category}</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300 mb-4">{excerpt}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
            #{tag}
          </span>
        ))}
      </div>
      {/* Admin-Only Enhanced Share Button */}
      {isAdmin && (
        <div className="absolute top-4 right-4">
          <EnhancedShare
            product={{
              id: id,
              name: title,
              description: excerpt,
              imageUrl: imageUrl,
              videoUrl: videoUrl,
              category: category
            }}
            contentType="blog"
            className="p-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            buttonText=""
            showIcon={true}
          />
        </div>
      )}
    </div>
  );
};

export default BlogPostCard;
