// @ts-nocheck
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import WidgetRenderer from '@/components/WidgetRenderer';
import ScrollNavigation from "@/components/scroll-navigation";
import PageVideosSection from '@/components/PageVideosSection';
import PageBanner from '@/components/PageBanner';
import { AnnouncementBanner } from "@/components/announcement-banner";

import Sidebar from "@/components/sidebar";
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import PriceTag from '@/components/PriceTag';
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
  const [priceRange, setPriceRange] = useState<{min: number, max: number}>({min: 0, max: Infinity});
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Product | null>(null);
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];
  
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const queryClient = useQueryClient();

  // Check admin status
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
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

  // Apply client-side filtering for category, price, rating, and currency
  const filteredServices = displayServices.filter(service => {
    // Filter by category
    if (selectedCategory && service.category !== selectedCategory) {
      return false;
    }
    
    // Filter by price range
    const price = parseFloat(String(service.price || 0));
    if (price < priceRange.min || price > priceRange.max) {
      return false;
    }
    
    // Filter by rating
    const rating = parseFloat(String(service.rating || 0));
    if (rating < minRating) {
      return false;
    }
    
    // Filter by currency
    if (selectedCurrency !== 'ALL' && service.currency && service.currency !== selectedCurrency) {
      return false;
    }
    
    return true;
  });

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

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
  };

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
          <Sidebar 
            onCategoryChange={handleCategoryChange}
            onPriceRangeChange={handlePriceRangeChange}
            onRatingChange={handleRatingChange}
            onCurrencyChange={handleCurrencyChange}
            availableCategories={availableCategories}
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
            
            {/* Services Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredServices.map((service: Product, index: number) => (
                <div 
                  key={service.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  {/* Service Image with colored border */}
                  <div className={`relative p-3 ${
                    index % 4 === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 
                    index % 4 === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 
                    index % 4 === 2 ? 'bg-gradient-to-br from-pink-500 to-red-500' :
                    'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                      <img 
                        src={service.imageUrl || service.image_url || `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80`} 
                        alt={service.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80`;
                        }}
                      />
                    </div>
                    
                    {/* Wishlist Heart Icon */}
                    <button
                      onClick={() => handleWishlistToggle(service)}
                      className={`absolute top-5 left-5 p-1.5 rounded-full shadow-md transition-colors ${
                        isInWishlist(service.id) 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-white text-gray-400 hover:text-red-500'
                      }`}
                      title={isInWishlist(service.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <i className="fas fa-heart text-xs"></i>
                    </button>
                  </div>
                  
                  {/* Service Content */}
                  <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-2 relative">
                    {/* Admin Action Buttons - Top Right */}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        {/* Share to All Platforms Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShareToAll(service);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors cursor-pointer z-10 relative"
                          title="Share to All Platforms"
                        >
                          <i className="fas fa-edit text-xs pointer-events-none"></i>
                        </button>
                        
                        {/* Individual Share Button */}
                        <EnhancedShare
                          product={{
                            id: service.id,
                            name: service.name,
                            description: service.description,
                            price: service.price,
                            imageUrl: service.imageUrl,
                            category: service.category,
                            affiliateUrl: service.affiliateUrl
                          }}
                          contentType="service"
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-colors"
                          buttonText=""
                          showIcon={true}
                        />
                        
                        {/* Delete Button - Admin Only */}
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                          title="Delete service"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    )}
                    
                    {/* Public User Share Button - Top Right (Green Only) */}
                     {!isAdmin && (
                       <div className="absolute top-2 right-2">
                         <SmartShareDropdown
                           product={{
                             id: service.id,
                             name: service.name,
                             description: service.description,
                             price: service.price,
                             imageUrl: service.imageUrl,
                             category: service.category,
                             affiliateUrl: service.affiliateUrl
                           }}
                           className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-md transition-colors"
                           buttonText=""
                           showIcon={true}
                         />
                       </div>
                     )}

                    {/* Discount Badge */}
                    {service.discount && (
                      <div className="flex justify-start">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          {service.discount}% OFF
                        </span>
                      </div>
                    )}
                    
                    {/* Rating */}
                    <div className="flex items-center">
                      {renderStars(service.rating)}
                      <span className="text-gray-500 dark:text-gray-400 ml-1 text-xs">({service.reviewCount})</span>
                    </div>
                    
                    {/* Service Name */}
                    <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 leading-tight pr-16">{service.name}</h4>
                    
                    {/* Service Description */}
                    <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">{service.description}</p>
                    
                    {/* Category Badge */}
                    <div className="flex justify-start">
                      <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-xs">
                        {service.category}
                      </span>
                    </div>
                    
                    {/* Price - unified via PriceTag with field normalization */}
                    <div className="flex flex-col space-y-1">
                      {(() => {
                        const normalizedService = {
                          ...service,
                          currency: service.currency || 'INR',
                          originalPrice: (service as any).originalPrice ?? (service as any).original_price ?? null,
                          priceDescription: (service as any).priceDescription ?? (service as any).price_description ?? '',
                          monthlyPrice: (service as any).monthlyPrice ?? (service as any).monthly_price ?? 0,
                          yearlyPrice: (service as any).yearlyPrice ?? (service as any).yearly_price ?? 0,
                          pricingType: (service as any).pricingType ?? (service as any).pricing_type ?? undefined,
                          isFree: (service as any).isFree ?? (service as any).is_free ?? false,
                        };
                        return (
                          <PriceTag
                            product={normalizedService}
                            colorClass="text-indigo-600 dark:text-indigo-400"
                            originalClass="text-gray-500 line-through text-sm"
                            freeClass="text-green-600 dark:text-green-400"
                            helperClass="text-xs text-gray-500 dark:text-gray-400"
                          />
                        );
                      })()}
                    </div>
                    
                    {/* Pick Now Button */}
                    <button 
                      onClick={() => handleAffiliateClick(service)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 text-sm"
                    >
                      <i className="fas fa-shopping-bag mr-2"></i>Pick Now
                    </button>
                    
                    {/* Affiliate Link Text */}
                    <p className="text-[10px] text-gray-400 text-center mt-1">
                      <i className="fas fa-link"></i> Affiliate Link - We earn from sign-ups
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
