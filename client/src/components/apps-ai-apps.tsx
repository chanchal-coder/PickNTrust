import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductTimer } from "@/components/product-timer";
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
  affiliateNetworkId: number | null;
  affiliateNetworkName: string | null;
  category: string;
  gender: string | null;
  rating: string;
  reviewCount: number;
  discount: number | null;
  isNew: boolean;
  isFeatured: boolean;
  hasTimer: boolean;
  timerDuration: number | null;
  timerStartTime: Date | null;
  createdAt: Date | null;
  pricingType?: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
  isFree?: boolean;
  priceDescription?: string;
  isService?: boolean;
  isAIApp?: boolean;
}

// Sample apps and AI apps data
const sampleAppsAIApps: Product[] = [
  {
    id: 2001,
    name: "ChatGPT Plus",
    description: "Advanced AI assistant with GPT-4 access",
    price: "1,599",
    originalPrice: "1,999",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&q=60",
    affiliateUrl: "https://openai.com/chatgpt",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "AI Apps",
    gender: null,
    rating: "4.9",
    reviewCount: 25420,
    discount: 20,
    isNew: true,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "monthly"
  } as any,
  {
    id: 2002,
    name: "Midjourney Pro",
    description: "AI-powered image generation tool",
    price: "2,399",
    originalPrice: "2,999",
    imageUrl: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=200&q=60",
    affiliateUrl: "https://midjourney.com",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "AI Apps",
    gender: null,
    rating: "4.8",
    reviewCount: 18934,
    discount: 20,
    isNew: true,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "one-time"
  } as any,
  {
    id: 2003,
    name: "Notion AI",
    description: "AI-powered workspace and note-taking",
    price: "799",
    originalPrice: "999",
    imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=60",
    affiliateUrl: "https://notion.so/ai",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Productivity Apps",
    gender: null,
    rating: "4.7",
    reviewCount: 12567,
    discount: 20,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "yearly"
  } as any,
  {
    id: 2004,
    name: "GitHub Copilot",
    description: "AI pair programmer for developers",
    price: "799",
    originalPrice: "999",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&q=60",
    affiliateUrl: "https://github.com/features/copilot",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Developer Tools",
    gender: null,
    rating: "4.6",
    reviewCount: 8789,
    discount: 20,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "monthly"
  } as any,
  {
    id: 2005,
    name: "Jasper AI",
    description: "AI content creation and copywriting",
    price: "2,999",
    originalPrice: "3,999",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=60",
    affiliateUrl: "https://jasper.ai",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "AI Apps",
    gender: null,
    rating: "4.5",
    reviewCount: 6432,
    discount: 25,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "one-time"
  } as any,
  {
    id: 2006,
    name: "Claude Pro",
    description: "Advanced AI assistant by Anthropic",
    price: "1,599",
    originalPrice: "1,999",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&q=60",
    affiliateUrl: "https://claude.ai",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "AI Apps",
    gender: null,
    rating: "4.8",
    reviewCount: 9876,
    discount: 20,
    isNew: true,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "monthly"
  } as any,
  {
    id: 2007,
    name: "Figma Pro",
    description: "Professional design and prototyping tool",
    price: "1,199",
    originalPrice: "1,499",
    imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=200&q=60",
    affiliateUrl: "https://figma.com",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Design Apps",
    gender: null,
    rating: "4.7",
    reviewCount: 15234,
    discount: 20,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "yearly"
  } as any,
  {
    id: 2008,
    name: "Grammarly Premium",
    description: "AI-powered writing assistant",
    price: "999",
    originalPrice: "1,299",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&q=60",
    affiliateUrl: "https://grammarly.com",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Productivity Apps",
    gender: null,
    rating: "4.6",
    reviewCount: 11890,
    discount: 23,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "one-time"
  } as any,
  {
    id: 2009,
    name: "Canva Pro Annual",
    description: "Professional design tools with yearly savings",
    price: "3999",
    originalPrice: "5999",
    imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=200&q=60",
    affiliateUrl: "https://canva.com/pro",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Design Apps",
    gender: null,
    rating: "4.8",
    reviewCount: 15670,
    discount: 33,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "yearly",
    yearlyPrice: "3999"
  } as any,
  {
    id: 2010,
    name: "Free Code Editor",
    description: "Open source code editor with AI assistance",
    price: "0",
    originalPrice: null,
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&q=60",
    affiliateUrl: "https://code.visualstudio.com",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Developer Tools",
    gender: null,
    rating: "4.9",
    reviewCount: 89234,
    discount: null,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "free",
    isFree: true
  } as any,
  {
    id: 2011,
    name: "Adobe Creative Suite",
    description: "Complete creative suite with annual billing",
    price: "19999",
    originalPrice: "29999",
    imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&q=60",
    affiliateUrl: "https://adobe.com/creativecloud",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Design Apps",
    gender: null,
    rating: "4.7",
    reviewCount: 45678,
    discount: 33,
    isNew: true,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "yearly",
    yearlyPrice: "19999"
  } as any
];

export default function AppsAIApps() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check if user is admin (you can implement your own logic)
  const isAdmin = false; // Set to true for admin users

  // Fetch AI Apps products from API
  const { data: aiAppsProducts = [], isLoading } = useQuery({
    queryKey: ['/api/products/apps'],
    queryFn: async () => {
      const response = await fetch('/api/products/apps');
      if (!response.ok) {
        throw new Error('Failed to fetch AI apps products');
      }
      return response.json();
    },
    select: (data) => data || []
  });

  // Use API data if available, fallback to sample data
  const displayApps = aiAppsProducts.length > 0 ? aiAppsProducts : sampleAppsAIApps;

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
    const appText = `Check out this amazing app: ${app.name} - ${formatPrice(app.price, app.currency || 'INR')}${app.originalPrice ? ` (was ${formatPrice(app.originalPrice, app.currency || 'INR')})` : ''} at PickNTrust!`;
    
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
        const instagramText = `🚀 Amazing App Alert! ${app.name}\n\n💰 Price: ${formatPrice(app.price, app.currency || 'INR')}${app.originalPrice ? ` (was ${formatPrice(app.originalPrice, app.currency || 'INR')})` : ''}\n\n✨ Get it now at PickNTrust\n\n#PickNTrust #Apps #${app.category.replace(/\s+/g, '')} #Technology`;
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

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
      updateScrollButtons();
    }
  };

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
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce">🤖</div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">✨ Cutting-edge apps and AI-powered tools ✨</span>
          </p>
        </div>
        
        {/* Horizontal Scrolling Container with Border */}
        <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 dark:bg-gray-800/20 dark:border-gray-700/30">
          {/* Scroll Arrows */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-full shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-full shadow-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 hover:scale-110 hidden md:flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Desktop: Scrollable Container, Mobile: Grid */}
          <div
            ref={scrollContainerRef}
            onWheel={handleWheel}
            className="hidden md:flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-2 relative">
                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [app.id]: !prev[app.id]}))}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 shadow-md transition-colors"
                        title="Share app"
                      >
                        <i className="fas fa-share text-xs"></i>
                      </button>
                      
                      {/* Share Menu */}
                      {showShareMenu[app.id] && (
                        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[160px]">
                          <button
                            onClick={() => handleShare('facebook', app)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-facebook text-blue-600"></i>
                            Facebook
                          </button>
                          <button
                            onClick={() => handleShare('twitter', app)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-twitter text-blue-400"></i>
                            Twitter
                          </button>
                          <button
                            onClick={() => handleShare('whatsapp', app)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-whatsapp text-green-600"></i>
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare('telegram', app)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-telegram text-blue-500"></i>
                            Telegram
                          </button>
                          <button
                            onClick={() => handleShare('instagram', app)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-pink-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-instagram text-pink-600"></i>
                            Instagram
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete Button - Only for admin - Rounded Red Icon */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteApp(app.id)}
                        className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110"
                        title="Delete app"
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
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
                        {app.rating} ({app.reviewCount.toLocaleString()})
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
                      {/* Enhanced pricing display for AI apps - copied from service section */}
                      <div className="flex flex-col space-y-1">
                        {/* Check pricing type first, then specific values */}
                        {app.isFree || (app.pricingType === 'free') ? (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                        ) : app.pricingType === 'custom' ? (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {app.priceDescription || "Custom Pricing"}
                          </span>
                        ) : app.price === '0' && !app.monthlyPrice && !app.yearlyPrice ? (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                        ) : (
                          <>
                            {/* Priority: Custom price description > Monthly > Yearly > Regular price */}
                            {app.priceDescription && app.priceDescription.trim() !== '' ? (
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">{app.priceDescription}</span>
                            ) : app.monthlyPrice && app.monthlyPrice !== '0' ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.monthlyPrice, app.currency || 'INR')}/month</span>
                                {app.originalPrice && (
                                  <span className="text-gray-500 line-through text-sm">{formatPrice(app.originalPrice, app.currency || 'INR')}/month</span>
                                )}
                              </div>
                            ) : app.yearlyPrice && app.yearlyPrice !== '0' ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.yearlyPrice, app.currency || 'INR')}/year</span>
                                {app.originalPrice && (
                                  <span className="text-gray-500 line-through text-sm">{formatPrice(app.originalPrice, app.currency || 'INR')}/year</span>
                                )}
                              </div>
                            ) : app.price && app.price !== '0' ? (
                              <div className="flex items-center space-x-2">
                                {/* For regular price, check pricingType to determine suffix */}
                                {app.pricingType === 'monthly' ? (
                                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency || 'INR')}/month</span>
                                ) : app.pricingType === 'yearly' ? (
                                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency || 'INR')}/year</span>
                                ) : (
                                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency || 'INR')}</span>
                                )}
                                {app.originalPrice && (
                                  <span className="text-gray-500 line-through text-sm">
                                    {formatPrice(app.originalPrice, app.currency || 'INR')}
                                    {app.pricingType === 'monthly' ? '/month' : app.pricingType === 'yearly' ? '/year' : ''}
                                  </span>
                                )}
                              </div>
                            ) : app.pricingType === 'yearly' ? (
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">Contact for Yearly Price</span>
                            ) : app.pricingType === 'monthly' ? (
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">Contact for Monthly Price</span>
                            ) : (
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">Contact for Price</span>
                            )}
                            
                            {/* Show both monthly and yearly if both are available */}
                            {app.monthlyPrice && app.yearlyPrice && app.monthlyPrice !== '0' && app.yearlyPrice !== '0' && !app.priceDescription && (
                              <div className="text-xs text-gray-500">
                                <span>{formatPrice(app.monthlyPrice, app.currency || 'INR')}/month or {formatPrice(app.yearlyPrice, app.currency || 'INR')}/year</span>
                              </div>
                            )}
                            
                            {/* Show pricing type indicator for custom types */}
                            {app.pricingType && !['monthly', 'yearly', 'one-time', 'free'].includes(app.pricingType) && (
                              <span className="text-xs text-gray-500 capitalize">({app.pricingType})</span>
                            )}
                          </>
                        )}
                      </div>
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

          {/* Mobile Horizontal Scroll View */}
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
                  <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
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
                      {/* Enhanced pricing display for mobile AI apps - copied from service section */}
                      <div className="flex flex-col space-y-1">
                        {/* Check pricing type first, then specific values */}
                        {app.isFree || (app.pricingType === 'free') ? (
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">FREE</span>
                        ) : app.pricingType === 'custom' ? (
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {app.priceDescription || "Custom Pricing"}
                          </span>
                        ) : app.price === '0' && !app.monthlyPrice && !app.yearlyPrice ? (
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">FREE</span>
                        ) : (
                          <>
                            {/* Priority: Custom price description > Monthly > Yearly > Regular price */}
                            {app.priceDescription && app.priceDescription.trim() !== '' ? (
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">{app.priceDescription}</span>
                            ) : app.monthlyPrice && app.monthlyPrice !== '0' ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatPrice(app.monthlyPrice, app.currency || 'INR')}/mo</span>
                                {app.originalPrice && (
                                  <span className="text-xs text-gray-500 line-through">{formatPrice(app.originalPrice, app.currency || 'INR')}/mo</span>
                                )}
                              </div>
                            ) : app.yearlyPrice && app.yearlyPrice !== '0' ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatPrice(app.yearlyPrice, app.currency || 'INR')}/yr</span>
                                {app.originalPrice && (
                                  <span className="text-xs text-gray-500 line-through">{formatPrice(app.originalPrice, app.currency || 'INR')}/yr</span>
                                )}
                              </div>
                            ) : app.price && app.price !== '0' ? (
                              <div className="flex items-center space-x-1">
                                {/* For regular price, check pricingType to determine suffix */}
                                {app.pricingType === 'monthly' ? (
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency || 'INR')}/mo</span>
                                ) : app.pricingType === 'yearly' ? (
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency || 'INR')}/yr</span>
                                ) : (
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency || 'INR')}</span>
                                )}
                                {app.originalPrice && (
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatPrice(app.originalPrice, app.currency || 'INR')}
                                    {app.pricingType === 'monthly' ? '/mo' : app.pricingType === 'yearly' ? '/yr' : ''}
                                  </span>
                                )}
                              </div>
                            ) : app.pricingType === 'yearly' ? (
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">Contact for Yearly Price</span>
                            ) : app.pricingType === 'monthly' ? (
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">Contact for Monthly Price</span>
                            ) : (
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">Contact for Price</span>
                            )}
                            
                            {/* Show both monthly and yearly if both are available */}
                            {app.monthlyPrice && app.yearlyPrice && app.monthlyPrice !== '0' && app.yearlyPrice !== '0' && !app.priceDescription && (
                              <div className="text-xs text-gray-500">
                                <span>{formatPrice(app.monthlyPrice, app.currency || 'INR')}/mo or {formatPrice(app.yearlyPrice, app.currency || 'INR')}/yr</span>
                              </div>
                            )}
                            
                            {/* Show pricing type indicator for custom types */}
                            {app.pricingType && !['monthly', 'yearly', 'one-time', 'free'].includes(app.pricingType) && (
                              <span className="text-xs text-gray-500 capitalize">({app.pricingType})</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <a
                      href={app.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                    >
                      Get →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

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