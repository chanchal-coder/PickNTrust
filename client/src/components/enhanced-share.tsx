import { useState } from "react";
import { useToast } from '@/hooks/use-toast';

interface EnhancedShareProps {
  product: {
    id: number | string;
    name: string;
    description?: string;
    price?: string | number;
    imageUrl?: string;
    category?: string;
    videoUrl?: string;
    affiliateUrl?: string;
  };
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
  contentType?: 'product' | 'video' | 'blog' | 'service' | 'app';
}

export default function EnhancedShare({ 
  product, 
  className = "", 
  buttonText = "Share", 
  showIcon = true,
  contentType = 'product'
}: EnhancedShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  // Generate share data based on content type
  const getShareData = () => {
    const baseUrl = window.location.origin;
    let shareUrl = '';
    let shareText = '';
    let shareTitle = '';

    switch (contentType) {
      case 'video':
        shareUrl = product.videoUrl || `${baseUrl}/videos`;
        shareText = `🎥 Watch this amazing video: ${product.name} - ${product.description || 'Must watch!'}`;
        shareTitle = `${product.name} - Video | PickNTrust`;
        break;
      case 'blog':
        shareUrl = `${baseUrl}/blog/${product.id}`;
        shareText = `📖 Read this interesting article: ${product.name} - ${product.description || 'Great read!'}`;
        shareTitle = `${product.name} - Blog | PickNTrust`;
        break;
      case 'service':
        shareUrl = product.affiliateUrl || `${baseUrl}/services`;
        shareText = `🛠️ Check out this amazing service: ${product.name} - ${product.description || 'Professional service!'}`;
        shareTitle = `${product.name} - Service | PickNTrust`;
        break;
      case 'app':
        shareUrl = product.affiliateUrl || `${baseUrl}/apps`;
        shareText = `📱 Discover this awesome app: ${product.name} - ${product.description || 'Must-have app!'}`;
        shareTitle = `${product.name} - App | PickNTrust`;
        break;
      default: // product
        shareUrl = product.affiliateUrl || `${baseUrl}/product/${product.id}`;
        shareText = `🛍️ Check out this amazing ${product.category ? product.category.toLowerCase() : 'product'}: ${product.name}${product.price ? ` - Only ₹${product.price}` : ''} at PickNTrust!`;
        shareTitle = `${product.name} - Product | PickNTrust`;
    }

    return { shareUrl, shareText, shareTitle };
  };

  // Check if Web Share API is supported (mobile)
  const canUseWebShare = typeof navigator !== 'undefined' && 
    'share' in navigator && 
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Handle native share or fallback to custom menu
  const handleNativeShare = async () => {
    const { shareUrl, shareText, shareTitle } = getShareData();
    
    if (navigator.share && navigator.canShare && navigator.canShare({
      title: shareTitle,
      text: shareText,
      url: shareUrl
    })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        toast({
          title: "Shared successfully!",
          description: "Thanks for sharing this content",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          setShowShareMenu(true);
        }
      }
    } else {
      setShowShareMenu(true);
    }
  };

  // Handle individual platform share
  const handlePlatformShare = (platform: string) => {
    const { shareUrl, shareText, shareTitle } = getShareData();
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedTitle = encodeURIComponent(shareTitle);
    
    let platformShareUrl = '';
    
    switch (platform) {
      case 'facebook':
        platformShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        platformShareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        platformShareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: "Link copied for Instagram!",
          description: "Paste this in your Instagram story or post",
        });
        setShowShareMenu(false);
        return;
      case 'linkedin':
        platformShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`;
        break;
      case 'telegram':
        platformShareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'youtube':
        // YouTube doesn't support direct sharing, copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: "Link copied for YouTube!",
          description: "Paste this in your YouTube video description or comment",
        });
        setShowShareMenu(false);
        return;
      case 'copy':
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
        setShowShareMenu(false);
        return;
    }
    
    if (platformShareUrl) {
      window.open(platformShareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
    
    setShowShareMenu(false);
  };

  // Handle one-click share to all platforms
  const handleShareToAll = async () => {
    setIsSharing(true);
    const { shareUrl, shareText, shareTitle } = getShareData();
    
    try {
      // List of platforms to share to
      const platforms = ['facebook', 'twitter', 'whatsapp', 'telegram', 'linkedin'];
      
      // Open all platform share windows with a small delay between each
      for (let i = 0; i < platforms.length; i++) {
        setTimeout(() => {
          handlePlatformShare(platforms[i]);
        }, i * 500); // 500ms delay between each platform
      }
      
      // Also copy to clipboard for Instagram and YouTube
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      
      toast({
        title: "🚀 Sharing to all platforms!",
        description: "Opening share windows for Facebook, Twitter, WhatsApp, Telegram, and LinkedIn. Link copied for Instagram/YouTube.",
        duration: 5000,
      });
      
    } catch (error) {
      console.error('Error sharing to all platforms:', error);
      toast({
        title: "Error sharing",
        description: "There was an issue sharing to all platforms. Please try individual platforms.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsSharing(false);
        setShowShareMenu(false);
      }, 2500);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className={`flex items-center space-x-2 ${className}`}
        title="Share content"
      >
        {showIcon && <i className="fas fa-share text-sm"></i>}
        <span>{buttonText}</span>
      </button>
      
      {/* Enhanced Share Menu for Desktop */}
      {showShareMenu && (
        <>
          <div className="absolute right-0 top-full mt-2 bg-gray-900 dark:bg-gray-800 border border-gray-700 dark:border-gray-600 rounded-lg shadow-xl p-3 z-[9999] min-w-[220px] max-h-[400px] overflow-y-auto">
            <div className="text-sm font-semibold text-white mb-3">Share this {contentType}</div>
            
            {/* One-Click Share to All Button */}
            <button
              onClick={handleShareToAll}
              disabled={isSharing}
              className="w-full mb-3 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSharing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-magic"></i>
                  <span>🚀 Share to All Platforms</span>
                </>
              )}
            </button>
            
            <div className="text-xs text-gray-300 mb-2 text-center">Or choose individual platforms:</div>
            
            <div className="space-y-1">
              <button
                onClick={() => handlePlatformShare('facebook')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-600/20 rounded w-full text-left text-white transition-colors"
              >
                <i className="fab fa-facebook text-blue-400 w-4"></i>
                <span>Facebook</span>
              </button>
              
              <button
                onClick={() => handlePlatformShare('twitter')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-600/20 rounded w-full text-left text-white transition-colors"
              >
                <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                  <span className="text-black text-xs font-bold">𝕏</span>
                </div>
                <span>X (Twitter)</span>
              </button>
              
              <button
                onClick={() => handlePlatformShare('whatsapp')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-green-600/20 rounded w-full text-left text-white transition-colors"
              >
                <i className="fab fa-whatsapp text-green-400 w-4"></i>
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={() => handlePlatformShare('instagram')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-purple-600/20 rounded w-full text-left text-white transition-colors"
              >
                <i className="fab fa-instagram text-purple-400 w-4"></i>
                <span>Instagram</span>
              </button>
              
              <button
                onClick={() => handlePlatformShare('youtube')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-red-600/20 rounded w-full text-left text-white transition-colors"
              >
                <i className="fab fa-youtube text-red-400 w-4"></i>
                <span>YouTube</span>
              </button>
              
              <button
                onClick={() => handlePlatformShare('linkedin')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-600/20 rounded w-full text-left text-white transition-colors"
              >
                <i className="fab fa-linkedin text-blue-400 w-4"></i>
                <span>LinkedIn</span>
              </button>
              
              <button
                onClick={() => handlePlatformShare('telegram')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-600/20 rounded w-full text-left text-white transition-colors"
              >
                <i className="fab fa-telegram text-blue-400 w-4"></i>
                <span>Telegram</span>
              </button>
              
              <hr className="my-2 border-gray-600" />
              
              <button
                onClick={() => handlePlatformShare('copy')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-600/20 rounded w-full text-left text-white transition-colors"
              >
                <i className="fas fa-copy text-gray-400 w-4"></i>
                <span>Copy Link</span>
              </button>
            </div>
          </div>
          
          {/* Overlay to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />
        </>
      )}
    </div>
  );
}