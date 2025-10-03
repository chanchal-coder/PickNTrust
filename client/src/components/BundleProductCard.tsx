import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink, Heart, Share2, Trash2 } from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import EnhancedPriceTag from './EnhancedPriceTag';

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

interface BundleProductCardProps {
  product: Product;
  source?: string;
  showCommissionInfo?: boolean;
  onProductClick?: (product: Product) => void;
}

export function BundleProductCard({ 
  product, 
  source = 'general',
  showCommissionInfo = false,
  onProductClick 
}: BundleProductCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);
  
  const isWishlisted = isInWishlist(product.id);
  const additionalProducts = product.sourceMetadata?.additionalProducts || [];
  const totalInGroup = Number(product.totalInGroup) || 1;
  const isBundle = totalInGroup > 1;
  const isLargeBundle = totalInGroup >= 4;
  const isSmallBundle = totalInGroup >= 2 && totalInGroup <= 3;

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: String(product.price),
        imageUrl: (product.imageUrl || product.image_url || ""),
        affiliateUrl: (product.affiliateUrl || product.affiliate_url || ""),
        source: source
      });
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this deal: ${product.name}`,
          url: (product.affiliateUrl || product.affiliate_url || ""),
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText((product.affiliateUrl || product.affiliate_url || ""));
        toast({
          title: "Link copied!",
          description: "Product link has been copied to clipboard.",
        });
      }
    } else {
      navigator.clipboard.writeText((product.affiliateUrl || product.affiliate_url || ""));
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string | number | undefined) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const formatPrice = (price?: string | number | number | undefined, currency: string = 'INR') => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
    const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) : price;
    return `${symbol}${Math.round(numPrice || 0).toLocaleString()}`;
  };

  const getNumericValue = (value: string | number | undefined | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  const getBooleanValue = (value: boolean | number | undefined): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    return false;
  };

  // Single product display (current behavior)
  if (!isBundle) {
    return (
      <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* Product Image */}
        <div className="relative">
          <img 
            src={(product.imageUrl || product.image_url || "")} 
            alt={product.name} 
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {(() => {
              // Calculate discount percentage from original price and current price
              const currentPrice = getNumericValue(product.price);
              const originalPrice = getNumericValue(product.originalPrice);
              const dbDiscount = getNumericValue(product.discount);
              
              // Use database discount if available, otherwise calculate from prices
              const discountPercentage = dbDiscount > 0 ? dbDiscount : 
                (originalPrice > currentPrice && originalPrice > 0) ? 
                  Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
              
              return discountPercentage > 0 ? (
                <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
                  -{discountPercentage}% OFF
                </Badge>
              ) : null;
            })()}
            {getBooleanValue(product.isNew) && (
              <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
                NEW
              </Badge>
            )}
            {getBooleanValue(product.isFeatured) && (
              <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
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
          <div className="space-y-1">
            {product.price && getNumericValue(product.price) > 0 ? (
              // Show price for products with pricing (hide if price is 0)
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.originalPrice && getNumericValue(product.originalPrice) > getNumericValue(product.price) && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice, product.currency)}
                    </span>
                  )}
                </div>
                {/* Green Savings Message */}
                {product.originalPrice && getNumericValue(product.originalPrice) > getNumericValue(product.price) && (
                  <div className="text-xs text-green-600 font-medium">
                    You save {formatPrice(getNumericValue(product.originalPrice) - getNumericValue(product.price), product.currency)}
                  </div>
                )}
              </div>
            ) : (
              // Show description when no price available
              product.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {product.description}
                </div>
              )
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => window.open((product.affiliateUrl || product.affiliate_url || ""), '_blank')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {product.price && getNumericValue(product.price) > 0 ? 'Buy Now' : 'Learn More'}
            </Button>
            {/* Admin Share Button */}
            {isAdmin && (
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="px-3"
                title="Share product (Admin)"
              >
                <Share2 className="w-4 h-4" />
              </Button>
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
                className="px-3"
                title="Share product link"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            {isAdmin && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                className="px-3"
                disabled={deleteProductMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Small bundle display (2-3 products) - Individual cards with grouping
  if (isSmallBundle) {
    return (
      <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* Bundle Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <Badge className="bg-blue-600 text-white text-xs font-bold px-2 py-1">
              <i className="fas fa-box"></i> Part of {totalInGroup}-product bundle
            </Badge>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Product {Number(product.productSequence) || 1} of {totalInGroup}
            </span>
          </div>
        </div>

        {/* Standard Product Content */}
        <div className="relative">
          <img 
            src={(product.imageUrl || product.image_url || "")} 
            alt={product.name} 
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {getNumericValue(product.discount) > 0 && (
              <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
                -{getNumericValue(product.discount)}% OFF
              </Badge>
            )}
            {getBooleanValue(product.isNew) && (
              <Badge className="bg-orange-500 text-white text-xs font-bold px-2 py-1 shadow-lg">
                NEW
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
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
            {product.name}
          </h3>

          {product.rating && getNumericValue(product.reviewCount) > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-yellow-500"><i className="fas fa-star"></i></span>
              <span className="font-medium">{product.rating}</span>
              <span className="text-gray-500">({getNumericValue(product.reviewCount || 0).toLocaleString()})</span>
            </div>
          )}

          {product.price && getNumericValue(product.price) > 0 ? (
            <EnhancedPriceTag
              product={{
                ...product,
                currency: product.currency || 'INR',
                originalPrice: product.originalPrice ?? product.original_price ?? null,
                pricingType: product.pricingType,
                monthlyPrice: product.monthlyPrice,
                yearlyPrice: product.yearlyPrice,
                isFree: product.isFree,
                priceDescription: product.priceDescription,
                discount: product.discount
              }}
              colorClass="text-green-600 dark:text-green-400"
              originalClass="text-gray-500 line-through text-sm"
              freeClass="text-green-600 dark:text-green-400"
              helperClass="text-xs text-gray-500"
              discountClass="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold"
              showDiscountBadge={false}
            />
          ) : (
            product.description && (
              <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {product.description}
              </div>
            )
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => window.open((product.affiliateUrl || product.affiliate_url || ""), '_blank')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {product.price && getNumericValue(product.price) > 0 ? 'Buy Now' : 'Learn More'}
            </Button>
            {/* Admin Share Button */}
            {isAdmin && (
              <Button onClick={handleShare} variant="outline" size="sm" className="px-3" title="Share product (Admin)">
                <Share2 className="w-4 h-4" />
              </Button>
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
                className="px-3"
                title="Share product link"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            {isAdmin && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                className="px-3"
                disabled={deleteProductMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Large bundle display (4+ products) - Primary product with expandable view
  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {/* Bundle Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
              <i className="fas fa-shopping-bag"></i> {product.sourceMetadata?.bundleType === 'mega_sale' ? 'MEGA SALE BUNDLE' : 'PRODUCT BUNDLE'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {totalInGroup} products in this bundle
            </p>
          </div>
          <Badge className="bg-purple-600 text-white text-xs font-bold px-3 py-1">
            Bundle Deal
          </Badge>
        </div>
      </div>

      {/* Primary Product */}
      <div className="relative">
        <img 
          src={(product.imageUrl || product.image_url || "")} 
          alt={product.name} 
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Primary Product Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge className="bg-purple-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
            Featured Product
          </Badge>
          {getNumericValue(product.discount) > 0 && (
            <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
              -{getNumericValue(product.discount)}% OFF
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
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Primary Product Info */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
            {product.name}
          </h3>
          
          {product.rating && getNumericValue(product.reviewCount) > 0 && (
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-yellow-500"><i className="fas fa-star"></i></span>
              <span className="font-medium">{product.rating}</span>
              <span className="text-gray-500">({getNumericValue(product.reviewCount || 0).toLocaleString()})</span>
            </div>
          )}
        </div>

        {/* Primary Product Price */}
        {product.price && getNumericValue(product.price) > 0 ? (
          <EnhancedPriceTag
            product={{
              ...product,
              currency: product.currency || 'INR',
              originalPrice: product.originalPrice ?? product.original_price ?? null,
              pricingType: product.pricingType,
              monthlyPrice: product.monthlyPrice,
              yearlyPrice: product.yearlyPrice,
              isFree: product.isFree,
              priceDescription: product.priceDescription,
              discount: product.discount
            }}
            colorClass="text-green-600 dark:text-green-400"
            originalClass="text-gray-500 line-through text-sm"
            freeClass="text-green-600 dark:text-green-400"
            helperClass="text-xs text-gray-500"
            discountClass="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold"
            showDiscountBadge={false}
          />
        ) : (
          product.description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </div>
          )
        )}

        {/* Bundle Info */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <i className="fas fa-box"></i> + {additionalProducts.length} more deals in this bundle
            </span>
            <Button
              onClick={() => setExpanded(!expanded)}
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3 mr-1" />Collapse</>
              ) : (
                <><ChevronDown className="w-3 h-3 mr-1" />Show all {totalInGroup}</>
              )}
            </Button>
          </div>

          {/* Expanded Bundle Items */}
          {expanded && additionalProducts.length > 0 && (
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              {additionalProducts.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-green-600">
                      {formatPrice(item.price, product.currency)}
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(item.url, '_blank')}
                    size="sm"
                    className="ml-2 bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1 h-7"
                  >
                    Buy
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary Product Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => window.open((product.affiliateUrl || product.affiliate_url || ""), '_blank')}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Buy Featured Product
          </Button>
          {/* Admin Share Button */}
          {isAdmin && (
            <Button onClick={handleShare} variant="outline" size="sm" className="px-3" title="Share product (Admin)">
              <Share2 className="w-4 h-4" />
            </Button>
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
              className="px-3"
              title="Share product link"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          )}
          {isAdmin && (
            <Button
              onClick={handleDelete}
              variant="destructive"
              size="sm"
              className="px-3"
              disabled={deleteProductMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BundleProductCard;