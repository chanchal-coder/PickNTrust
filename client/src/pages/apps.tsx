// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import Header from '@/components/header';
import Footer from '@/components/footer';
import ScrollNavigation from '@/components/scroll-navigation';
import PageBanner from '@/components/PageBanner';
import PageVideosSection from '@/components/PageVideosSection';
import { AnnouncementBanner } from "@/components/announcement-banner";

import Sidebar from "@/components/sidebar";
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';
import { useCurrency, getCurrencySymbol, CurrencyCode } from '@/contexts/CurrencyContext';
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';
import PriceTag from '@/components/PriceTag';
import UniversalPageLayout from '@/components/UniversalPageLayout';

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

// Extended sample apps and AI apps data
// No fallback data - show real apps or simple message

export default function AppsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: Infinity});
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Helper function to format product price without conversion (displays original currency)
  const formatProductPrice = (price: string | number, productCurrency?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/,/g, '')) : price;
    const originalCurrency = (productCurrency as CurrencyCode) || 'INR';
    
    // Always display in the product's original currency (no conversion)
    return formatCurrencyPrice(numPrice, originalCurrency);
  };

  // Admin state management
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Product | null>(null);
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];

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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Handle share modal
  const handleShareToAll = (app: Product) => {
    setSelectedApp(app);
    setShareModalOpen(true);
  };
  
  const handleConfirmShare = () => {
    if (selectedApp) {
      // TODO: Implement actual sharing based on admin panel automation settings
      alert(`✅ Sharing "${selectedApp.name}" to all configured platforms!`);
      console.log('Share confirmed for:', selectedApp.id, selectedApp.name);
      // Here you would call the API: await shareToAllPlatforms(selectedApp.id, adminPlatformSettings);
    }
    setShareModalOpen(false);
    setSelectedApp(null);
  };
  
  const handleCloseModal = () => {
    setShareModalOpen(false);
    setSelectedApp(null);
  };

  // Fetch apps using new backend filtering (isAIApp=true)
  const { data: allApps = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/page/apps-ai-apps', selectedCategory],
    queryFn: async (): Promise<Product[]> => {
      try {
        const allAppsData = [];
        
        // 1. Fetch from dedicated apps channel
        try {
          const response = await fetch('/api/products/apps');
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              allAppsData.push(...data.map((item: any) => ({ ...item, source: 'apps' })));
            }
          }
        } catch (error) {
          console.error('Failed to fetch apps from dedicated channel:', error);
        }
        
        // 2. Fetch apps from unified backend (filters by isAIApp=true)
        try {
          const url = selectedCategory 
            ? `/api/products/page/apps-ai-apps?category=${encodeURIComponent(selectedCategory)}`
            : '/api/products/page/apps-ai-apps';
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              allAppsData.push(...data.map((item: any) => ({ ...item, source: 'apps-ai-apps' })));
            }
          }
        } catch (error) {
          console.error('Failed to fetch apps from unified backend:', error);
        }
        
        return allAppsData;
      } catch (error) {
        console.warn('API call error, returning empty array:', error);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // Use aggregated data
  const displayApps: Product[] = allApps;

  // Get unique categories for sidebar
  const availableCategories = Array.from(new Set(displayApps.map(app => app.category).filter(Boolean)));

  // Handler functions for sidebar
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePriceRangeChange = (min: number, max: number) => {
    setPriceRange({min, max});
  };

  const handleRatingChange = (rating: number) => {
    setMinRating(rating);
  };

  // Apply client-side filtering for category, price, and rating
  const filteredApps = displayApps.filter(app => {
    // Filter by category
    if (selectedCategory && app.category !== selectedCategory) {
      return false;
    }
    
    // Filter by price range
    const price = parseFloat(String(app.price || 0));
    if (price < priceRange.min || price > priceRange.max) {
      return false;
    }
    
    // Filter by rating
    const rating = parseFloat(String(app.rating || 0));
    if (rating < minRating) {
      return false;
    }
    
    return true;
  });

  // Sort filtered apps
   const filteredAndSortedApps = filteredApps
    .sort((a: Product, b: Product) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(String(a.price).replace(/,/g, '')) - parseFloat(String(b.price).replace(/,/g, ''));
        case 'price-high':
          return parseFloat(String(b.price).replace(/,/g, '')) - parseFloat(String(a.price).replace(/,/g, ''));
        case 'rating':
          return parseFloat(b.rating) - parseFloat(a.rating);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'featured':
        default:
          return b.isFeatured ? 1 : -1;
      }
    });

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
      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/apps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/homepage/apps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/homepage/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
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
    const formattedPrice = formatProductPrice(app.price, app.currency);
    const formattedOriginalPrice = app.originalPrice ? formatProductPrice(app.originalPrice, app.currency) : null;
    const appText = `Check out this amazing app: ${app.name} - ${formattedPrice}${formattedOriginalPrice ? ` (was ${formattedOriginalPrice})` : ''} at PickNTrust!`;
    
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
        const instagramText = `<i className="fas fa-rocket"></i> Amazing App Alert! ${app.name}\n\n<i className="fas fa-dollar-sign"></i> Price: ${formattedPrice}${formattedOriginalPrice ? ` (was ${formattedOriginalPrice})` : ''}\n\n<i className="fas fa-sparkles"></i> Get it now at PickNTrust\n\n#PickNTrust #Apps #${app.category.replace(/\s+/g, '')} #Technology`;
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

  const StarRating = ({ rating }: { rating: string }) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, index) => (
          <i
            key={index}
            className={`fas fa-star text-sm ${
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
        <Header />
        
        <AnnouncementBanner page="apps" />
      
      {/* Amazing Page Banner */}
      <PageBanner page="apps" />
        <div className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading apps...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UniversalPageLayout pageId="apps">
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
        <Header />
        
        <AnnouncementBanner page="apps" />
      
      {/* Amazing Page Banner */}
      <PageBanner page="apps" />
      
      {/* Apps Content Section with Sidebar */}
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar 
          onCategoryChange={handleCategoryChange}
          onPriceRangeChange={handlePriceRangeChange}
          onRatingChange={handleRatingChange}
          availableCategories={availableCategories}
        />

        {/* Apps Grid */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                <i className="fas fa-mobile-alt"></i> All Apps & AI Apps ({filteredAndSortedApps.length})
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredAndSortedApps.length} of {displayApps.length} apps from all channels
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Apps aggregated from dedicated Apps channel + Prime Picks, Click Picks, Value Picks, CueLinks, Global Picks, Deals Hub, and Loot Box
            </p>
          </div>

          {/* Sort Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort By:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAndSortedApps.map((app: Product, index: number) => (
              <div 
                key={app.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                {/* App Image with colored border */}
                <div className={`relative p-3 ${
                  index % 4 === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 
                  index % 4 === 1 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 
                  index % 4 === 2 ? 'bg-gradient-to-br from-teal-500 to-cyan-500' :
                  'bg-gradient-to-br from-blue-500 to-green-600'
                }`}>
                  <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img 
                      src={app.imageUrl} 
                      alt={app.name} 
                      className="w-full h-full object-cover" 
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
                <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-3 relative">
                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {/* Admin Buttons: Share to All + Individual Share */}
                    {isAdmin && (
                      <>
                        {/* Share to All Platforms Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShareToAll(app);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors cursor-pointer z-10 relative"
                          title="Share to All Platforms"
                        >
                          <i className="fas fa-edit text-xs pointer-events-none"></i>
                        </button>
                        
                        {/* Individual Share Button */}
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
                      </>
                    )}
                    
                    {/* Public User Smart Share Button */}
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

                    {/* Delete Button - Only for admin */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteApp(app.id)}
                        className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110"
                        title="Delete app"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    )}
                  </div>

                  {/* App Name */}
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white pr-16 leading-tight">
                    {app.name}
                  </h4>
                  
                  {/* App Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {app.description}
                  </p>
                  
                  {/* Category Badge */}
                  <div className="flex items-center justify-between">
                    <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      {app.category}
                    </span>
                    {app.isNew && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  
                  {/* Rating and Reviews */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarRating rating={app.rating} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {app.rating} ({(app.reviewCount || 0).toLocaleString()})
                      </span>
                    </div>
                  </div>
                  
                  {/* Price and CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <PriceTag
                        product={app}
                        colorClass="text-green-600 dark:text-green-400"
                        originalClass="text-gray-500 line-through text-sm"
                        freeClass="text-green-600 dark:text-green-400"
                        helperClass="text-xs text-gray-500 dark:text-gray-400"
                      />
                      {app.discount && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                          {app.discount}% OFF
                        </span>
                      )}
                    </div>
                    <a
                      href={app.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md"
                    >
                      Get App →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedApps.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4"><i className="fas fa-robot"></i></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No apps found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Apps Videos Section - Only shows if videos exist for apps */}
      <PageVideosSection 
        page="apps" 
        title="Apps Videos"
      />

      <ScrollNavigation />
      
      {/* Share Automatically Modal */}
      <ShareAutomaticallyModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        productName={selectedApp?.name || ''}
        platforms={adminPlatformSettings}
      />
      </div>
    </UniversalPageLayout>
  );
}