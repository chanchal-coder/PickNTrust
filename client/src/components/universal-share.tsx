import { useState } from "react";
import { useToast } from '@/hooks/use-toast';

interface UniversalShareProps {
  product: {
    id: number;
    name: string;
    description: string;
    price?: string | number;
    imageUrl: string;
    category?: string;
  };
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
}

export default function UniversalShare({ 
  product, 
  className = "", 
  buttonText = "Share", 
  showIcon = true 
}: UniversalShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { toast } = useToast();

  // Generate share data
  const shareData = {
    title: `${product.name} - PickNTrust`,
    text: `Check out this amazing ${product.category ? product.category.toLowerCase() : 'product'}: ${product.name} - Only ₹${product.price} at PickNTrust!`,
    url: `${window.location.origin}/product/${product.id}`,
    image: product.imageUrl
  };

  // Check if Web Share API is supported (mobile)
  const canUseWebShare = typeof navigator !== 'undefined' && 
    'share' in navigator && 
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleNativeShare = async () => {
    if (canUseWebShare) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        });
        toast({
          title: "Shared successfully!",
          description: "Thanks for sharing this product",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fallback to share menu
          setShowShareMenu(true);
        }
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleFallbackShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedText = encodeURIComponent(shareData.text);
    const encodedTitle = encodeURIComponent(shareData.title);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
        setShowShareMenu(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
    
    setShowShareMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className={`flex items-center space-x-2 ${className}`}
        title="Share product"
      >
        {showIcon && <i className="fas fa-share text-sm"></i>}
        <span>{buttonText}</span>
      </button>
      
      {/* Fallback Share Menu for Desktop */}
      {showShareMenu && (
        <>
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-3 z-50 min-w-[200px]">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Share this product</div>
            
            <div className="space-y-1">
              <button
                onClick={() => handleFallbackShare('facebook')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300 transition-colors"
              >
                <i className="fab fa-facebook text-blue-600 w-4"></i>
                <span>Facebook</span>
              </button>
              
              <button
                onClick={() => handleFallbackShare('twitter')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded w-full text-left text-gray-700 dark:text-gray-300 transition-colors"
              >
                <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">𝕏</span>
                </div>
                <span>X (Twitter)</span>
              </button>
              
              <button
                onClick={() => handleFallbackShare('whatsapp')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300 transition-colors"
              >
                <i className="fab fa-whatsapp text-green-600 w-4"></i>
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={() => handleFallbackShare('linkedin')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300 transition-colors"
              >
                <i className="fab fa-linkedin text-blue-700 w-4"></i>
                <span>LinkedIn</span>
              </button>
              
              <button
                onClick={() => handleFallbackShare('telegram')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300 transition-colors"
              >
                <i className="fab fa-telegram text-blue-500 w-4"></i>
                <span>Telegram</span>
              </button>
              
              <hr className="my-2 border-gray-200 dark:border-gray-600" />
              
              <button
                onClick={() => handleFallbackShare('copy')}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded w-full text-left text-gray-700 dark:text-gray-300 transition-colors"
              >
                <i className="fas fa-copy text-gray-600 w-4"></i>
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
