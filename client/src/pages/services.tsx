// @ts-nocheck
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import WidgetRenderer from '@/components/WidgetRenderer';
import ScrollNavigation from "@/components/scroll-navigation";
import PageVideosSection from '@/components/PageVideosSection';
import PageBanner from '@/components/PageBanner';
import { AnnouncementBanner } from "@/components/announcement-banner";
import { ProductTimer } from '@/components/product-timer';

import UniversalFilterSidebar from "@/components/UniversalFilterSidebar";
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import EnhancedPriceTag from '@/components/EnhancedPriceTag';
import { inferGender } from "@/utils/gender";
// Define Product type locally to match the complete schema with service pricing fields
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

// No fallback data - show real services or simple message

export default function Services() {
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [convertPrices, setConvertPrices] = useState<boolean>(false);
  const [priceRangeLabel, setPriceRangeLabel] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Product | null>(null);
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];
  
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // Check admin status
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  
  // Handle share modal
  const handleShareToAll = (service: Product) => {
    setSelectedService(service);
    setShareModalOpen(true);
  };
  
  const handleConfirmShare = () => {
    if (selectedService) {
      // TODO: Implement actual sharing based on admin panel automation settings
      alert(`✅ Sharing "${selectedService.name}" to all configured platforms!`);
      console.log('Share confirmed for:', selectedService.id, selectedService.name);
      // Here you would call the API: await shareToAllPlatforms(selectedService.id, adminPlatformSettings);
    }
    setShareModalOpen(false);
    setSelectedService(null);
  };
  
  const handleCloseModal = () => {
    setShareModalOpen(false);
    setSelectedService(null);
  };

  // Fetch services using new backend filtering (isService=true)
  const { data: services } = useQuery<Product[]>({
    queryKey: ['/api/products/page/services', selectedCategory],
    queryFn: async () => {
      try {
        const allServices = [];
        
        // 1. Fetch manually added services from dedicated API
        try {
          const servicesResponse = await fetch('/api/services');
          if (servicesResponse.ok) {
            const servicesData = await servicesResponse.json();
            if (Array.isArray(servicesData)) {
              allServices.push(...servicesData.map((item: any) => ({ ...item, source: 'manual' })));
            }
          }
        } catch (error) {
          console.error('Failed to fetch manual services:', error);
        }
        
        // 2. Fetch services from unified backend (filters by isService=true)
        try {
          const url = selectedCategory 
            ? `/api/products/page/services?category=${encodeURIComponent(selectedCategory)}`
            : '/api/products/page/services';
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              allServices.push(...data.map((item: any) => ({ ...item, source: 'services' })));
            }
          }
        } catch (error) {
          console.error('Failed to fetch services from unified backend:', error);
        }
        
        // Deduplicate services by canonical ID (string) to prevent duplicate cards
        const uniqueServices = allServices.reduce((acc: Product[], current: Product) => {
          const normalizeId = (id: any) => String(id ?? "").trim();
          const currentId = normalizeId(current.id);
          
          // Skip empty IDs
          if (!currentId) {
            return acc;
          }
          
          const existingIndex = acc.findIndex(service => normalizeId(service.id) === currentId);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // If duplicate found, prefer the one with more complete data or manual source
            const existingService = acc[existingIndex];
            const currentHasMoreData = Object.keys(current).length > Object.keys(existingService).length;
            const currentIsManual = current.source === 'manual';
            const existingIsManual = existingService.source === 'manual';
            
            // Prefer manual source, then more complete data
            const shouldReplace = currentIsManual || (!existingIsManual && currentHasMoreData);
            if (shouldReplace) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []);
        
        return uniqueServices;
      } catch (error) {
        console.error('Failed to fetch all services:', error);
        return [];
      }
    },
    retry: 1
  });

  const displayServices = services || [];

  // Get unique categories for sidebar
  const availableCategories = Array.from(new Set(displayServices.map(service => service.category).filter(Boolean)));
  
  // Derive available genders from services
  const availableGenders = useMemo(() => {
    const set = new Set<string>();
    for (const p of displayServices) {
      const g = inferGender(p);
      if (g) set.add(g);
    }
    const hasBoys = set.has('boys');
    const hasGirls = set.has('girls');
    if (hasBoys || hasGirls) set.add('kids');
    const ordered = ['men', 'women', 'kids', 'boys', 'girls', 'unisex'].filter(g => set.has(g));
    return ['all', ...ordered];
  }, [displayServices]);

  // Helper: convert string price range label to numeric bounds
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

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedCurrency('all');
    setConvertPrices(false);
    setPriceRangeLabel('all');
    setMinRating(0);
    setSelectedGender('all');
  };

  // Apply client-side filtering for category, price, rating, and currency
  const filteredServices = displayServices.filter(service => {
    // Normalize helper
    const norm = (v: any) => String(v ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');

    // Filter by category (case/space insensitive)
    if (selectedCategory) {
      const svcCat = norm(service.category);
      const selCat = norm(selectedCategory);
      if (svcCat !== selCat) {
        return false;
      }
    }
    
    // Filter by gender
    if (selectedGender && selectedGender !== 'all') {
      const inferred = inferGender(service);
      const g = (inferred || '').toLowerCase();
      if (selectedGender === 'kids') {
        if (!['boys', 'girls', 'kids'].includes(g)) return false;
      } else if (g !== selectedGender) {
        return false;
      }
    }
    
    // Filter by price range (strip non-numeric characters)
    const priceNum = parseFloat(String(service.price ?? '').toString().replace(/[^0-9.]/g, '')) || 0;
    if (priceNum < priceBounds.min || priceNum > priceBounds.max) {
      return false;
    }
    
    // Filter by rating
    const ratingNum = parseFloat(String(service.rating || 0)) || 0;
    if (ratingNum < minRating) {
      return false;
    }
    
    // Filter by currency (case-insensitive)
    if (selectedCurrency !== 'all') {
      const svcCurrency = String(service.currency ?? '').trim().toUpperCase();
      if (svcCurrency && svcCurrency !== String(selectedCurrency).trim().toUpperCase()) {
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
    const basePath = typeof window !== 'undefined' ? window.location.pathname : '/services';
    const query = params.toString();
    const newUrl = query ? `${basePath}?${query}` : basePath;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl);
    }
  };

  // No standalone handlers needed; managed via UniversalFilterSidebar controlled props

  // Delete handler for admin
  const handleDelete = async (serviceId: number | string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'pickntrust2025' }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      toast({
        title: "Service deleted",
        description: "Service has been successfully deleted",
      });

      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prime-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/click-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cue-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/value-picks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/loot-box'] });
      queryClient.invalidateQueries({ queryKey: ['/api/amazon'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cuelinks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/homepage/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/apps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/homepage/apps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAffiliateClick = (service: Product) => {
    window.open(service.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWishlistToggle = (service: Product) => {
    if (isInWishlist(service.id)) {
      removeFromWishlist(service.id);
      toast({
        title: "Removed from wishlist",
        description: `${service.name} removed from your wishlist`,
      });
    } else {
      addToWishlist(service);
      toast({
        title: "Added to wishlist",
        description: `${service.name} added to your wishlist`,
      });
    }
  };

  const handleShare = (platform: string, service: Product) => {
    const serviceUrl = `${window.location.origin}/services`;
    const serviceText = `Check out this amazing service: ${service.name} - ${service.price === '0' ? 'FREE' : `₹${service.price}/month`} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/profile.php?id=61578969445670`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/+m-O-S6SSpVU2NWU1`;
        break;
      case 'twitter':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(serviceText)}&url=${encodeURIComponent(serviceUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'instagram':
        const instagramText = `<i className="fas fa-credit-card"></i> Amazing Service Alert! ${service.name}\n\n<i className="fas fa-dollar-sign"></i> Price: ${service.price === '0' ? 'FREE' : `₹${service.price}/month`}${service.originalPrice ? ` (was ₹${service.originalPrice})` : ''}\n\n<i className="fas fa-sparkles"></i> Get the best services at PickNTrust\n\n#PickNTrust #Services #${service.category.replace(/\s+/g, '')}`;
        navigator.clipboard.writeText(instagramText + '\n\n' + serviceUrl);
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        setShowShareMenu(prev => ({...prev, [service.id]: false}));
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(prev => ({...prev, [service.id]: false}));
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

  return (
    <UniversalPageLayout pageId="services">
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        {/* Header Top above dynamic banner */}
        <WidgetRenderer page={'services'} position="header-top" className="w-full" />
        
        <AnnouncementBanner />
        {/* Amazing Page Banner */}
        <PageBanner page="services" />
        {/* Header Bottom below dynamic banner */}
        <WidgetRenderer page={'services'} position="header-bottom" className="w-full" />
        
        {/* Services Content Section with Sidebar */}
        <div className="header-spacing">
          <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
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

            resultsCount={filteredServices.length}
            onClearFilters={clearFilters}
          />

          {/* Services Grid */}
          <div className="flex-1 p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  <i className="fas fa-cogs mr-2"></i>All Services ({filteredServices.length})
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredServices.length} of {displayServices.length} services from all channels
                </div>
              </div>
            </div>
            
            {/* Services Grid - Styled like Top Picks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredServices.map((service: Product) => (
                <div 
                  key={service.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 overflow-hidden max-w-md mx-auto"
                >
                  {/* Card Header with Image */}
                  <div className="relative">
                    <img 
                      src={service.imageUrl || service.image_url} 
                      alt={service.name} 
                      className="w-full h-48 object-cover" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/400/300?random=${service.id}`;
                      }}
                    />
                    {/* Wishlist Heart Icon */}
                    <button
                      onClick={() => handleWishlistToggle(service)}
                      className={`absolute top-3 left-3 p-2 rounded-full shadow-lg transition-all duration-200 ${
                        isInWishlist(service.id) 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white'
                      }`}
                      title={isInWishlist(service.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <i className="fas fa-heart text-sm"></i>
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    {/* Discount Badge and Action Icons */}
                    <div className="flex items-center justify-between mb-3">
                      {(() => {
                        const originalVal = Number((service as any).originalPrice || (service as any).original_price || 0);
                        const currentVal = Number(service.price || 0);
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
                      {!service.discount && service.isNew ? (
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
                                handleShareToAll(service);
                              }}
                              className="p-2 bg-blue-500 text-white hover:bg-blue-600 rounded-full shadow-lg transition-all duration-200 cursor-pointer z-10 relative"
                              title="Share to All Platforms"
                            >
                              <i className="fas fa-edit text-sm pointer-events-none"></i>
                            </button>
                            {/* Individual Share Button */}
                            <EnhancedShare 
                              product={{
                                id: service.id,
                                name: service.name,
                                description: service.description,
                                price: service.price,
                                imageUrl: service.imageUrl || service.image_url,
                                category: service.category,
                                affiliateUrl: service.affiliateUrl || service.affiliate_url
                              }}
                              contentType="product"
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
                              id: service.id,
                              name: service.name,
                              description: service.description,
                              price: service.price,
                              imageUrl: service.imageUrl || service.image_url,
                              category: service.category,
                              affiliateUrl: service.affiliateUrl || service.affiliate_url
                            }}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-200"
                            buttonText=""
                            showIcon={true}
                          />
                        )}
                        {/* Delete Button - Admin Only */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-full shadow-lg transition-all duration-200"
                            title="Delete service"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      {renderStars(String(service.rating || 0))}
                      <span className="text-gray-600 dark:text-gray-300 ml-2 text-sm">({service.reviewCount || 0})</span>
                    </div>

                    {/* Service Name */}
                    <h4 className="font-bold text-lg text-navy dark:text-blue-400 mb-2 line-clamp-2">{service.name}</h4>

                    {/* Service Description */}
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{service.description}</p>

                    {/* Pricing */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <EnhancedPriceTag 
                          product={service}
                          colorClass="text-navy dark:text-blue-400"
                          originalClass="text-gray-400 dark:text-gray-500 line-through text-base"
                          freeClass="text-green-600 dark:text-green-400"
                          helperClass="text-xs text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Product Timer */}
                    <div className="mb-4">
                      <ProductTimer product={service} />
                    </div>

                    {/* Pick Now Button */}
                    <button 
                      onClick={() => handleAffiliateClick(service)}
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

          </div>
          </div>
        
        {/* Services Videos Section - Only shows if videos exist for services */}
        <PageVideosSection 
          page="services" 
          title="Services Videos"
        />
        
        {/* Footer Widgets */}
        <WidgetRenderer page={'services'} position="footer-top" className="w-full" />
        <WidgetRenderer page={'services'} position="footer-bottom" className="w-full" />

        <ScrollNavigation />
        
        {/* Share Automatically Modal */}
        <ShareAutomaticallyModal
          isOpen={shareModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmShare}
          productName={selectedService?.name || ''}
          platforms={adminPlatformSettings}
        />
        </div>
      </div>
    </UniversalPageLayout>
  );
}
