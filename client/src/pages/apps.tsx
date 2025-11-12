// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import WidgetRenderer from '@/components/WidgetRenderer';
import ScrollNavigation from '@/components/scroll-navigation';
import PageBanner from '@/components/PageBanner';
import PageVideosSection from '@/components/PageVideosSection';
import { AnnouncementBanner } from "@/components/announcement-banner";

import UniversalFilterSidebar from "@/components/UniversalFilterSidebar";
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';
import { useCurrency, getCurrencySymbol, CurrencyCode } from '@/contexts/CurrencyContext';
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';
import EnhancedPriceTag from '@/components/EnhancedPriceTag';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import { inferGender } from "@/utils/gender";
import { ProductTimer } from '@/components/product-timer';
import PriceTag from '@/components/PriceTag';

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
  const [location] = useLocation();
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [convertPrices, setConvertPrices] = useState<boolean>(false);
  const [priceRangeLabel, setPriceRangeLabel] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Helper function to format product price without conversion (displays original currency)
  const formatProductPrice = (price: string | number, productCurrency?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/,/g, '')) : price;
    const originalCurrency = (productCurrency?.toString().toUpperCase() as CurrencyCode) || 'USD';
    
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

  // Sync gender from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const genderParam = params.get('gender');
    if (genderParam) {
      const normalized = genderParam === 'common' ? 'unisex' : genderParam.toLowerCase();
      setSelectedGender(normalized);
    }
  }, [location]);

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

  // Fetch apps directly from the respective page endpoint without extra logic
  const { data: allApps = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/page/apps'],
    queryFn: async (): Promise<Product[]> => {
      try {
        const response = await fetch('/api/products/page/apps');
        if (!response.ok) {
          console.log('Apps endpoint failed');
          return [];
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.log('Apps endpoint error:', error);
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

  // Derive available genders from apps
  const availableGenders = useMemo(() => {
    const set = new Set<string>();
    for (const p of displayApps) {
      const g = inferGender(p.gender || '', `${p.name || ''} ${p.description || ''}`);
      if (g) set.add(g);
    }
    const hasBoys = set.has('boys');
    const hasGirls = set.has('girls');
    if (hasBoys || hasGirls) set.add('kids');
    const ordered = ['men', 'women', 'kids', 'boys', 'girls', 'unisex'].filter(g => set.has(g));
    return ['all', ...ordered];
  }, [displayApps]);

  // Helper: map sidebar range value to numeric bounds
  const getPriceBounds = (rangeValue: string): { min: number; max: number } => {
    if (!rangeValue || rangeValue === 'all') return { min: 0, max: Infinity };
    if (rangeValue.includes('-')) {
      const [minStr, maxStr] = rangeValue.split('-');
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? Infinity : max };
    }
    const min = parseFloat(rangeValue);
    return { min: isNaN(min) ? 0 : min, max: Infinity };
  };
  const priceBounds = getPriceBounds(priceRangeLabel);
  
  // Clear filters handler
  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCurrency('all');
    setConvertPrices(false);
    setPriceRangeLabel('all');
    setMinRating(0);
    setSelectedGender('all');
  };

  // Apply client-side filtering for category, price, and rating
  const filteredApps = displayApps.filter(app => {
    // Filter by category
    if (selectedCategory && app.category !== selectedCategory) {
      return false;
    }
    
    // Filter by gender
    if (selectedGender && selectedGender !== 'all') {
      const inferred = inferGender(app);
      const g = (inferred || '').toLowerCase();
      if (selectedGender === 'kids') {
        if (!['boys', 'girls', 'kids'].includes(g)) return false;
      } else if (g !== selectedGender) {
        return false;
      }
    }
    
    // Filter by price range
    const price = parseFloat(String(app.price || 0).toString().replace(/[^0-9.]/g, '')) || 0;
    if (price < priceBounds.min || price > priceBounds.max) {
      return false;
    }
    
    // Filter by rating
    const rating = parseFloat(String(app.rating || 0));
    if (rating < minRating) {
      return false;
    }

    // Filter by currency (case-insensitive)
    if (selectedCurrency !== 'all') {
      const appCurrency = String(app.currency ?? '').trim().toUpperCase();
      if (appCurrency && appCurrency !== String(selectedCurrency).trim().toUpperCase()) {
        return false;
      }
    }

    return true;
  });

  // Handle gender selection and sync URL
  const handleGenderChange = (g: string) => {
    const normalized = g === 'common' ? 'unisex' : g;
    setSelectedGender(normalized);
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (normalized === 'all') {
      params.delete('gender');
    } else {
      params.set('gender', normalized);
    }
    const basePath = typeof window !== 'undefined' ? window.location.pathname : '/apps';
    const query = params.toString();
    const newUrl = query ? `${basePath}?${query}` : basePath;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
  };

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
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'apps'} position="header-top" className="w-full" />
        
        <AnnouncementBanner page="apps" />
      
      {/* Amazing Page Banner */}
      <PageBanner page="apps" />
      {/* Header Bottom below dynamic banner */}
      <WidgetRenderer page={'apps'} position="header-bottom" className="w-full" />
        <div className="header-spacing pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading apps...</p>
            </div>
          </div>
        </div>
        {/* Footer Widgets */}
        <WidgetRenderer page={'apps'} position="footer-top" className="w-full" />
        <WidgetRenderer page={'apps'} position="footer-bottom" className="w-full" />
      </div>
    );
  }

  return (
    <UniversalPageLayout pageId="apps">
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'apps'} position="header-top" className="w-full" />
        
        <AnnouncementBanner page="apps" />
      
      {/* Amazing Page Banner */}
      <PageBanner page="apps" />
      {/* Header Bottom below dynamic banner */}
      <WidgetRenderer page={'apps'} position="header-bottom" className="w-full" />
      
      {/* Apps Content Section with Sidebar */}
      <div className="header-spacing flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <UniversalFilterSidebar
          showCurrency={true}
          showPriceRange={true}
          showGender={true}
          showNetworks={false}
          showCategories={true}
          showRating={true}
          showResultsCount={true}
          showClearButton={true}

          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          convertPrices={convertPrices}
          setConvertPrices={setConvertPrices}
          priceRange={priceRangeLabel}
          setPriceRange={setPriceRangeLabel}

          categorySelectionMode="single"
          availableCategories={availableCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}

          availableGenders={availableGenders}
          selectedGender={selectedGender}
          setSelectedGender={handleGenderChange}

          minRating={minRating}
          setMinRating={setMinRating}

          resultsCount={filteredAndSortedApps.length}
          onClearFilters={clearFilters}
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

          {/* Apps Grid - Styled like Top Picks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredAndSortedApps.map((app: Product) => (
              <div 
                key={app.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 overflow-hidden max-w-md mx-auto"
              >
                {/* Card Header with Image */}
                <div className="relative">
                  <img 
                    src={app.imageUrl} 
                    alt={app.name} 
                    className="w-full h-48 object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://picsum.photos/400/300?random=${app.id}`;
                    }}
                  />
                  {/* Wishlist Heart Icon */}
                  <button
                    onClick={() => handleWishlistToggle(app)}
                    className={`absolute top-3 left-3 p-2 rounded-full shadow-lg transition-all duration-200 ${
                      isInWishlist(app.id) 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white'
                    }`}
                    title={isInWishlist(app.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className="fas fa-heart text-sm"></i>
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  {/* Discount Badge and Action Icons */}
                  <div className="flex items-center justify-between mb-3">
                    {(() => {
                      const originalVal = Number((app as any).originalPrice || (app as any).original_price || 0);
                      const currentVal = Number(app.price || 0);
                      const hasValidPrices = originalVal > 0 && currentVal > 0 && originalVal > currentVal;
                      if (hasValidPrices) {
                        const pct = Math.round(((originalVal - currentVal) / originalVal) * 100);
                        if (pct > 0) {
                          return (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              {pct}% OFF
                            </span>
                          );
                        }
                      }
                      return null;
                    })()}
                    {!app.discount && app.isNew ? (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        NEW
                      </span>
                    ) : (
                      <div></div>
                    )}
                    {/* Share and Delete Icons */}
                    <div className="flex gap-2">
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
                            className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-full shadow-lg transition-all duration-200 cursor-pointer z-10 relative"
                            title="Share to All Platforms"
                          >
                            <i className="fas fa-edit text-sm pointer-events-none"></i>
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
                            className="p-2 bg-green-500 text-white hover:bg-green-600 rounded-full shadow-lg transition-all duration-200"
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
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-200"
                          buttonText=""
                          showIcon={true}
                        />
                      )}
                      {/* Delete Button - Admin Only */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteApp(app.id)}
                          className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-full shadow-lg transition-all duration-200"
                          title="Delete app"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    <StarRating rating={app.rating} />
                    <span className="text-gray-600 dark:text-gray-300 ml-2 text-sm">({app.reviewCount || 0})</span>
                  </div>

                  {/* App Name */}
                  <h4 className="font-bold text-lg text-navy dark:text-blue-400 mb-2 line-clamp-2">{app.name}</h4>

                  {/* App Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{app.description}</p>

                  {/* Pricing */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <PriceTag 
                        product={app}
                        colorClass="text-navy dark:text-blue-400"
                        originalClass="text-gray-400 dark:text-gray-500 line-through text-base"
                        freeClass="text-green-600 dark:text-green-400"
                        helperClass="text-xs text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Product Timer */}
                  <div className="mb-4">
                    <ProductTimer product={app} />
                  </div>

                  {/* Pick Now Button */}
                  <button 
                    onClick={() => {
                      window.open(app.affiliateUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    <i className="fas fa-shopping-bag mr-2"></i>Pick Now
                  </button>

                  {/* Affiliate Link Notice */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    <i className="fas fa-link"></i> Affiliate Link - We earn from purchases
                  </p>
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

      {/* Footer Widgets */}
      <WidgetRenderer page={'apps'} position="footer-top" className="w-full" />
      <WidgetRenderer page={'apps'} position="footer-bottom" className="w-full" />

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