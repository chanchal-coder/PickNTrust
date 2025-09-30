// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { useCurrency, getCurrencySymbol, CurrencyCode } from '@/contexts/CurrencyContext';
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';
import PriceTag from '@/components/PriceTag';
import EnhancedShare from '@/components/enhanced-share';
import SmartShareDropdown from '@/components/SmartShareDropdown';
import ShareAutomaticallyModal from '@/components/ShareAutomaticallyModal';

// ServiceDescription component for expandable text
const ServiceDescription = ({ description }: { description: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongDescription = description.length > 100;
  
  return (
    <div className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
      <p className={isExpanded ? '' : 'line-clamp-2'}>
        {description}
      </p>
      {isLongDescription && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-medium mt-1 transition-colors"
        >
          {isExpanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </div>
  );
};

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

// No fallback data - show real services or simple message

export default function CardsAppsServices() {
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const queryClient = useQueryClient();

  // Helper function to format product price without conversion (displays original currency)
  const formatProductPrice = (price?: string | number | number | undefined, productCurrency?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
    const originalCurrency = (productCurrency as CurrencyCode) || 'INR';
    
    // Always display in the product's original currency (no conversion)
    return formatCurrencyPrice(numPrice, originalCurrency);
  };

  // Check admin status
  const [isAdmin, setIsAdmin] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Product | null>(null);
  
  // Mock admin panel settings - in real app, this would come from API
  const adminPlatformSettings = ['Instagram', 'Facebook', 'WhatsApp', 'Telegram'];
  
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminAuth === 'active');
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

  // Daily rotation logic - get different services each day
  const getDailyRotationOffset = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return dayOfYear % 8; // Rotate every day, cycle through 8 different sets
  };

  // Fetch cards/apps/services from Services page (same source as /services page)
  const { data: services } = useQuery<Product[]>({
    queryKey: ['/api/products/page/services', getDailyRotationOffset()],
    queryFn: async () => {
      try {
        // Fetch latest services from services page (filters by isService=true)
        const response = await fetch('/api/products/page/services');
        if (!response.ok) {
          console.log('Services page API failed, showing coming soon message');
          return [];
        }
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
           // Apply daily rotation - show different services each day
           const rotationOffset = getDailyRotationOffset() % data.length; // Ensure offset doesn't exceed data length
           const rotatedData = [...data.slice(rotationOffset), ...data.slice(0, rotationOffset)];
           // Return first 6 services for home page preview, or all available if less than 6
           const previewData = rotatedData.slice(0, 6);
           
           // CRITICAL: If we have ANY real data, return it instead of fallback
           if (previewData.length > 0) {
             console.log(`Services: Showing ${previewData.length} real services from services page (total available: ${data.length})`);
             return previewData;
           }
         }
         
         console.log('Services: No real data available from services page, showing coming soon message');
          return [];
      } catch (error) {
          console.log('Services page API error, showing coming soon message:', error);
          return [];
        }
    },
    retry: 1,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour, but rotation changes daily
  });

  const displayServices = services && services.length > 0 ? services : [];

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400; // Match card width + gap
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [displayServices]);

  // Keep arrow visibility updated on viewport resize
  useEffect(() => {
    const onResize = () => checkScrollButtons();
    window.addEventListener('resize', onResize);
    // Initial check in case layout updates after mount
    checkScrollButtons();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mouse wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
      checkScrollButtons();
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

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/products/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete service');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/services'] });
      toast({
        title: 'Success',
        description: 'Service deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete service',
        variant: 'destructive',
      });
    }
  });

  const handleDeleteService = (serviceId: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  const handleShare = (platform: string, service: Product) => {
    const serviceUrl = `${window.location.origin}`;
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
    <section id="cards-apps-services" className="py-8 sm:py-12 lg:py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 relative">
              Cards & Services
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce"><i className="fas fa-credit-card"></i></div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"><i className="fas fa-sparkles"></i> Premium services and financial products <i className="fas fa-sparkles"></i></span>
          </p>
        </div>
        
        {/* Horizontal Scrolling Container with Border */}
        <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:bg-gray-800/20 dark:border-gray-700/30">
          {/* Scroll Arrows - always rendered on desktop, disabled when no overflow */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-disabled={!canScrollLeft}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-disabled={!canScrollRight}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Horizontal Scrollable Container for All Devices */}
          {/* Coming Soon Message */}
          {displayServices.length === 0 ? (
            <div className="flex items-center justify-center py-16 px-8">
              <div className="text-center">
                <div className="text-6xl mb-4"><i className="fas fa-tools"></i></div>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Amazing Services Coming Soon!
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  Stay tuned for exclusive service deals and offers
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium">
                  <span className="animate-pulse mr-2">⏰</span>
                  New services added daily
                </div>
              </div>
            </div>
          ) : (
            <div 
              ref={scrollContainerRef}
              onWheel={handleWheel}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x'
              }}
            >
              {displayServices.map((service: Product, index: number) => (
              <div 
                key={service.id}
                className="flex-shrink-0 w-64 md:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                {/* Service Image with colored border */}
                <div className={`relative p-2 ${
                  index % 4 === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 
                  index % 4 === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 
                  index % 4 === 2 ? 'bg-gradient-to-br from-pink-500 to-red-500' :
                  'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  <div className="w-full h-32 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={service.imageUrl} 
                      alt={service.name} 
                      className="w-full h-full object-contain p-2" 
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
                <div className="p-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-1.5 relative">
                  {/* Admin Action Buttons - Top Right */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1">
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
                          affiliateUrl: service.affiliateUrl || service.affiliate_url
                        }}
                        contentType="service"
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-colors"
                        buttonText=""
                        showIcon={true}
                      />

                      {/* Delete Button - Admin Only */}
                      <button
                        onClick={() => handleDeleteService(service.id)}
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
                          affiliateUrl: service.affiliateUrl || service.affiliate_url
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
                  <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 leading-tight pr-16 truncate">{service.name}</h4>
                  
                  {/* Service Description with Read More */}
                  <ServiceDescription description={service.description || ''} />
                  
                  {/* Category Badge */}
                  <div className="flex justify-start">
                    <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-xs">
                      {service.category}
                    </span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    <PriceTag
                      product={service}
                      colorClass="text-indigo-600 dark:text-indigo-400"
                      originalClass="text-gray-500 line-through text-sm"
                      freeClass="text-green-600 dark:text-green-400"
                      helperClass="text-xs text-gray-500"
                    />
                  </div>
                  
                  {/* Pick Now Button */}
                  <button 
                    onClick={() => handleAffiliateClick(service)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2 px-3 rounded-lg hover:shadow-lg transition-all duration-300 text-sm"
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
          )}



          {/* More Button */}
          <div className="flex justify-end mt-6">
            <Link 
              href="/services"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              More Services →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Share Automatically Modal */}
      <ShareAutomaticallyModal
        isOpen={shareModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        productName={selectedService?.name || ''}
        platforms={adminPlatformSettings}
      />
    </section>
  );
}
