import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import bannersConfig from '@/config/banners.json';

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
  gradient?: string;
  icon?: string;
}

interface StaticPageBannerProps {
  page: string;
  className?: string;
}

export default function StaticPageBanner({ page, className = '' }: StaticPageBannerProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hiddenBanners, setHiddenBanners] = useState<Set<string>>(new Set());

  // Update hidden banners from localStorage
  const updateHiddenBanners = () => {
    try {
      const stored = localStorage.getItem('hiddenStaticBanners');
      setHiddenBanners(stored ? new Set(JSON.parse(stored)) : new Set());
    } catch {
      setHiddenBanners(new Set());
    }
  };

  useEffect(() => {
    updateHiddenBanners();
    
    // Listen for storage changes
    window.addEventListener('storage', updateHiddenBanners);
    
    // Listen for custom events
    window.addEventListener('hiddenBannersChanged', updateHiddenBanners);
    
    return () => {
      window.removeEventListener('storage', updateHiddenBanners);
      window.removeEventListener('hiddenBannersChanged', updateHiddenBanners);
    };
  }, []);

  // Fallback banners for different pages (hardcoded ones with visibility controls)
  const getFallbackBanner = () => {
    switch (page) {
      case 'prime-picks':
        return {
          title: "Prime Picks",
          subtitle: "Discover our premium selection of top-quality products handpicked just for you!",
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
          subtitle: "Surprise deals and mystery offers - discover amazing products!",
          gradient: "from-purple-600 via-indigo-600 to-blue-600",
          buttonText: "Open Loot Box",
          linkUrl: "/",
          icon: "fas fa-box-open"
        };
      case 'services':
        return {
          title: "Professional Services",
          subtitle: "Premium services and solutions for your business needs",
          gradient: "from-indigo-500 to-purple-600",
          buttonText: "View Services",
          linkUrl: "/",
          icon: "fas fa-cogs"
        };
      case 'apps':
        return {
          title: "Apps & AI Tools",
          subtitle: "Discover the latest apps and AI-powered tools",
          gradient: "from-green-500 to-emerald-600",
          buttonText: "Explore Apps",
          linkUrl: "/",
          icon: "fas fa-robot"
        };
      default:
        return null;
    }
  };

  // Get banners for the current page from static config
  const pageBanners: Banner[] = (bannersConfig as any)[page] || [];
  
  // Filter active static banners and sort by display order
  const activeStaticBanners = pageBanners
    .filter((banner: Banner) => banner.isActive && !hiddenBanners.has(`static-${banner.id}`))
    .sort((a: Banner, b: Banner) => (a.display_order || 0) - (b.display_order || 0));

  // Get fallback banner and check if it's hidden
  const fallbackBanner = getFallbackBanner();
  const isFallbackBannerHidden = hiddenBanners.has(`fallback-${page}`);
  
  const fallbackBanners = fallbackBanner && !isFallbackBannerHidden ? [{
    id: 0,
    title: fallbackBanner.title,
    subtitle: fallbackBanner.subtitle,
    imageUrl: '',
    linkUrl: fallbackBanner.linkUrl,
    buttonText: fallbackBanner.buttonText,
    isActive: true,
    display_order: 0,
    page: page,
    gradient: fallbackBanner.gradient,
    icon: fallbackBanner.icon
  }] : [];

  // Combine fallback banners with static banners
  const activeBanners = [...fallbackBanners, ...activeStaticBanners];

  // Auto-slide functionality for multiple banners
  useEffect(() => {
    if (activeBanners.length <= 1 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [activeBanners.length, isAutoPlaying]);

  // Navigation functions
  const nextSlide = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentBannerIndex(index);
  };

  const handleButtonClick = (banner: Banner) => {
    if (banner.linkUrl) {
      // Use proper navigation instead of direct window.location
            window.location.href = banner.linkUrl;
    }
  };

  const handleBannerHide = (bannerId: number) => {
    setHiddenBanners(prev => new Set([...prev, `static-${bannerId}`]));
    
    // Adjust current index if needed
    if (currentBannerIndex >= activeBanners.length - 1) {
      setCurrentBannerIndex(Math.max(0, activeBanners.length - 2));
    }
  };

  // Don't render if no banners
  if (activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentBannerIndex] || activeBanners[0];

  return (
    <div className={`w-full ${className}`}>
      {/* Static Page Banner Slider */}
      <section className="relative h-80 md:h-96 overflow-hidden bg-gray-900 dark:bg-gray-800">
        {activeBanners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
              index === currentBannerIndex ? 'translate-x-0' : 
              index < currentBannerIndex ? '-translate-x-full' : 'translate-x-full'
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              {banner.imageUrl ? (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-r ${banner.gradient || 'from-gray-600 to-gray-800'}`}></div>
              )}
              <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center justify-center text-center px-4">
              <div className="max-w-4xl mx-auto text-white">
                <h1 className="text-3xl md:text-5xl font-bold mb-2 text-shadow-lg">
                  {banner.icon && <i className={`${banner.icon} mr-3`}></i>}
                  {banner.title || 'Welcome'}
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
                        page === 'travel-picks' ? 'fas fa-plane' :
                        page === 'prime-picks' ? 'fas fa-crown' :
                        page === 'value-picks' ? 'fas fa-gem' :
                        page === 'click-picks' ? 'fas fa-mouse-pointer' :
                        page === 'cue-picks' ? 'fas fa-bullseye' :
                        page === 'global-picks' ? 'fas fa-globe' :
                        page === 'deals-hub' ? 'fas fa-tags' :
                        page === 'loot-box' ? 'fas fa-box-open' :
                        page === 'services' ? 'fas fa-cogs' :
                        page === 'apps' ? 'fas fa-robot' :
                        page === 'videos' ? 'fas fa-play-circle' :
                        'fas fa-star'
                      } mr-2`}></i>
                      {banner.buttonText}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hide Banner Button */}
            <button
              onClick={() => handleBannerHide(banner.id)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
              aria-label="Hide this banner"
              title="Hide this banner"
            >
              <i className="fas fa-times w-4 h-4"></i>
            </button>
          </div>
        ))}

        {/* Navigation Arrows - Only show if multiple banners */}
        {activeBanners.length > 1 && (
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
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {activeBanners.map((_, index) => (
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

        {/* Auto-play Toggle */}
        {activeBanners.length > 1 && (
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
            aria-label={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
            title={isAutoPlaying ? 'Pause auto-play' : 'Resume auto-play'}
          >
            <i className={`fas ${isAutoPlaying ? 'fa-pause' : 'fa-play'} w-4 h-4`}></i>
          </button>
        )}
      </section>
    </div>
  );
}

// Export banner data for admin panel usage
export function getStaticBanners(page?: string) {
  if (page) {
    return (bannersConfig as any)[page] || [];
  }
  return bannersConfig;
}

// Export function to update banner config (for admin panel)
export function updateBannerConfig(newConfig: any) {
  // This would be handled by the admin panel backend
  // The admin panel would write to the banners.json file
  console.log('Banner config update requested:', newConfig);
  return true;
}