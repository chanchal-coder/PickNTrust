import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Instagram, MessageCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  title,
  excerpt,
  imageUrl,
  videoUrl,
  publishedAt,
  readTime,
  category,
  tags,
}) => {
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
      <div className="absolute top-4 right-4">
        <Button variant="outline" size="sm" onClick={() => setShowShareMenu(!showShareMenu)} className="p-2">
          <Share2 className="w-4 h-4" />
        </Button>
        {showShareMenu && (
          <div className="absolute right-0 mt-2 bg-white dark:bg-gray-700 border rounded-lg shadow-lg p-2 z-10 flex flex-col gap-1">
            <button onClick={() => handleShare('facebook')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </button>
            <button onClick={() => handleShare('twitter')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
              <Twitter className="w-4 h-4 text-blue-400" />
              Twitter
            </button>
            <button onClick={() => handleShare('telegram')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
              <MessageCircle className="w-4 h-4 text-blue-500" />
              Telegram
            </button>
            <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
              <MessageCircle className="w-4 h-4 text-green-600" />
              WhatsApp
            </button>
            <button onClick={() => handleShare('instagram')} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded">
              <Instagram className="w-4 h-4 text-purple-600" />
              Instagram
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPostCard;
