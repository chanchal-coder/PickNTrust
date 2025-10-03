// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedPriceTag from './EnhancedPriceTag';
import { Button } from '@/components/ui/button';
import { formatPrice, CurrencyCode } from '@/utils/currency';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';

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

interface BrowseCategoryProductCardProps {
  product: Product;
  showCommissionInfo?: boolean;
  showPriceComparison?: boolean;
}

export default function BrowseCategoryProductCard({ 
  product, 
  showCommissionInfo = true, 
  showPriceComparison = true 
}: BrowseCategoryProductCardProps) {
  // Helper function to safely format prices with proper currency type
  const formatProductPrice = (price?: string | number | number | undefined, currency?: string): string => {
    const numericPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) || 0 : price;
    const currencyCode = (currency as CurrencyCode) || 'INR';
    return formatPrice(numericPrice, currencyCode);
  };

  // Helper function to safely parse price to number
  const parseToNumber = (price?: string | number | number | undefined): number => {
    return typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) || 0 : price;
  };

  // Helper function to safely convert to string for parseFloat
  const parseToFloat = (price?: string | number | number | undefined): number => {
    return typeof price === 'number' ? price : parseFloat(price.toString()) || 0;
  };
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedSource, setSelectedSource] = useState(0);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const isWishlisted = isInWishlist(typeof product.id === 'string' ? parseInt(product.id) || 0 : product.id);

  // Prepare all available sources (primary + alternatives)
  const allSources = [
    {
      network: product.affiliateNetworkName || 'Primary',
      price: product.price,
      originalPrice: product.originalPrice,
      url: (product.affiliateUrl || product.affiliate_url || ""),
      commission: product.commissionRate || 0,
      isPrimary: true
    },
    ...(product.alternativeSources || [])
  ];

  const currentSource = allSources[selectedSource];
  const hasMultipleSources = allSources.length > 1;
  const bestCommissionSource = allSources.reduce((best, current) => 
    current.commission > best.commission ? current : best
  );

  // Delete product mutation (admin only)
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number | string) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
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

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(typeof product.id === 'string' ? parseInt(product.id) || 0 : product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist({
        ...product,
        id: typeof product.id === 'string' ? parseInt(product.id) || 0 : product.id,
        description: product.description || '',
        price: typeof product.price === 'number' ? product.price.toString() : product.price,
        originalPrice: product.originalPrice ? (typeof product.originalPrice === 'number' ? product.originalPrice.toString() : product.originalPrice) : null,
        affiliateNetworkId: product.affiliateNetworkId || null,
        affiliateNetworkName: product.affiliateNetworkName || null,
        gender: product.gender || null,
        rating: product.rating || '0',
        reviewCount: product.reviewCount || 0,
        discount: product.discount || null,
        isNew: product.isNew || false,
        isFeatured: product.isFeatured || false,
        hasTimer: product.hasTimer || false,
        timerDuration: product.timerDuration || null,
        timerStartTime: product.timerStartTime ? new Date(product.timerStartTime) : null,
        createdAt: product.createdAt ? new Date(product.createdAt) : null
      } as any);
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const handleSourceChange = (index: number) => {
    setSelectedSource(index);
    setShowAlternatives(false);
  };

  const calculateSavings = (original: string | number | undefined, current: string | number | undefined) => {
    const originalNum = parseToFloat(original);
    const currentNum = parseToFloat(current);
    return originalNum > currentNum ? originalNum - currentNum : 0;
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {/* Commission Badge */}
      {showCommissionInfo && currentSource.commission > 0 && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-green-500 text-white text-xs font-bold px-2 py-1 shadow-lg">
            <i className="fas fa-dollar-sign"></i> {currentSource.commission}% Commission
          </Badge>
        </div>
      )}

      {/* Best Deal Badge */}
      {hasMultipleSources && currentSource === bestCommissionSource && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 shadow-lg animate-pulse">
            <i className="fas fa-trophy"></i> Best Deal
          </Badge>
        </div>
      )}

      {/* Product Badges */}
      <div className="absolute top-12 left-2 z-10 flex flex-col gap-1">
        {/* Discount Badge */}
        {(() => {
          // Calculate discount percentage from original price and current price
          const currentPrice = parseToFloat(currentSource.price);
          const originalPrice = parseToFloat(currentSource.originalPrice);
          const dbDiscount = product.discount ? parseFloat(product.discount.toString()) : 0;
          
          // Use database discount if available, otherwise calculate from prices
          const discountPercentage = dbDiscount > 0 ? dbDiscount : 
            (originalPrice > currentPrice && originalPrice > 0) ? 
              Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
          
          return discountPercentage > 0 ? (
            <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-1 shadow-lg">
              -{discountPercentage}% OFF
            </Badge>
          ) : null;
        })()}
        {/* New Badge */}
        {product.isNew && (
          <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
            NEW
          </Badge>
        )}
        {/* Featured Badge */}
        {product.isFeatured && (
          <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg">
            FEATURED
          </Badge>
        )}
        {/* Limited Offer Badge - Only when real website has limited offer */}
        {product.hasLimitedOffer && (
          <Badge className="bg-red-600 text-white text-xs font-bold px-2 py-1 shadow-lg animate-pulse">
            {product.limitedOfferText || 'Limited Deal'}
          </Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className={`absolute top-2 right-12 z-10 p-2 rounded-full transition-all duration-200 ${
          isWishlisted 
            ? 'bg-red-500 text-white shadow-lg' 
            : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
        }`}
      >
        <i className={`fas fa-heart text-sm ${isWishlisted ? 'text-white' : ''}`}></i>
      </button>

      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-700">
          <img
            src={(product.imageUrl || product.image_url || "")}
            alt={product.name}
            className="w-full h-64 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Network Badge on Image */}
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
              {currentSource.network}
            </Badge>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {/* Rating & Reviews */}
          {product.rating && product.reviewCount && product.reviewCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500"><i className="fas fa-star"></i></span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {product.rating}
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-400">
                ({(product.reviewCount || 0).toLocaleString()} reviews)
              </span>
            </div>
          )}

          {/* Price Section or Description */}
          <div className="space-y-2">
            {currentSource.price && parseToFloat(currentSource.price) > 0 ? (
              <div className="space-y-1">
                {/* Enhanced Price Display */}
                <EnhancedPriceTag
                  product={{
                    ...product,
                    price: currentSource.price,
                    originalPrice: currentSource.originalPrice,
                    currency: product.currency || 'INR',
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
                
                {/* Multiple Sources Indicator */}
                {hasMultipleSources && showPriceComparison && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowAlternatives(!showAlternatives)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <i className="fas fa-exchange-alt"></i>
                      {allSources.length} sources
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Show description when no price available
              product.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {product.description}
                </div>
              )
            )}
          </div>

          {/* Alternative Sources Dropdown */}
          {showAlternatives && hasMultipleSources && showPriceComparison && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-2 space-y-1 bg-gray-50 dark:bg-gray-700">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Compare prices:
              </div>
              {allSources.map((source, index) => (
                <button
                  key={index}
                  onClick={() => handleSourceChange(index)}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    index === selectedSource
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{source.network}</span>
                      {source.commission > 0 && (
                        <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0">
                          {source.commission}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-green-600">
                        {formatProductPrice(source.price, product.currency)}
                      </span>
                      {source.originalPrice && parseToFloat(source.originalPrice) > parseToFloat(source.price) && (
                        <span className="text-gray-500 line-through text-xs">
                          {formatProductPrice(source.originalPrice, product.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => window.open(currentSource.url, '_blank')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
            >
              <i className="fas fa-external-link-alt mr-2"></i>
              {currentSource.price && parseToFloat(currentSource.price) > 0 ? 'View Deal' : 'Learn More'}
            </Button>
            
            {/* Admin Delete Button */}
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
            
            {showCommissionInfo && currentSource.commission > 0 && (
              <div className="flex items-center text-xs text-green-600 font-medium px-2">
                <i className="fas fa-coins mr-1"></i>
                Earn {currentSource.commission}%
              </div>
            )}
          </div>

          {/* Commission Info */}
          {showCommissionInfo && currentSource.commission > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1 border-t border-gray-200 dark:border-gray-600">
              <i className="fas fa-lightbulb"></i> We earn a small commission when you purchase through this link
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}