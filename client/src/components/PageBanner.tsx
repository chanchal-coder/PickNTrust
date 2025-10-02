import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  isActive: boolean;
  display_order: number;
  page: string;
  // Icon and emoji support
  icon?: string;
  iconType?: 'emoji' | 'fontawesome' | 'none';
  iconPosition?: 'left' | 'right' | 'top';
  created_at?: string;
  updated_at?: string;
}

interface PageBannerProps {
  page: string;
  className?: string;
}

export default function PageBanner({ page, className = '' }: PageBannerProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hiddenBanners, setHiddenBanners] = useState<Set<string>>(new Set());

  // Listen for localStorage changes
  useEffect(() => {
    const updateHiddenBanners = () => {
      try {
        const stored = localStorage.getItem('hiddenStaticBanners');
        setHiddenBanners(stored ? new Set(JSON.parse(stored)) : new Set());
      } catch {
        setHiddenBanners(new Set());
      }
    };

    // Initial load
    updateHiddenBanners();

    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener('storage', updateHiddenBanners);
    
    // Listen for custom events (changes from same tab)
    window.addEventListener('hiddenBannersChanged', updateHiddenBanners);

    return () => {
      window.removeEventListener('storage', updateHiddenBanners);
      window.removeEventListener('hiddenBannersChanged', updateHiddenBanners);
    };
  }, []);

  // Fallback banners for different pages when API is not available
  const getFallbackBanner = () => {
    switch (page) {
      case 'top-picks':
        return {
          title: "Top Picks",
          subtitle: "Handpicked premium products chosen by our experts for exceptional quality!",
          gradient: "from-purple-600 via-pink-600 to-orange-500",
          buttonText: "2 Hot Deals Available",
          linkUrl: "/"
        };
      case 'prime-picks':
        return {
          title: "Prime Picks",
          subtitle: "Discover our premium selection of top-quality home décor products handpicked just for you!",
          gradient: "from-purple-600 via-pink-600 to-orange-500",
          buttonText: "Explore Prime Deals",
          linkUrl: "/",
          icon: "fas fa-crown"
        };
      case 'value-picks':
        return {
          title: "Value Picks",
          subtitle: "Maximum value for your money - Best bang for buck",
          gradient: "from-green-600 via-emerald-600 to-teal-600",
          buttonText: "Find Value Deals",
          linkUrl: "/",
          icon: "fas fa-gem"
        };
      case 'click-picks':
        return {
          title: "Click Picks",
          subtitle: "One-click shopping for the most popular products",
          gradient: "from-blue-600 via-indigo-600 to-purple-500",
          buttonText: "Quick Shop Now",
          linkUrl: "/",
          icon: "fas fa-mouse-pointer"
        };
      case 'cue-picks':
        return {
          title: "Cue Picks",
          subtitle: "Trending products curated just for you",
          gradient: "from-red-600 via-pink-600 to-rose-600",
          buttonText: "Browse Trends",
          linkUrl: "/",
          icon: "fas fa-bullseye"
        };
      case 'global-picks':
        return {
          title: "Global Picks",
          subtitle: "International favorites from around the world",
          gradient: "from-cyan-600 via-blue-600 to-indigo-600",
          buttonText: "Explore Global",
          linkUrl: "/",
          icon: "fas fa-globe"
        };
      case 'deals-hub':
        return {
          title: "Deals Hub",
          subtitle: "Your central destination for the best deals and discounts",
          gradient: "from-red-600 via-orange-600 to-yellow-500",
          buttonText: "Browse Deals",
          linkUrl: "/",
          icon: "fas fa-tags"
        };
      case 'loot-box':
        return {
          title: "Loot Box",
          subtitle: "Surprise deals and mystery products waiting to be discovered",
          gradient: "from-purple-600 via-indigo-600 to-blue-600",
          buttonText: "Open Loot Box",
          linkUrl: "/",
          icon: "fas fa-box-open"
        };
      case 'services':
        return {
          title: "Services",
          subtitle: "Premium cards, financial services, and digital solutions for your needs",
          gradient: "from-indigo-500 to-purple-600",
          buttonText: "Explore Services",
          linkUrl: "/"
        };
      case 'apps':
      case 'apps-ai':
        return {
          title: "Apps & AI Apps",
          subtitle: "Cutting-edge AI tools and innovative applications for modern life",
          gradient: "from-green-500 to-emerald-600",
          buttonText: "Discover Apps",
          linkUrl: "/"
        };
      case 'videos':
        return {
          title: "Video Content",
          subtitle: "Watch our curated collection of informative and entertaining videos!",
          gradient: "from-red-600 via-pink-600 to-purple-600",
          buttonText: "Watch Videos",
          linkUrl: "/videos"
        };
      default:
        return null;
    }
  };

  // Fallback FontAwesome icon per page (aligns with nav tabs)
  const getPageIcon = (slug: string): string => {
    switch (slug) {
      case 'home': return 'fas fa-home';
      case 'top-picks': return 'fas fa-star';
      case 'prime-picks': return 'fas fa-crown';
      case 'value-picks': return 'fas fa-gem';
      case 'click-picks': return 'fas fa-mouse-pointer';
      case 'cue-picks': return 'fas fa-bullseye';
      case 'global-picks': return 'fas fa-globe';
      case 'deals-hub': return 'fas fa-fire';
      case 'loot-box': return 'fas fa-box-open';
      case 'services': return 'fas fa-cogs';
      case 'apps':
      case 'apps-ai': return 'fas fa-robot';
      case 'videos': return 'fas fa-play-circle';
      case 'categories': return 'fas fa-th-large';
      case 'browse-categories': return 'fas fa-layer-group';
      case 'travel-picks': return 'fas fa-plane';
      default: return 'fas fa-star';
    }
  };

  // Helper: ensure we only render Font Awesome classes, never emoji strings
  const isFontAwesomeClass = (icon?: string) => !!icon && /fa-/.test(icon);
  const resolveFaIconClass = (icon?: string, slug?: string) => (
    isFontAwesomeClass(icon) ? (icon as string) : getPageIcon(slug || page)
  );
  // Sanitize CTA text to remove emojis so only FA icon shows
  const cleanButtonText = (text?: string) => (text || '').replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '').trim();

  // Remove test data - using real API data now

  // Fetch banners from API for all pages
  const { data: banners = [], isLoading, error } = useQuery({
    queryKey: [`banners-${page}`],
    queryFn: async () => {
      console.log(`Fetching banners for page: ${page}`);
      
      // Use proxy for API calls
      const response = await fetch(`/api/banners/${page}`);
      console.log(`API call status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch banners for ${page}:`, response.status, response.statusText);
        throw new Error('Failed to fetch banners');
      }
      const data = await response.json();
      console.log(`Banners fetched for ${page}:`, data);
      return data.banners || [];
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Use API data for all pages
  const finalBanners = banners;

  // Filter active banners and sort by display order
  const activeBanners: Banner[] = finalBanners
    .filter((banner: Banner) => banner.isActive)
    .sort((a: Banner, b: Banner) => (a.display_order || 0) - (b.display_order || 0));

  // Combine database banners with fallback banners (moved up for useEffect dependency)
  const fallbackBanner = getFallbackBanner();
  
  // Check if static banner is hidden using state
  const isStaticBannerHidden = hiddenBanners.has(`fallback-${page}`);
  
  // Re-enable fallback banner when there are no active DB banners
  const fallbackBanners: Banner[] = (!isStaticBannerHidden && activeBanners.length === 0 && fallbackBanner) ? [{
    id: 0,
    title: fallbackBanner.title,
    subtitle: fallbackBanner.subtitle,
    imageUrl: '',
    linkUrl: fallbackBanner.linkUrl,
    buttonText: fallbackBanner.buttonText,
    isActive: true,
    display_order: 0,
    page: page,
    // Show FontAwesome icon if provided in fallback
    icon: (fallbackBanner as any).icon,
    iconType: (fallbackBanner as any).icon ? 'fontawesome' : 'none',
    iconPosition: 'left'
  }] : [];

  // Use database banners, and include a single fallback if none
  const allBanners = [...activeBanners, ...fallbackBanners];
   
   console.log(`Page: ${page}, All banners:`, allBanners);
   console.log(`Should show slider: ${allBanners.length > 1}`);
   console.log(`Active banners from API:`, activeBanners);
   console.log(`Fallback banners:`, fallbackBanners);

  // Auto-slide functionality for multiple banners
  useEffect(() => {
    if (allBanners.length <= 1 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % allBanners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [allBanners.length, isAutoPlaying]);

  // Handle manual navigation
  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentBannerIndex((prev) => 
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentBannerIndex(index);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  // Navigation functions
  const nextSlide = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % allBanners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const prevSlide = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + allBanners.length) % allBanners.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  // Handle button click
  const handleButtonClick = (banner: Banner) => {
    if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('http')) {
        // External link
        window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Internal link
        // Use proper navigation instead of direct window.location
            window.location.href = banner.linkUrl;
      }
    }
  };



  // Don't render if no banners at all
  if (allBanners.length === 0) {
    return null;
  }

  // Use current banner from combined list
  const currentBanner = allBanners[currentBannerIndex] || allBanners[0];
  const bannerData = currentBanner;

  return (
    <div className={`w-full ${className}`}>
      {/* Dynamic Page Banner Slider */}
      <section className="relative h-80 md:h-96 overflow-hidden bg-gray-900 dark:bg-gray-800">
        {allBanners.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
              index === currentBannerIndex ? 'translate-x-0' : 
              index < currentBannerIndex ? '-translate-x-full' : 'translate-x-full'
            }`}
          >
            {/* Background: respect imported gradient/image/text-only for all pages */}
            <div className="absolute inset-0">
              {(() => {
                const opacity = (((banner as any).backgroundOpacity ?? 100) as number) / 100;
                const imageDisplayType = (banner as any).imageDisplayType || 'image';
                const useGradient = !!(banner as any).useGradient;
                const bgGradient = (banner as any).backgroundGradient as string | undefined;
                const bgColor = (banner as any).backgroundColor as string | undefined;

                // If text-only or explicitly using gradient, render gradient
                if (imageDisplayType === 'text-only' || useGradient) {
                  const gradientClass = bgGradient && bgGradient.trim().length > 0
                    ? bgGradient
                    : `bg-gradient-to-r ${fallbackBanner?.gradient || 'from-gray-600 to-gray-800'}`;
                  return (
                    <div className={`w-full h-full ${gradientClass}`} style={{ opacity }}></div>
                  );
                }

                // Unsplash image mode
                if (imageDisplayType === 'unsplash' && (banner as any).unsplashQuery) {
                  return (
                    <img
                      src={`https://picsum.photos/1200/400?random=${encodeURIComponent((banner as any).unsplashQuery)}`}
                      alt={banner.title || 'Banner image'}
                      className="w-full h-full object-cover"
                      style={{ opacity }}
                    />
                  );
                }

                // Custom image
                if (banner.imageUrl) {
                  return (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner image'}
                      className="w-full h-full object-cover"
                      style={{ opacity }}
                    />
                  );
                }

                // Background color fallback if provided
                if (bgColor) {
                  return (
                    <div className="w-full h-full" style={{ backgroundColor: bgColor, opacity }}></div>
                  );
                }

                // Final gradient fallback
                return (
                  <div
                    className={`w-full h-full bg-gradient-to-r ${banner.id === 0 ? (fallbackBanner?.gradient || 'from-gray-600 to-gray-800') : 'from-gray-600 to-gray-800'}`}
                    style={{ opacity }}
                  ></div>
                );
              })()}
              <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center justify-center text-center px-4">
              <div className="max-w-4xl mx-auto text-white">
                {/* Icon Above Title (use banner icon or page fallback) */}
                {(() => {
                  const resolvedIcon = resolveFaIconClass(banner.icon, page);
                  // Default to top position
                  return resolvedIcon && ((banner.iconPosition || 'top') === 'top');
                })() && (
                  <div className="mb-4">
                    <i className={`${resolveFaIconClass(banner.icon, page)} text-5xl md:text-7xl text-white`}></i>
                  </div>
                )}
                
                {/* Title with Side Icons */}
                <h1 className="text-3xl md:text-5xl font-bold mb-2 text-shadow-lg flex items-center justify-center gap-4">
                  {/* Left Icon */}
                  {(() => {
                    const resolvedIcon = resolveFaIconClass(banner.icon, page);
                    return resolvedIcon && ((banner.iconPosition || 'top') === 'left');
                  })() && (
                    <span className="flex-shrink-0">
                      <i className={`${resolveFaIconClass(banner.icon, page)} text-2xl md:text-4xl text-white`}></i>
                    </span>
                  )}
                  
                  <span>{banner.title || 'Welcome'}</span>
                  
                  {/* Right Icon */}
                  {(() => {
                    const resolvedIcon = resolveFaIconClass(banner.icon, page);
                    return resolvedIcon && ((banner.iconPosition || 'top') === 'right');
                  })() && (
                    <span className="flex-shrink-0">
                      <i className={`${resolveFaIconClass(banner.icon, page)} text-2xl md:text-4xl text-white`}></i>
                    </span>
                  )}
                </h1>
                <p className="text-xl md:text-2xl font-semibold mb-4 text-yellow-300">
                  {banner.subtitle || 'Discover amazing products and services'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                  <a 
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to Home
                  </a>
                  {banner.buttonText && (
                    <button
                      onClick={() => handleButtonClick(banner)}
                      className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-lg"
                    >
                      <i className={`${
                        page === 'top-picks' ? 'fas fa-star' :
                        page === 'prime-picks' ? 'fas fa-crown' :
                        page === 'value-picks' ? 'fas fa-gem' :
                        page === 'click-picks' ? 'fas fa-mouse-pointer' :
                        page === 'cue-picks' ? 'fas fa-bullseye' :
                        page === 'global-picks' ? 'fas fa-globe' :
                        page === 'deals-hub' ? 'fas fa-fire' :
                        page === 'loot-box' ? 'fas fa-box-open' :
                        page === 'services' ? 'fas fa-cogs' :
                        page === 'categories' ? 'fas fa-th-large' :
                        page === 'browse-categories' ? 'fas fa-layer-group' :
                        page === 'travel-picks' ? 'fas fa-plane' :
                        (page === 'apps' || page === 'apps-ai') ? 'fas fa-robot' :
                        'fas fa-star'
                      } mr-2`}></i>
                      {cleanButtonText(banner.buttonText)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows - Only show if multiple banners */}
        {allBanners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10"
              aria-label="Next banner"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator - Only show if multiple banners */}
        {allBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {allBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Export banner hook for other components
export function useBanners(page: string) {
  return useQuery<Banner[]>({
    queryKey: [`/api/banners/${page}`],
    queryFn: async () => {
      const response = await fetch(`/api/banners/${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }
      const data = await response.json();
      return data.banners || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}