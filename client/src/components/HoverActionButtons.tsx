import React, { useState, useRef, useEffect } from 'react';
import SmartShareDropdown from './SmartShareDropdown';
import ShareAutomaticallyModal from './ShareAutomaticallyModal';
import { deleteProduct } from '@/utils/delete-utils';
import { useWishlist } from '@/hooks/use-wishlist';

interface HoverActionButtonsProps {
  deal: any;
  isAdmin: boolean;
  onShareToAll?: (deal: any) => void;
  className?: string;
}

const HoverActionButtons: React.FC<HoverActionButtonsProps> = ({
  deal,
  isAdmin,
  onShareToAll,
  className = ''
}) => {
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isVisible, setIsVisible] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPlatforms] = useState(['Instagram', 'Facebook', 'WhatsApp', 'Telegram']);
  const [positionBelow, setPositionBelow] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkPosition = () => {
      if (dropdownRef.current) {
        const parentCard = dropdownRef.current.closest('.group');
        if (parentCard) {
          const cardRect = parentCard.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const cardWidth = cardRect.width;
          
          // For wide horizontal cards (like hotel section 2), always position below
          // For normal cards, position below if in right portion of viewport
          setPositionBelow(cardWidth > 500 || cardRect.right > viewportWidth * 0.7);
        }
      }
    };
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(checkPosition, 100);
    window.addEventListener('resize', checkPosition);
    return () => window.removeEventListener('resize', checkPosition);
  }, []);

  const handleShareToAll = () => {
    if (onShareToAll) {
      onShareToAll(deal);
    } else {
      setShowShareModal(true);
    }
  };

  const handleConfirmShare = () => {
    // Create share URLs for all platforms
    const shareText = `Check out ${deal.name} - ${deal.description || ''} Starting from ${deal.price}`;
    const shareUrl = deal.affiliateUrl || deal.affiliate_url || window.location.href;
    
    const platforms = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    };
    
    // Open all platforms in new tabs
    Object.entries(platforms).forEach(([platform, url]) => {
      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      }, 100); // Small delay to prevent popup blockers
    });
    
    setShowShareModal(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        // For travel products, use the correct format: deleteProduct('travel', productId)
        await deleteProduct('travel', deal.id);
        
        // Show success message
        console.log('✅ Travel product deleted successfully:', deal.id);
        
        // Force page refresh to update the UI immediately
        window.location.reload();
      } catch (error) {
        console.error('❌ Failed to delete travel product:', error);
        alert('Failed to delete item. Please try again.');
      }
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className={`hover-actions absolute opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-50 top-2 right-2 ${className}`}
      style={{ 
        pointerEvents: 'auto',
        transform: 'translateX(-100%) translateY(-20px)'
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div 
        className="flex flex-col gap-2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 p-2 min-w-[120px]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Wishlist Button - Available to all users */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isInWishlist(deal.id)) {
              removeFromWishlist(deal.id);
            } else {
              addToWishlist(deal);
            }
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-700 transition-colors duration-200"
          title={isInWishlist(deal.id) ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <i className={`fas fa-heart ${
            isInWishlist(deal.id) 
              ? 'text-red-500' 
              : 'text-gray-300'
          }`}></i>
          <span className="text-white">Wishlist</span>
        </button>

        {/* Admin-specific buttons */}
        {isAdmin ? (
          <>
            {/* Share to All Platforms - Admin Only */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShareToAll();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-blue-600 transition-colors duration-200 text-blue-400 hover:text-white"
              title="Share to All Platforms"
            >
              <i className="fas fa-share-alt"></i>
              <span>Share All</span>
            </button>

            {/* Individual Share - Admin */}
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="hover:bg-gray-700 rounded-md"
            >
              <SmartShareDropdown
                product={{
                  id: deal.id,
                  name: deal.name,
                  description: deal.description,
                  price: deal.price,
                  imageUrl: deal.imageUrl || deal.image_url,
                  category: deal.category,
                  affiliateUrl: deal.affiliateUrl || deal.affiliate_url
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm w-full text-left text-white hover:text-blue-400"
                buttonText="Share"
                showIcon={true}
              />
            </div>

            {/* Delete Button - Admin Only */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-red-600 transition-colors duration-200 text-red-400 hover:text-white"
              title="Delete"
            >
              <i className="fas fa-trash"></i>
              <span>Delete</span>
            </button>
          </>
        ) : (
          /* Public user - Share only */
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="hover:bg-gray-700 rounded-md"
          >
            <SmartShareDropdown
              product={{
                id: deal.id,
                name: deal.name,
                description: deal.description,
                price: deal.price,
                imageUrl: deal.imageUrl || deal.image_url,
                category: deal.category,
                affiliateUrl: deal.affiliateUrl || deal.affiliate_url
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm w-full text-left text-white hover:text-blue-400"
              buttonText="Share"
              showIcon={true}
            />
          </div>
        )}
      </div>
      
      <ShareAutomaticallyModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onConfirm={handleConfirmShare}
        productName={deal.name}
        platforms={selectedPlatforms}
      />
    </div>
  );
};

export default HoverActionButtons;