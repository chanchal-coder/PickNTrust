// @ts-nocheck
import { useState, useEffect } from 'react';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';
import { ProductTimer } from '@/components/product-timer';
import { CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import EnhancedPriceTag from '@/components/EnhancedPriceTag';

interface Product {
  id: number | string;
  name: string;
  description?: string;
  price?: string | number;
  originalPrice?: string | number | null;
  currency?: string;
  imageUrl?: string;
  image_url?: string;
  affiliateUrl?: string;
  affiliate_url?: string;
  affiliateNetworkId?: number | null;
  affiliateNetworkName?: string | null;
  affiliate_network?: string;
  affiliate_tag_applied?: number;
  original_url?: string;
  category?: string;
  subcategory?: string;
  gender?: string | null;
  rating?: string | number;
  reviewCount?: number | string;
  discount?: number | string | null;
  isNew?: boolean | number;
  isFeatured?: boolean | number;
  hasTimer?: boolean;
  timerDuration?: number | null;
  timerStartTime?: Date | string | null;
  displayPages?: string[];
  createdAt?: Date | string | null;
  hasLimitedOffer?: boolean | number;
  limitedOfferText?: string;
  content_type?: string;
  source?: string;
  networkBadge?: string;
  // Service specific fields
  isService?: boolean;
  isAIApp?: boolean;
  pricingType?: string;
  monthlyPrice?: string | number;
  yearlyPrice?: string | number;
  isFree?: boolean;
  priceDescription?: string;
  // Bundle fields
  messageGroupId?: string;
  productSequence?: string | number;
  totalInGroup?: string | number;
  sourceMetadata?: any;
  // Telegram fields
  telegramMessageId?: number;
  telegramChannelId?: number;
  clickCount?: number;
  conversionCount?: number;
  processing_status?: string;
  expiresAt?: number;
  // Alternative sources
  alternativeSources?: Array<{
    network: string;
    price?: string | number;
    originalPrice?: string | number;
    url: string;
    commission: number;
  }>;
  // Commission info
  commissionRate?: number;
  // Additional fields for compatibility
  [key: string]: any;
}

interface AmazonProductCardProps {
  product: Product;
  onAffiliateClick?: (productId: string | number, networkId?: number, affiliateUrl?: string) => void;
}

const formatProductPrice = (price?: string | number, productCurrency?: string) => {
  const currency = productCurrency as CurrencyCode || 'INR';
  const numericPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) : (price || 0);
  return formatCurrencyPrice(numericPrice, currency);
};

export default function AmazonProductCard({ product, onAffiliateClick }: AmazonProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showShareConfirmation, setShowShareConfirmation] = useState(false);
  const [automationSettings, setAutomationSettings] = useState(null);

  // Simple admin check
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);

  // Fetch automation settings for admin users
  useEffect(() => {
    const fetchAutomationSettings = async () => {
      if (isAdmin) {
        try {
          const response = await fetch('/api/admin/canva/settings?password=admin');
          if (response.ok) {
            const settings = await response.json();
            setAutomationSettings(settings);
          }
        } catch (error) {
          console.error('Failed to fetch automation settings:', error);
          // Set default settings on error
          setAutomationSettings({
            isEnabled: true,
            platforms: ['instagram', 'facebook', 'whatsapp', 'telegram'],
            autoGenerateCaptions: true,
            autoGenerateHashtags: true
          });
        }
      }
    };
    fetchAutomationSettings();
  }, [isAdmin]);



  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showShareMenu]);

  const handleAffiliateClick = () => {
    if (onAffiliateClick) {
      onAffiliateClick(product.id, product.affiliateNetworkId, product.affiliateUrl || product.affiliate_url);
    } else {
      window.open((product.affiliateUrl || product.affiliate_url || ""), '_blank', 'noopener,noreferrer');
    }
  };

  // Delete product mutation (admin only)
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number | string) => {
      console.log('<i className="fas fa-globe"></i> Making DELETE request to:', `/api/admin/products/${productId}`);
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('<i className="fas fa-times-circle"></i> Delete API error:', errorText);
        throw new Error(`Failed to delete product: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('<i className="fas fa-check-circle"></i> Delete API success:', result);
      return result;
    },
    onSuccess: () => {
      // Use comprehensive cache invalidation instead of page reload
      console.log('🗑️ Product deleted successfully, invalidating caches...');
      
      // Import and use the proper invalidation utility
      import('@/utils/delete-utils').then(({ invalidateAllProductQueries }) => {
        invalidateAllProductQueries(queryClient);
      });
      
      // Also invalidate page-specific queries for current page
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && (
          key.includes('/api/products/page/') ||
          key.includes('/api/click-picks') ||
          key.includes('/api/global-picks') ||
          key.includes('/api/dealshub') ||
          key.includes('/api/loot-box') ||
          key.includes('/api/travel-picks') ||
          key.includes('/api/cue-picks') ||
          key.includes('/api/value-picks') ||
          key.includes('/api/prime-picks')
        );
      }});
      
      console.log('✅ Cache invalidation completed');
      toast({
        title: 'Product Deleted',
        description: `${product.name} has been deleted successfully.`,
      });
     },
     onError: (error: any) => {
       console.error('<i className="fas fa-times-circle"></i> Delete mutation failed:', error);
       console.error('<i className="fas fa-times-circle"></i> Error message:', error.message);
       console.error('<i className="fas fa-times-circle"></i> Full error object:', error);
       
       toast({
         title: 'Delete Failed',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
      
      // Also show browser alert for immediate feedback
      alert(`Delete failed: ${error.message || 'Unknown error'}`);
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🗑️ Delete button clicked for product:', product.name, 'ID:', product.id);
    
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      console.log('<i className="fas fa-check-circle"></i> User confirmed deletion, starting delete process...');
      try {
        deleteProductMutation.mutate(product.id);
      } catch (error) {
        console.error('<i className="fas fa-times-circle"></i> Error in delete mutation:', error);
        alert('Delete failed: ' + error.message);
      }
    } else {
      console.log('<i className="fas fa-times-circle"></i> User cancelled deletion');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Always show traditional dropdown for manual platform selection
    setShowShareMenu(!showShareMenu);
  };

  const handleAutomatedShare = async () => {
    try {
      // Prepare content data for automation
      const contentData = {
        title: product.name,
        description: product.description || `Amazing deal on ${product.name}`,
        price: product.price,
        originalPrice: product.originalPrice,
        imageUrl: product.imageUrl || product.image_url,
        category: product.category,
        websiteUrl: `${window.location.origin}/product/${product.id}`,
        contentType: 'product',
        contentId: product.id
      };

      // Get enabled platforms from automation settings
      const enabledPlatforms = automationSettings.platforms || ['facebook', 'instagram', 'whatsapp', 'telegram'];

      // Call the automation API
      const response = await fetch('/api/admin/canva-automation/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentData,
          platforms: enabledPlatforms
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Shared Successfully!',
          description: `Product shared to ${enabledPlatforms.length} platforms: ${enabledPlatforms.join(', ')}`,
        });
      } else {
        throw new Error('Failed to share product');
      }
    } catch (error) {
      console.error('Share automation failed:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to share product automatically. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShowShareConfirmation(false);
    }
  };

  const shareProduct = (platform: string) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const text = `Check out this amazing product: ${product.name}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + productUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(productUrl);
        toast({
          title: 'Link Copied',
          description: 'Product link copied to clipboard',
        });
        setShowShareMenu(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} removed from your wishlist`,
      });
    } else {
      addToWishlist(product);
      toast({
        title: "Added to wishlist",
        description: `${product.name} added to your wishlist`,
      });
    }
  };

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <i key={i} className="fas fa-star text-yellow-400 text-xs" />;
          } else if (i === fullStars && hasHalfStar) {
            return <i key={i} className="fas fa-star-half-alt text-yellow-400 text-xs" />;
          } else {
            return <i key={i} className="far fa-star text-gray-300 text-xs" />;
          }
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer group max-w-xs">
      {/* Product Image */}
      <div className="relative mb-2">
        <img
          src={imageError ? `https://picsum.photos/180/180?random=${product.id}` : (product.imageUrl || product.image_url || "")}
          alt={product.name}
          className="w-full h-40 object-contain bg-gray-50 dark:bg-gray-700 rounded-md"
          onError={() => setImageError(true)}
        />
        
        {/* Wishlist Button - Top Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle();
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm transition-colors ${
            isInWishlist(product.id)
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white text-gray-400 hover:text-red-500 hover:bg-gray-50'
          }`}
          title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className="fas fa-heart text-xs" />
        </button>



      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {(() => {
            // Hybrid discount calculation: use database value or calculate fallback
            const dbDiscount = Number(product.discount || 0);
            const originalPrice = parseFloat(product.originalPrice || '0');
            const currentPrice = parseFloat(String(product.price || product.price || 0));
            const calculatedDiscount = originalPrice > currentPrice && originalPrice > 0 ? 
              Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
            
            const finalDiscount = dbDiscount > 0 ? dbDiscount : calculatedDiscount;
            
            return finalDiscount > 0 ? (
              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                {Math.round(finalDiscount)}% off
              </span>
            ) : null;
          })()}
          {(() => {
            return product.isFeatured === true ? (
              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
                Featured
              </span>
            ) : null;
          })()}
        </div>

        {/* Product Name */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-2">
          {product.name}
        </h3>

        {/* Price Section (using shared PriceTag for unified logic) */}
        {(() => {
          const getNum = (val: any) => {
            if (val === null || val === undefined) return 0;
            const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.-]/g, ''));
            return isNaN(n) ? 0 : n;
          };
          const showPrice = (
            product.isFree === true ||
            product.pricingType === 'free' ||
            (typeof product.priceDescription === 'string' && product.priceDescription.trim().length > 0) ||
            getNum(product.monthlyPrice) > 0 ||
            getNum(product.yearlyPrice) > 0 ||
            getNum(product.price) > 0
          );
          return showPrice;
        })() ? (
          <div className="space-y-1 mb-2">
            {(() => {
              const priceTagProduct = {
                ...product,
                currency: product.currency || 'INR',
                originalPrice: (product as any).originalPrice ?? (product as any).original_price ?? null,
                priceDescription: (product as any).priceDescription ?? (product as any).price_description ?? '',
                monthlyPrice: (product as any).monthlyPrice ?? (product as any).monthly_price ?? 0,
                yearlyPrice: (product as any).yearlyPrice ?? (product as any).yearly_price ?? 0,
                pricingType: (product as any).pricingType ?? (product as any).pricing_type ?? undefined,
                isFree: (product as any).isFree ?? (product as any).is_free ?? false,
              };
              return (
                <EnhancedPriceTag
                  product={priceTagProduct}
                  colorClass="text-gray-900 dark:text-white"
                  originalClass="text-gray-500 line-through text-sm"
                  freeClass="text-green-600 dark:text-green-400"
                  helperClass="text-xs text-gray-500"
                  discountClass="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold"
                  showDiscountBadge={true}
                />
              );
            })()}
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
            {product.description}
          </div>
        )}

        {/* Timer */}
        {product.hasTimer && (
          <div className="mb-2">
            <ProductTimer product={product} />
          </div>
        )}

        {/* Pick Now Button */}
        <button
          onClick={() => window.open((product.affiliateUrl || product.affiliate_url || ""), '_blank')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5 px-4 rounded-md text-sm transition-colors"
        >
          <i className="fas fa-shopping-bag mr-2"></i>Pick Now
        </button>
        
        {/* Affiliate Disclaimer */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          <i className="fas fa-link mr-1"></i>Affiliate Link - We earn from purchases
        </p>
        
        {/* Action Buttons - Below Disclosure at Right Corner */}
        <div className="flex justify-end mt-1 gap-1">
          {/* Share Buttons */}
          <div className="relative flex gap-1">
            {/* Admin Share Buttons */}
            {isAdmin && (
              <>
                {/* Quick Auto-Share Button (Admin Only) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!automationSettings) {
                      setAutomationSettings({
                        isEnabled: true,
                        platforms: ['instagram', 'facebook', 'whatsapp', 'telegram'],
                        autoGenerateCaptions: true,
                        autoGenerateHashtags: true
                      });
                    }
                    setShowShareConfirmation(true);
                  }}
                  className="p-1 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                  title="Quick auto-share to all platforms"
                >
                  <i className="fas fa-magic text-xs" />
                </button>
                
                {/* Admin Normal Share Button (Same as Public) */}
                <SmartShareDropdown
                  product={{
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    imageUrl: product.imageUrl || product.image_url,
                    category: product.category,
                    affiliateUrl: product.affiliateUrl || product.affiliate_url
                  }}
                  className="p-1 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                  buttonText=""
                  showIcon={true}
                />
              </>
            )}
            
            {/* Public User Smart Share Button */}
            {!isAdmin && (
              <SmartShareDropdown
                product={{
                  id: product.id,
                  name: product.name,
                  description: product.description,
                  price: product.price,
                  imageUrl: product.imageUrl || product.image_url,
                  category: product.category,
                  affiliateUrl: product.affiliateUrl || product.affiliate_url
                }}
                className="p-1 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                buttonText=""
                showIcon={true}
              />
            )}
            
            {/* Share Confirmation Modal for Admin */}
            {showShareConfirmation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="fas fa-share-alt text-3xl text-blue-600 mb-2"></i>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Share Product Automatically?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Share "{product.name}" to your configured platforms:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {(automationSettings?.platforms || []).map((platform) => (
                          <span key={platform} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            <i className={`fab fa-${platform === 'whatsapp' ? 'whatsapp' : platform === 'telegram' ? 'telegram' : platform}`}></i>
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setShowShareConfirmation(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAutomatedShare}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        <i className="fas fa-magic mr-1"></i>
                        Share Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Admin Share Menu - Multiple Options */}
            {showShareMenu && isAdmin && (
              <div className="absolute right-0 bottom-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10 min-w-[120px]">
                <button
                  onClick={() => shareProduct('facebook')}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <i className="fab fa-facebook text-blue-600" /> Facebook
                </button>
                <button
                  onClick={() => shareProduct('twitter')}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <i className="fab fa-twitter text-blue-400" /> Twitter
                </button>
                <button
                  onClick={() => shareProduct('whatsapp')}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <i className="fab fa-whatsapp text-green-500" /> WhatsApp
                </button>
                <button
                  onClick={() => shareProduct('copy')}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <i className="fas fa-copy text-gray-500" /> Copy Link
                </button>
              </div>
            )}
            
            {/* Public User Share Menu - Single Basic Share */}
            {showShareMenu && !isAdmin && (
              <div className="absolute right-0 bottom-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-10 min-w-[120px]">
                <button
                  onClick={() => shareProduct('copy')}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                >
                  <i className="fas fa-share text-gray-500" /> Share Link
                </button>
              </div>
            )}
          </div>
          
          {/* Delete Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Delete product (Admin)"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? (
                <i className="fas fa-spinner fa-spin text-xs" />
              ) : (
                <i className="fas fa-trash text-xs" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}