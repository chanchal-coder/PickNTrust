import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { formatPrice } from '@/utils/currency';

// Define Product type locally to match the complete schema
interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  originalPrice: string | null;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  affiliateNetworkId?: number | null;
  affiliateNetworkName?: string | null;
  category: string;
  gender?: string | null;
  rating: string;
  reviewCount: number;
  discount?: number | null;
  isNew: boolean;
  isFeatured: boolean;
  hasTimer?: boolean;
  timerDuration?: number | null;
  timerStartTime?: Date | null;
  createdAt?: Date | null;
  pricingType?: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
  isFree?: boolean;
  priceDescription?: string;
  isService?: boolean;
  isAIApp?: boolean;
}

// Sample cards, apps and services data
const sampleCardsAppsServices: Product[] = [
  {
    id: 1001,
    name: "Netflix Premium Subscription",
    description: "Stream unlimited movies and TV shows in 4K",
    price: "649",
    originalPrice: "799",
    currency: "INR",
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&q=80",
    affiliateUrl: "https://netflix.com/subscribe",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Streaming Services",
    gender: null,
    rating: "4.8",
    reviewCount: 15420,
    discount: 19,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1002,
    name: "Amazon Prime Credit Card",
    description: "Earn 5% cashback on Amazon purchases",
    price: "0",
    originalPrice: null,
    currency: "INR",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
    affiliateUrl: "https://amazon.in/credit-card",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Credit Cards",
    gender: null,
    rating: "4.6",
    reviewCount: 8934,
    discount: null,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1003,
    name: "Spotify Premium Family",
    description: "Music streaming for up to 6 accounts",
    price: "179",
    originalPrice: "199",
    currency: "INR",
    imageUrl: "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400&q=80",
    affiliateUrl: "https://spotify.com/premium",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Music Streaming",
    gender: null,
    rating: "4.7",
    reviewCount: 12567,
    discount: 10,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1004,
    name: "Adobe Creative Cloud",
    description: "Complete suite of creative apps",
    price: "1675",
    originalPrice: "2290",
    currency: "INR",
    imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&q=80",
    affiliateUrl: "https://adobe.com/creativecloud",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Software & Apps",
    gender: null,
    rating: "4.5",
    reviewCount: 6789,
    discount: 27,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1005,
    name: "HDFC Bank Cashback Card",
    description: "Get 1.5% cashback on all purchases",
    price: "0",
    originalPrice: null,
    currency: "INR",
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
    affiliateUrl: "https://hdfcbank.com/credit-cards",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Credit Cards",
    gender: null,
    rating: "4.4",
    reviewCount: 5432,
    discount: null,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1006,
    name: "Microsoft 365 Personal",
    description: "Office apps + 1TB OneDrive storage",
    price: "4199",
    originalPrice: "5299",
    currency: "INR",
    imageUrl: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=400&q=80",
    affiliateUrl: "https://microsoft.com/microsoft-365",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Software & Apps",
    gender: null,
    rating: "4.6",
    reviewCount: 9876,
    discount: 21,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1007,
    name: "Disney+ Hotstar Premium",
    description: "Watch Disney, Marvel, Star Wars & more",
    price: "299",
    originalPrice: "399",
    currency: "INR",
    imageUrl: "https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400&q=80",
    affiliateUrl: "https://hotstar.com/subscribe",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Streaming Services",
    gender: null,
    rating: "4.5",
    reviewCount: 11234,
    discount: 25,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1008,
    name: "Canva Pro Subscription",
    description: "Professional design tools for everyone",
    price: "399",
    originalPrice: "499",
    currency: "INR",
    imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&q=80",
    affiliateUrl: "https://canva.com/pro",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Design Tools",
    gender: null,
    rating: "4.7",
    reviewCount: 7890,
    discount: 20,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  }
];

export default function CardsAppsServices() {
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is admin (simple check - in production use proper auth)
  const isAdmin = window.location.pathname.includes('/admin') || 
                  localStorage.getItem('isAdmin') === 'true' ||
                  window.location.search.includes('admin=true');

  // Fetch cards/apps/services from API (fallback to sample data)
  const { data: services } = useQuery<Product[]>({
    queryKey: ['/api/products/services'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/products/services');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.length > 0 ? data : sampleCardsAppsServices;
      } catch {
        return sampleCardsAppsServices;
      }
    },
    retry: 1
  });

  const displayServices = services || sampleCardsAppsServices;

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
    const serviceText = `Check out this amazing service: ${service.name} - ${service.price === '0' ? 'FREE' : `${formatPrice(service.price, service.currency || 'INR')}/month`} at PickNTrust!`;
    
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
        const instagramText = `💳 Amazing Service Alert! ${service.name}\n\n💰 Price: ${service.price === '0' ? 'FREE' : `${formatPrice(service.price, service.currency || 'INR')}/month`}${service.originalPrice ? ` (was ${formatPrice(service.originalPrice, service.currency || 'INR')})` : ''}\n\n✨ Get the best services at PickNTrust\n\n#PickNTrust #Services #${service.category.replace(/\s+/g, '')}`;
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
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce">💳</div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">✨ Premium services and financial products ✨</span>
          </p>
        </div>
        
        {/* Horizontal Scrolling Container with Border */}
        <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:bg-gray-800/20 dark:border-gray-700/30">
          {/* Scroll Arrows */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Horizontal Scrollable Container for All Devices */}
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
                className="flex-shrink-0 w-72 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
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
                      src={service.imageUrl} 
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
                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [service.id]: !prev[service.id]}))}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-2 shadow-md transition-colors"
                        title="Share service"
                      >
                        <i className="fas fa-share text-xs"></i>
                      </button>
                      
                      {/* Share Menu */}
                      {showShareMenu[service.id] && (
                        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
                          <button
                            onClick={() => handleShare('facebook', service)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-facebook text-blue-600"></i>
                            Facebook
                          </button>
                          <button
                            onClick={() => handleShare('twitter', service)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded w-full text-left text-gray-700"
                          >
                            <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                              <span className="text-white text-xs font-bold">𝕏</span>
                            </div>
                            X (Twitter)
                          </button>
                          <button
                            onClick={() => handleShare('whatsapp', service)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-whatsapp text-green-600"></i>
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare('instagram', service)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-instagram text-purple-600"></i>
                            Instagram
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete Button - Only for admin */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                        title="Delete service"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    )}
                  </div>

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
                  
                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    {/* Enhanced pricing display for services */}
                    {(service as any).isFree || (service.pricingType === 'free') || service.price === '0' || Number(service.price) === 0 ? (
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                    ) : (service as any).priceDescription && service.pricingType === 'custom' ? (
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{(service as any).priceDescription}</span>
                    ) : (service.pricingType === 'monthly' || service.pricingType === 'Monthly Subscription') && service.monthlyPrice && service.monthlyPrice !== '0' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(service.monthlyPrice, service.currency || 'INR')}/month</span>
                        {service.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">{formatPrice(service.originalPrice, service.currency || 'INR')}/month</span>
                        )}
                      </div>
                    ) : (service.pricingType === 'yearly' || service.pricingType === 'Yearly Subscription') && service.yearlyPrice && service.yearlyPrice !== '0' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(service.yearlyPrice, service.currency || 'INR')}/year</span>
                        {service.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">{formatPrice(service.originalPrice, service.currency || 'INR')}/year</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {/* For regular price, check pricingType to determine suffix */}
                        {service.pricingType === 'Monthly Subscription' ? (
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(service.price, service.currency || 'INR')}/month</span>
                        ) : service.pricingType === 'Yearly Subscription' ? (
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(service.price, service.currency || 'INR')}/year</span>
                        ) : service.pricingType === 'One-time Payment' ? (
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(service.price, service.currency || 'INR')}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">One-time payment</span>
                          </div>
                        ) : service.price && service.price !== '0' && String(service.price).trim() !== '' ? (
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(service.price, service.currency || 'INR')}</span>
                        ) : (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                        )}
                        {service.originalPrice && service.pricingType !== 'One-time Payment' && (
                          <span className="text-gray-500 line-through text-sm">
                            {formatPrice(service.originalPrice, service.currency || 'INR')}
                            {(service.pricingType === 'monthly' || service.pricingType === 'Monthly Subscription') ? '/month' : (service.pricingType === 'yearly' || service.pricingType === 'Yearly Subscription') ? '/year' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Get Now Button */}
                  <button 
                    onClick={() => handleAffiliateClick(service)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 text-sm"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>Get Now
                  </button>
                  
                  {/* Affiliate Link Text */}
                  <p className="text-[10px] text-gray-400 text-center mt-1">
                    🔗 Affiliate Link - We earn from sign-ups
                  </p>
                </div>
              </div>
            ))}
          </div>



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
    </section>
  );
}
