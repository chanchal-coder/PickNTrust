// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductTimer } from "@/components/product-timer";
import { useCurrency, getCurrencySymbol, CurrencyCode } from '@/contexts/CurrencyContext';
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import EnhancedPriceTag from '@/components/EnhancedPriceTag';

// Define Product type locally to match the complete schema
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

// No fallback data - show real apps or simple message

export default function AppsAIApps() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Helper function to format product price without conversion (displays original currency)
  const formatProductPrice = (price?: string | number | number | undefined, productCurrency?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
    const originalCurrency = (productCurrency?.toString().toUpperCase() as CurrencyCode) || 'USD';
    
    // Always display in the product's original currency (no conversion)
    return formatCurrencyPrice(numPrice, originalCurrency);
  };

  // Admin state management
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

  // Fetch Apps products directly from the 'apps' page endpoint without additional conditions
  const { data: aiAppsProducts = [], isLoading } = useQuery({
    queryKey: ['/api/products/apps'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/products/apps');
        if (!response.ok) {
          console.log('Apps API failed');
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.log('Apps API error:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  // Show all apps from the endpoint without rotation or limiting
  const displayApps = Array.isArray(aiAppsProducts) ? aiAppsProducts : [];

  // Delete app mutation
  const deleteAppMutation = useMutation({
    mutationFn: async (appId: number) => {
      const response = await fetch(`/api/admin/products/${appId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });
      if (!response.ok) throw new Error('Failed to delete app');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/apps'] });
      toast({
        title: "App Deleted",
        description: "The app has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete app. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteApp = (appId: number) => {
    if (confirm('Are you sure you want to delete this app?')) {
      deleteAppMutation.mutate(appId);
    }
  };

  const handleWishlistToggle = (app: Product) => {
    if (isInWishlist(app.id)) {
      removeFromWishlist(app.id);
      toast({
        title: "Removed from Wishlist",
        description: `${app.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist(app);
      toast({
        title: "Added to Wishlist",
        description: `${app.name} has been added to your wishlist.`,
      });
    }
  };

  const handleShare = (platform: string, app: Product) => {
    const appUrl = `${window.location.origin}`;
    const appText = `Check out this amazing app: ${app.name} - ₹${app.price}${app.originalPrice ? ` (was ₹${app.originalPrice})` : ''} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/profile.php?id=61578969445670`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/+m-O-S6SSpVU2NWU1`;
        break;
      case 'twitter':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(appText)}&url=${encodeURIComponent(appUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'instagram':
        const instagramText = `<i className="fas fa-rocket"></i> Amazing App Alert! ${app.name}\n\n<i className="fas fa-dollar-sign"></i> Price: ₹${app.price}${app.originalPrice ? ` (was ₹${app.originalPrice})` : ''}\n\n<i className="fas fa-sparkles"></i> Get it now at PickNTrust\n\n#PickNTrust #Apps #${app.category.replace(/\s+/g, '')} #Technology`;
        navigator.clipboard.writeText(instagramText + '\n\n' + appUrl);
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    
    setShowShareMenu(prev => ({...prev, [app.id]: false}));
  };

  // Scroll functionality
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Attach non-passive wheel listener to enable preventDefault without warnings
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: any) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      updateScrollButtons();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as EventListener);
  }, [displayApps]);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayApps]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, []);

  if (isLoading) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading apps...</p>
          </div>
        </div>
      </section>
    );
  }

  const StarRating = ({ rating }: { rating: string }) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, index) => (
          <i
            key={index}
            className={`fas fa-star text-xs ${
              index < fullStars
                ? 'text-yellow-400'
                : index === fullStars && hasHalfStar
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          ></i>
        ))}
      </div>
    );
  };

  return (
    <section id="apps-ai-apps" className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4 relative">
              Apps & AI Apps
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce"><i className="fas fa-robot"></i></div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"><i className="fas fa-sparkles"></i> Cutting-edge apps and AI-powered tools <i className="fas fa-sparkles"></i></span>
          </p>
        </div>
        
        {/* Horizontal Scrolling Container with Border */}
        <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:bg-gray-800/20 dark:border-gray-700/30">
          {/* Scroll Arrows - always rendered on desktop, disabled when no overflow */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-disabled={!canScrollLeft}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-full shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-disabled={!canScrollRight}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-full shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Coming Soon Message - Desktop */}
          {displayApps.length === 0 ? (
            <div className="hidden md:flex items-center justify-center py-16 px-8">
              <div className="text-center">
                <div className="text-6xl mb-4"><i className="fas fa-mobile-alt"></i></div>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Innovative Apps Coming Soon!
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  Stay tuned for the latest apps and AI-powered tools
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full text-sm font-medium">
                  <span className="animate-pulse mr-2">⏰</span>
                  New apps added daily
                </div>
              </div>
            </div>
          ) : (
            /* Desktop: Scrollable Container, Mobile: Grid */
            <div
              ref={scrollContainerRef}
              className="hidden md:flex gap-6 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
            >
              {displayApps.map((app: Product, index: number) => (
              <div 
                key={app.id}
                className="flex-shrink-0 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                {/* App Image with colored border */}
                <div className={`relative p-3 ${
                  index % 4 === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 
                  index % 4 === 1 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 
                  index % 4 === 2 ? 'bg-gradient-to-br from-teal-500 to-cyan-500' :
                  'bg-gradient-to-br from-blue-500 to-green-600'
                }`}>
                  <div className="w-full h-40 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={app.imageUrl} 
                      alt={app.name} 
                      className="w-full h-full object-contain p-2" 
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&q=60`;
                      }}
                    />
                  </div>
                  
                  {/* Wishlist Heart Icon */}
                  <button
                    onClick={() => handleWishlistToggle(app)}
                    className={`absolute top-5 left-5 p-1.5 rounded-full shadow-md transition-colors ${
                      isInWishlist(app.id) 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-white text-gray-400 hover:text-red-500'
                    }`}
                    title={isInWishlist(app.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className="fas fa-heart text-xs"></i>
                  </button>
                </div>
                
                {/* App Content */}
                <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-2 relative">
                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {/* Admin Buttons */}
                    {isAdmin && (
                      <>
                        {/* Enhanced Share Button - Only for admin */}
                        <EnhancedShare
                           product={{
                             id: app.id,
                             name: app.name,
                             description: app.description,
                             price: app.price,
                             imageUrl: app.imageUrl,
                             category: app.category,
                             affiliateUrl: app.affiliateUrl
                           }}
                           contentType="app"
                           className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-colors"
                           buttonText=""
                           showIcon={true}
                         />

                        {/* Delete Button - Only for admin - Rounded Red Icon */}
                        <button
                          onClick={() => handleDeleteApp(app.id)}
                          className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110"
                          title="Delete app"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </>
                    )}
                    
                    {/* Public User Share Button */}
                    {!isAdmin && (
                      <SmartShareDropdown
                        product={{
                          id: app.id,
                          name: app.name,
                          description: app.description,
                          price: app.price,
                          imageUrl: app.imageUrl,
                          category: app.category,
                          affiliateUrl: app.affiliateUrl
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-colors"
                        buttonText=""
                        showIcon={true}
                      />
                    )}
                  </div>

                  {/* App Name */}
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white pr-16 leading-tight">
                    {app.name}
                  </h4>
                  
                  {/* App Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {app.description}
                  </p>
                  
                  {/* Rating and Reviews */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarRating rating={app.rating} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {app.rating} ({(app.reviewCount || 0).toLocaleString()})
                      </span>
                    </div>
                    {app.isNew && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  
                  {/* Timer */}
                  <div className="py-1">
                    <ProductTimer product={app} />
                  </div>
                  
                  {/* Price and CTA */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      {/* Unified pricing display */}
                      <div className="flex flex-col space-y-1">
                        <EnhancedPriceTag 
                          product={app}
                          colorClass="text-green-600 dark:text-green-400"
                          originalClass="text-gray-500 line-through text-sm"
                          freeClass="text-green-600 dark:text-green-400"
                          helperClass="text-xs text-gray-500"
                        />
                      </div>
                    </div>
                    <a
                      href={app.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                      <i className="fas fa-shopping-bag mr-2"></i>Pick Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Coming Soon Message - Mobile */}
          {displayApps.length === 0 ? (
            <div className="md:hidden flex items-center justify-center py-12 px-4">
              <div className="text-center">
                <div className="text-4xl mb-3"><i className="fas fa-mobile-alt"></i></div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Apps Coming Soon!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Innovative tools loading...
                </p>
                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full text-xs font-medium">
                  <span className="animate-pulse mr-1">⏰</span>
                  Stay tuned
                </div>
              </div>
            </div>
          ) : (
            /* Mobile Horizontal Scroll View */
            <div 
              className="md:hidden flex gap-4 overflow-x-auto scrollbar-hide pb-4" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x'
              }}
            >
              {displayApps.map((app: Product, index: number) => (
              <div 
                key={app.id}
                className="flex-shrink-0 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Mobile App Card Content - Similar structure but optimized for mobile */}
                <div className={`relative p-2 ${
                  index % 4 === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 
                  index % 4 === 1 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 
                  index % 4 === 2 ? 'bg-gradient-to-br from-teal-500 to-cyan-500' :
                  'bg-gradient-to-br from-blue-500 to-green-600'
                }`}>
                  <div className="w-full h-32 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={app.imageUrl} 
                      alt={app.name} 
                      className="w-full h-full object-contain p-2" 
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&q=60`;
                      }}
                    />
                  </div>
                  
                  <button
                    onClick={() => handleWishlistToggle(app)}
                    className={`absolute top-3 left-3 p-1 rounded-full shadow-md transition-colors ${
                      isInWishlist(app.id) 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-white text-gray-400 hover:text-red-500'
                    }`}
                    title={isInWishlist(app.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className="fas fa-heart text-xs"></i>
                  </button>
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {app.name}
                  </h4>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                    {app.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <StarRating rating={app.rating} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {app.rating}
                      </span>
                    </div>
                    {app.isNew && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  
                  {/* Timer - Mobile */}
                  <div className="py-1">
                    <ProductTimer product={app} className="text-xs" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1">
                      {/* Unified pricing display - mobile */}
                      <div className="flex flex-col space-y-1">
                        <EnhancedPriceTag 
                          product={app}
                          colorClass="text-green-600 dark:text-green-400"
                          originalClass="text-gray-500 line-through text-sm"
                          freeClass="text-green-600 dark:text-green-400"
                          helperClass="text-xs text-gray-500"
                        />
                      </div>
                    </div>
                    <a
                      href={app.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                    >
                      <i className="fas fa-shopping-bag mr-1"></i>Pick Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* More Button */}
          <div className="flex justify-end mt-6">
            <Link 
              href="/apps"
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-full font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              More Apps →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}