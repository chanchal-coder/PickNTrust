// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductTimer } from "@/components/product-timer";
import EnhancedShare from "@/components/enhanced-share";
import SmartShareDropdown from "@/components/SmartShareDropdown";
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';
import { useCurrency, getCurrencySymbol, CurrencyCode } from '@/contexts/CurrencyContext';
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';
import EnhancedPriceTag from '@/components/EnhancedPriceTag';
import Sidebar from '@/components/sidebar';


// Define Product type locally to avoid schema conflicts
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

// No fallback data - show real featured products or simple message

export default function FeaturedProducts() {
  const { currentCurrency, formatPrice: formatCurrencyPrice, convertPrice } = useCurrency();
  // Daily rotation logic - get different products each day
  const getDailyRotationOffset = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return dayOfYear % 10; // Rotate every day, cycle through 10 different sets
  };

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products/page/top-picks', getDailyRotationOffset()],
    queryFn: async () => {
      try {
        // Fetch latest featured products from top-picks page (filters by isFeatured=true)
        const response = await fetch('/api/products/page/top-picks');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // Apply daily rotation - show different products each day
            const rotationOffset = getDailyRotationOffset() % data.length;
            const rotatedData = [...data.slice(rotationOffset), ...data.slice(0, rotationOffset)];
            const previewData = rotatedData.slice(0, 8);
            console.log(`Featured Products: Showing ${previewData.length} featured products from top-picks`);
            return previewData;
          }
        }
        
        console.log('No featured products available from top-picks page');
        return [];
      } catch (error) {
        console.log('Top-picks API error:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour, but rotation changes daily
  });
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const queryClient = useQueryClient();

  // Enhanced color palette without grey colors
  const colorPalette = [
    'bg-blue-500',
    'bg-emerald-500', 
    'bg-red-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-amber-500',
    'bg-violet-500'
  ];

  // Function to get color ensuring no adjacent duplicates
  const getCardColor = (index: number, totalProducts: number) => {
    // For small arrays, use simple distribution
    if (totalProducts <= colorPalette.length) {
      return colorPalette[index % colorPalette.length];
    }
    
    // For larger arrays, use a more sophisticated distribution
    const colorIndex = (index * 7) % colorPalette.length; // Prime number for better distribution
    return colorPalette[colorIndex];
  };

  // Helper function to format product price without conversion (displays original currency)
  const formatProductPrice = (price?: string | number | number | undefined, productCurrency?: string) => {
    const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) : price;
    const originalCurrency = (productCurrency?.toString().toUpperCase() as CurrencyCode) || 'USD';
    
    // Always display in the product's original currency (no conversion)
    return formatCurrencyPrice(numPrice, originalCurrency);
  };

  // Admin state management
  const [isAdmin, setIsAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Sidebar state management
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: 100000});
  const [minRating, setMinRating] = useState<number>(0);
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);
  
  // Handle share modal
  const handleShareToAll = (product: Product) => {
    setSelectedProduct(product);
    setShareModalOpen(true);
  };
  
  const handleConfirmShare = async () => {
    try {
      if (selectedProduct) {
        const { sendProductToTelegram } = await import('@/utils/telegram');
        await sendProductToTelegram({
          id: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: selectedProduct.price,
          originalPrice: (selectedProduct as any).originalPrice,
          imageUrl: selectedProduct.imageUrl || (selectedProduct as any).image_url,
          affiliateUrl: selectedProduct.affiliateUrl || (selectedProduct as any).affiliate_url,
        }, { pageSlug: 'top-picks' });
      }
      alert('✅ Shared to Telegram');
    } catch (err) {
      console.error('Telegram share failed:', err);
      alert('❌ Telegram share failed');
    } finally {
      setShareModalOpen(false);
      setSelectedProduct(null);
    }
  };
  
  const handleCloseModal = () => {
    setShareModalOpen(false);
    setSelectedProduct(null);
  };

  // Sidebar handler functions
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({ min, max });
  };

  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
  };

  // Use API data if available, otherwise use fallback data
  const displayProducts = products && products.length > 0 ? products : [];

  // Filter products based on sidebar selections
  const filteredProducts = displayProducts.filter((product: Product) => {
    // Category filter
    if (selectedCategory && selectedCategory !== 'All Products' && product.category !== selectedCategory) {
      return false;
    }

    // Price filter
    const productPrice = typeof product.price === 'string' 
      ? parseFloat(product.price.replace(/[^\d.-]/g, '')) 
      : (product.price || 0);
    if (productPrice < priceRange.min || productPrice > priceRange.max) {
      return false;
    }

    // Rating filter
    const productRating = typeof product.rating === 'string' 
      ? parseFloat(product.rating) 
      : (product.rating || 0);
    if (productRating < minRating) {
      return false;
    }

    return true;
  });

  // Get available categories from products
  const availableCategories = Array.from(new Set(displayProducts.map((product: Product) => product.category).filter(Boolean)));

  const trackAffiliateMutation = useMutation({
    mutationFn: async (data: { productId: number; affiliateUrl: string }) => {
      const response = await fetch('/api/affiliate/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to track affiliate click');
      }
      return response.json();
    },
  });

  const handleAffiliateClick = (product: Product) => {
    // Track the click
    trackAffiliateMutation.mutate({
      productId: product.id,
      affiliateUrl: (product.affiliateUrl || product.affiliate_url || "")
    });
    
    // Open affiliate link in new tab
    window.open((product.affiliateUrl || product.affiliate_url || ""), '_blank', 'noopener,noreferrer');
  };

  const handleWishlistToggle = (product: Product) => {
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

  // Delete product mutation with comprehensive cache invalidation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Product deleted from everywhere on the website!',
      });
      
      // Comprehensive cache invalidation - remove from ALL locations
      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/services'] });
      
      // Invalidate all category-specific queries
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === '/api/products/category' 
      });
      
      // Invalidate admin stats and management queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Clear all cached product data to ensure fresh fetch
      queryClient.removeQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].includes('/api/products')
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  });

  const handleDelete = (productId: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleShare = (platform: string, product: Product) => {
    const productUrl = `${window.location.origin}`;
    const productText = `Check out this amazing deal: ${product.name} - ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/profile.php?id=61578969445670`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/+m-O-S6SSpVU2NWU1`;
        break;
      case 'twitter':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(productText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'instagram':
        const instagramText = `<i className="fas fa-shopping-bag"></i> Amazing Deal Alert! ${product.name} - Only ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''}! <i className="fas fa-dollar-sign"></i>\n\n<i className="fas fa-sparkles"></i> Get the best deals at PickNTrust\n\n#PickNTrust #Deals #Shopping #BestPrice`;
        navigator.clipboard.writeText(instagramText + '\n\n' + productUrl);
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        return;
      case 'pinterest':
        shareUrl = `https://www.pinterest.com/PickNTrust/`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(prev => ({...prev, [product.id]: false}));
  };

  const renderStars = (rating: string) => {
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 !== 0;
    
    return (
      <div className="flex items-center text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <i 
            key={i}
            className={`text-xs ${
              i < fullStars 
                ? 'fas fa-star' 
                : i === fullStars && hasHalfStar 
                  ? 'fas fa-star-half-alt' 
                  : 'far fa-star'
            }`}
          ></i>
        ))}
      </div>
    );
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  // Attach non-passive wheel listener to enable preventDefault without warnings
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: any) => {
      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as EventListener);
  }, [filteredProducts]);

  return (
    <section id="featured-products" className="py-8 sm:py-12 lg:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4 relative leading-tight">
              Today's Top Picks
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce"><i className="fas fa-fire"></i></div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"><i className="fas fa-sparkles"></i> Hand-selected deals you can trust <i className="fas fa-sparkles"></i></span>
          </p>
        </div>
        
        {/* Products Section - No Sidebar on Home Page */}
        <div className="w-full">
            {/* Horizontal Scrollable Container with Border */}
            <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-white/50 dark:bg-gray-800/50">
              {/* Left Arrow */}
              <button
                onClick={scrollLeft}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl rounded-full p-3 transition-all transform hover:scale-110 hidden md:block"
              >
                <i className="fas fa-chevron-left text-lg"></i>
              </button>

              {/* Right Arrow */}
              <button
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl rounded-full p-3 transition-all transform hover:scale-110 hidden md:block"
              >
                <i className="fas fa-chevron-right text-lg"></i>
              </button>

              {/* Coming Soon Message - Desktop */}
              {filteredProducts.length === 0 ? (
                <div className="hidden md:flex items-center justify-center py-16 px-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4"><i className="fas fa-rocket"></i></div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {displayProducts.length === 0 ? 'Exciting Deals Coming Soon!' : 'No products match your filters'}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                      {displayProducts.length === 0 ? 'Stay tuned for today\'s hottest picks and amazing deals' : 'Try adjusting your filters to see more products'}
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium">
                      <span className="animate-pulse mr-2">⏰</span>
                      {displayProducts.length === 0 ? 'New products added daily' : 'Clear filters to see all products'}
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop: Scrollable Products Container - Single Row */
                <div 
                  ref={scrollContainerRef}
                  className="hidden md:flex gap-4 overflow-x-auto pb-6 px-12 md:px-16"
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-x'
                  }}
                >
              {filteredProducts.map((product: Product, index: number) => (
              <div 
                key={product.id}
                className="flex-shrink-0 w-[320px] bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Product Image with colored border */}
                <div className={`relative p-3 ${getCardColor(index, filteredProducts.length)}`}>
                  <div className="w-full h-40 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={(product.imageUrl || product.image_url || "")} 
                      alt={product.name} 
                      className="w-full h-full object-contain p-2" 
                    />
                  </div>
                  
                  {/* Wishlist Heart Icon */}
                  <button
                    onClick={() => handleWishlistToggle(product)}
                    className={`absolute top-5 left-5 p-1.5 rounded-full shadow-md transition-colors ${
                      isInWishlist(product.id) 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-white text-gray-400 hover:text-red-500'
                    }`}
                    title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className="fas fa-heart text-xs"></i>
                  </button>
                </div>
                
                {/* Product Content */}
                <div className="p-4 bg-gray-800 text-white space-y-2 relative">
                  {/* Admin Action Buttons - Top Right */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      {/* Share to All Platforms Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleShareToAll(product);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors cursor-pointer z-10 relative"
                        title="Share to All Platforms"
                      >
                        <i className="fas fa-edit text-xs pointer-events-none"></i>
                      </button>
                      
                      {/* Individual Share Button */}
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
                        contentType="product"
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-colors"
                        buttonText=""
                        showIcon={true}
                      />

                      {/* Delete Button - Admin Only */}
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                        title="Delete product"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  )}
                  
                  {/* Public User Share Button - Top Right */}
                  {!isAdmin && (
                    <div className="absolute top-2 right-2">
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
                        contentType="product"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-md transition-colors"
                        buttonText=""
                        showIcon={true}
                      />
                    </div>
                  )}

                  {/* Discount Badge - show ONLY when both original and current prices are valid */}
                  {(() => {
                    const originalVal = Number((product as any).originalPrice || (product as any).original_price || 0);
                    const currentVal = Number(product.price || 0);
                    const hasValidPrices = originalVal > 0 && currentVal > 0 && originalVal > currentVal;
                    if (!hasValidPrices) return null;
                    const pct = Math.round(((originalVal - currentVal) / originalVal) * 100);
                    return pct > 0 ? (
                      <div className="flex justify-start">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{pct}% OFF
                        </span>
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Rating */}
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                    <span className="text-gray-300 ml-1 text-xs">({product.reviewCount})</span>
                  </div>
                  
                  {/* Product Name */}
                  <h4 className="font-bold text-sm text-blue-400 leading-tight pr-16">{product.name}</h4>
                  
                  {/* Product Description */}
                  <p className="text-gray-300 text-xs leading-relaxed line-clamp-2">
                    {product.description && product.description.length > 80 
                      ? `${product.description.substring(0, 80)}...` 
                      : product.description
                    }
                  </p>
                  
                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    <EnhancedPriceTag 
                      product={product}
                      colorClass="text-blue-400"
                      originalClass="text-gray-500 line-through text-sm"
                      freeClass="text-green-400"
                      helperClass="text-xs text-gray-500"
                      discountClass="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold"
                      showDiscountBadge={false}
                    />
                  </div>
                  
                  {/* Timer */}
                  <div className="py-1">
                    <ProductTimer product={product} />
                  </div>
                  
                  {/* Pick Now Button */}
                  <button 
                    onClick={() => handleAffiliateClick(product)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 text-sm"
                  >
                    <i className="fas fa-shopping-bag mr-2"></i>Pick Now
                  </button>
                  
                  {/* Affiliate Link Text */}
                  <p className="text-[10px] text-gray-400 text-center mt-1">
                    <i className="fas fa-link"></i> Affiliate Link - We earn from purchases
                  </p>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Coming Soon Message - Mobile */}
          {filteredProducts.length === 0 ? (
            <div className="md:hidden flex items-center justify-center py-12 px-4">
              <div className="text-center">
                <div className="text-4xl mb-3"><i className="fas fa-rocket"></i></div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Coming Soon!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Amazing deals loading...
                </p>
                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-medium">
                  <span className="animate-pulse mr-1">⏰</span>
                  Stay tuned
                </div>
              </div>
            </div>
          ) : (
            /* Mobile: Horizontal Scrolling with Smaller Cards */
            <div className="md:hidden flex gap-3 overflow-x-auto pb-4 px-2">
              {filteredProducts.map((product: Product, index: number) => (
              <div 
                key={product.id}
                className="flex-shrink-0 w-64 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Product Image with colored border */}
                <div className={`relative p-2 ${getCardColor(index, filteredProducts.length)}`}>
                  <div className="w-full h-32 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={(product.imageUrl || product.image_url || "")} 
                      alt={product.name} 
                      className="w-full h-full object-contain p-2" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400';
                      }}
                    />
                  </div>
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {/* Discount Badge - show ONLY when both original and current prices are valid */}
                    {(() => {
                      const originalVal = Number(product.originalPrice || (product as any).original_price || 0);
                      const currentVal = Number(product.price || 0);
                      const hasValidPrices = originalVal > 0 && currentVal > 0 && originalVal > currentVal;
                      if (!hasValidPrices) return null;
                      const pct = Math.round(((originalVal - currentVal) / originalVal) * 100);
                      return pct > 0 ? (
                        <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{pct}% OFF
                        </span>
                      ) : null;
                    })()}
                    {/* New Badge */}
                    {product.isNew && (
                      <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        NEW
                      </span>
                    )}
                    {/* Featured Badge */}
                    {product.isFeatured && (
                      <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        FEATURED
                      </span>
                    )}
                    {/* Limited Offer Badge - Only when real website has limited offer */}
                    {product.hasLimitedOffer && (
                      <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                        {product.limitedOfferText || 'Limited Deal'}
                      </span>
                    )}
                  </div>
                  {/* Wishlist Button */}
                  <button
                    onClick={() => handleWishlistToggle(product)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full shadow-sm transition-colors ${
                      isInWishlist(product.id) 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-white text-gray-400 hover:text-red-500'
                    }`}
                    title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className="fas fa-heart text-xs"></i>
                  </button>
                </div>

                {/* Product Content */}
                <div className="p-3 bg-white dark:bg-gray-800">
                  {/* Product Name */}
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2">
                    {product.name}
                  </h4>
                  
                  {/* Price */}
                  <div className="flex items-center space-x-2 mb-3">
                    {/* Enhanced pricing display for services */}
                    {(product as any).isFree || ((product as any).pricingType === 'free') ? (
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                    ) : (product as any).priceDescription ? (
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{(product as any).priceDescription}</span>
                    ) : (product as any).monthlyPrice && (product as any).monthlyPrice !== '0' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatProductPrice((product as any).monthlyPrice, product.currency)}/month</span>
                        {product.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">{formatProductPrice(product.originalPrice, product.currency)}/month</span>
                        )}
                      </div>
                    ) : (product as any).yearlyPrice && (product as any).yearlyPrice !== '0' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatProductPrice((product as any).yearlyPrice, product.currency)}/year</span>
                        {product.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">{formatProductPrice(product.originalPrice, product.currency)}/year</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {/* For regular price, check pricingType to determine suffix */}
                        {(product as any).pricingType === 'monthly' ? (
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatProductPrice(product.price, product.currency)}/month</span>
                        ) : (product as any).pricingType === 'yearly' ? (
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatProductPrice(product.price, product.currency)}/year</span>
                        ) : (
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatProductPrice(product.price, product.currency)}</span>
                        )}
                        {product.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">
                            {formatProductPrice(product.originalPrice, product.currency)}
                            {(product as any).pricingType === 'monthly' ? '/month' : (product as any).pricingType === 'yearly' ? '/year' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timer Message (if hasTimer) */}
                  {product.hasTimer && product.timerDuration && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2 mb-3">
                      <p className="text-red-600 dark:text-red-400 text-xs font-medium">
                        ⏰ {product.timerDuration}h left!
                      </p>
                    </div>
                  )}

                  {/* Pick Now Button */}
                  <button 
                    onClick={() => handleAffiliateClick(product)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 text-sm mb-2"
                  >
                    Pick Now
                  </button>

                  {/* Action Buttons Row */}
                  <div className="flex gap-2 justify-end">
                    {/* Admin Share Buttons - Multiple Options */}
                    {isAdmin && (
                      <>
                        <EnhancedShare 
                          product={{
                            id: product.id,
                            name: product.name,
                            description: product.description || '',
                            price: product.price,
                            imageUrl: product.imageUrl || product.image_url || '',
                            category: product.category || ''
                          }}
                          contentType="product"
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110"
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
                          description: product.description || '',
                          price: product.price,
                          imageUrl: product.imageUrl || product.image_url || '',
                          category: product.category || ''
                        }}
                        contentType="product"
                        className="w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110"
                        buttonText=""
                        showIcon={true}
                      />
                    )}

                    {/* Admin Share Button - Rounded Blue Icon */}
                    {isAdmin && (
                      <div className="relative">
                        <button
                          onClick={() => setShowShareMenu(prev => ({...prev, [product.id]: !prev[product.id]}))}
                          className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110"
                          title="Share product"
                        >
                          <i className="fas fa-share text-sm"></i>
                        </button>
                        
                        {/* Admin Share Menu */}
                        {showShareMenu[product.id] && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1 z-50 min-w-[140px]">
                            <button
                              onClick={() => handleShare('facebook', product)}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                            >
                              <i className="fab fa-facebook text-blue-600"></i>
                              Facebook
                            </button>
                            <button
                              onClick={() => handleShare('whatsapp', product)}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                            >
                              <i className="fab fa-whatsapp text-green-600"></i>
                              WhatsApp
                            </button>
                            <button
                              onClick={() => handleShare('instagram', product)}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                            >
                              <i className="fab fa-instagram text-purple-600"></i>
                              Instagram
                            </button>
                            <button
                              onClick={() => handleShare('telegram', product)}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                            >
                              <i className="fab fa-telegram text-blue-500"></i>
                              Telegram
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delete Button - Only for admin - Rounded Red Icon */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110"
                        title="Delete product"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
        
        {/* More Button */}
        <div className="flex justify-end mt-6">
          <Link 
            href="/top-picks"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="mr-2">More</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
      
      {/* Share Automatically Modal */}
      <ShareAutomaticallyModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        productName={selectedProduct?.name || ''}
        platforms={adminPlatformSettings}
      />
      </div>
    </section>
  );
}
