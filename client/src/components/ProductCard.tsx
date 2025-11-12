// @ts-nocheck
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart, Share2, Trash2 } from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProduct, invalidateAllProductQueries } from '@/utils/delete-utils';
import { useState, useEffect } from 'react';
import EnhancedShare from '@/components/enhanced-share';
import { ProductTimer } from '@/components/product-timer';

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

interface ProductCardProps {
  product: Product;
  source?: string;
  showCommissionInfo?: boolean;
  onProductClick?: (product: Product) => void;
}

export function ProductCard({ 
  product, 
  source = 'general',
  showCommissionInfo = false,
  onProductClick 
}: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin authentication with proper validation
  useEffect(() => {
    const checkAdminAuth = () => {
      const adminSession = localStorage.getItem('pickntrust-admin-session');
      const adminToken = localStorage.getItem('pickntrust-admin-token');
      const adminPassword = localStorage.getItem('pickntrust-admin-password');
      
      // Use the same strict validation as the admin auth hook
      const isValidAdmin = (
        adminSession === 'active' &&
        adminToken &&
        adminPassword === 'pickntrust2025' &&
        adminToken.length > 10
      ) || window.location.hostname === 'localhost'; // Localhost fallback for development
      
      setIsAdmin(isValidAdmin);
    };

    checkAdminAuth();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('pickntrust-admin')) {
        checkAdminAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const isWishlisted = isInWishlist(product.id);

  // Delete product mutation (admin only)
  const deleteProductMutation = useMutation({
    mutationFn: (productId: number | string) => deleteProduct(productId, undefined, 'pickntrust2025'),
    onSuccess: () => {
      invalidateAllProductQueries(queryClient);
      toast({
        title: 'Product Deleted',
        description: `${product.name} has been deleted successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist(product);
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this amazing deal: ${product.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  const getNumericValue = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getBooleanValue = (value: boolean | number | undefined): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    return false;
  };

  const formatPrice = (price?: string | number, currency: string = 'INR'): string => {
    const numericPrice = getNumericValue(price);
    if (numericPrice === 0) return 'Free';
    if (currency === 'INR') {
      return `₹${Math.round(numericPrice).toLocaleString('en-IN')}`;
    }
    return `${currency} ${Math.round(numericPrice).toLocaleString()}`;
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {/* Product Image */}
      <div className="relative">
        {(() => {
          const raw = product.imageUrl || product.image_url || '';
          if (raw) {
            const proxied = `/api/image-proxy?url=${encodeURIComponent(raw)}&width=640&height=360&quality=80&format=webp`;
            return (
              <img
                src={proxied}
                alt={product.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            );
          }
          return (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-sm">No image available</div>
            </div>
          );
        })()}
        
      {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* Discount Badge - show ONLY when both original and current prices are valid */}
          {(() => {
            const originalPriceValue = getNumericValue(product.originalPrice || product.original_price);
            const priceValue = getNumericValue(product.price);

            const hasValidPrices = originalPriceValue > 0 && priceValue > 0 && originalPriceValue > priceValue;
            if (!hasValidPrices) return null;

            const calculatedDiscount = Math.round(((originalPriceValue - priceValue) / originalPriceValue) * 100);
            return calculatedDiscount > 0 ? (
              <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg animate-pulse">
                {calculatedDiscount}% OFF
              </Badge>
            ) : null;
          })()}
          
          {getBooleanValue(product.isNew) && (
            <Badge className="bg-green-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
              NEW
            </Badge>
          )}
          {getBooleanValue(product.isFeatured) && (
            <Badge className="bg-purple-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
              FEATURED
            </Badge>
          )}
          {getBooleanValue(product.hasLimitedOffer) && (
            <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg animate-pulse">
              {product.limitedOfferText || 'Limited Deal'}
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
            isWishlisted 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Network Badge */}
        {product.networkBadge && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
              {product.networkBadge}
            </Badge>
          </div>
        )}
      </div>

      {/* Product Info */}
      <CardContent className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Rating & Reviews */}
        {product.rating && getNumericValue(product.reviewCount) > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500"><i className="fas fa-star"></i></span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {product.rating}
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              ({getNumericValue(product.reviewCount || 0).toLocaleString()} reviews)
            </span>
          </div>
        )}

        {/* Price or Description */}
        <div className="space-y-2">
          {product.price && getNumericValue(product.price) > 0 ? (
            // Enhanced pricing display for products
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatPrice(product.price, product.currency)}
                </span>
                {(() => {
                  const original = getNumericValue(product.originalPrice || product.original_price);
                  const discountNum = getNumericValue(product.discount);
                  const priceNum = getNumericValue(product.price);
                  const effectiveOriginal = original > 0 ? original : (discountNum > 0 && priceNum > 0 && discountNum < 100)
                    ? Math.round(priceNum / (1 - discountNum / 100))
                    : 0;
                  return effectiveOriginal > priceNum ? (
                  <>
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      {formatPrice(effectiveOriginal, product.currency)}
                    </span>
                  </>
                  ) : null;
                })()}
              </div>
              {/* Enhanced Savings Message */}
              {(() => {
                const original = getNumericValue(product.originalPrice || product.original_price);
                const discountNum = getNumericValue(product.discount);
                const priceNum = getNumericValue(product.price);
                const effectiveOriginal = original > 0 ? original : (discountNum > 0 && priceNum > 0 && discountNum < 100)
                  ? Math.round(priceNum / (1 - discountNum / 100))
                  : 0;
                return effectiveOriginal > priceNum ? (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  💰 You save {formatPrice(effectiveOriginal - priceNum, product.currency)}
                </div>
                ) : null;
              })()}
              {/* Live Deal Timer */}
              <div className="pt-1">
                <ProductTimer product={product} />
              </div>
              {/* Product Description for products with price */}
              {product.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                  {product.description}
                </div>
              )}
            </div>
          ) : (
            // Show description for text-only cards (no price display when amount is 0)
            product.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {product.description}
              </div>
            )
          )}
        </div>

        {/* Action Buttons - Enhanced */}
        <div className="flex gap-2 pt-3">
          <Button
            onClick={() => window.open((product.affiliateUrl || product.affiliate_url || ""), '_blank')}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {product.price && getNumericValue(product.price) > 0 ? '🛒 Buy Now' : '📖 Learn More'}
          </Button>
          {/* Admin Enhanced Share Button - Multiple Options */}
          {isAdmin && (
            <EnhancedShare
              product={{
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                imageUrl: product.imageUrl || product.image_url,
                category: product.category,
                affiliateUrl: product.affiliateUrl || product.affiliate_url
              }}
              contentType={product.content_type === 'service' ? 'service' : product.content_type === 'app' ? 'app' : 'product'}
              className="px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              buttonText=""
              showIcon={true}
            />
          )}
          
          {/* Public User Simple Share Button */}
          {!isAdmin && (
            <Button
              onClick={() => {
                const productUrl = `${window.location.origin}/product/${product.id}`;
                navigator.clipboard.writeText(productUrl);
                toast({
                  title: 'Link Copied',
                  description: 'Product link copied to clipboard',
                });
              }}
              variant="outline"
              size="sm"
              className="px-3 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              title="Share product link"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}
          {/* Delete Button (Admin Only) */}
          {isAdmin && (
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={deleteProductMutation.isPending}
              title="Delete product (Admin)"
            >
              {deleteProductMutation.isPending ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductCard;