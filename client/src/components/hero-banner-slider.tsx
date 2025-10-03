import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';

// Fallback banners if database is not available
export const bannerSlides = [
  {
    id: 1,
    title: "Premium Smartphones",
    subtitle: "Up to 40% Off Latest Models",
    description: "Discover the latest flagship phones with cutting-edge technology",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    ctaText: "Shop Phones",
    ctaLink: "/category/Mobiles%20%26%20Accessories",
    bgGradient: "from-blue-600 to-purple-700"
  },
  {
    id: 2,
    title: "Home & Kitchen Essentials",
    subtitle: "Transform Your Living Space",
    description: "Smart appliances and stylish furniture for modern homes",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    ctaText: "Browse Home",
    ctaLink: "/category/Home%20%26%20Kitchen",
    bgGradient: "from-green-600 to-teal-700"
  },
  {
    id: 3,
    title: "Fashion & Style",
    subtitle: "Trending Designs at Best Prices",
    description: "Curated fashion collection for men, women & kids",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    ctaText: "Shop Fashion",
    ctaLink: "/category/Fashion%20Men",
    bgGradient: "from-pink-600 to-rose-700"
  }
];

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  isActive: boolean;
  displayOrder: number;
  page: string;
  created_at?: string;
  updated_at?: string;
}

export default function HeroBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFashionPopup, setShowFashionPopup] = useState(false);
  const [, setLocation] = useLocation();
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

  // Fetch banners from database
  const { data: dbBanners = [], isLoading } = useQuery({
    queryKey: ['/api/banners/home'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/banners/home');
        if (!response.ok) {
          throw new Error('Failed to fetch banners');
        }
        const data = await response.json();
        return data.banners || [];
      } catch (error) {
        console.warn('Failed to fetch database banners, using fallback:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Disable focus refetch to prevent ERR_ABORTED
  });

  // Convert database banners to slider format
  const convertDbBannersToSlides = (banners: Banner[]) => {
    return banners.map((banner, index) => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.subtitle || '',
      image: banner.imageUrl,
      ctaText: banner.buttonText || 'Learn More',
      ctaLink: banner.linkUrl || '/',
      bgGradient: index % 3 === 0 ? 'from-blue-600 to-purple-700' : 
                  index % 3 === 1 ? 'from-green-600 to-teal-700' : 
                  'from-pink-600 to-rose-700'
    }));
  };

  // Combine database banners with hardcoded fallback banners
  const activeBanners = dbBanners.filter((banner: Banner) => banner.isActive)
                                .sort((a: Banner, b: Banner) => a.displayOrder - b.displayOrder);
  const dbSlides = convertDbBannersToSlides(activeBanners);
  
  // Filter out hidden hardcoded banners
  const visibleBannerSlides = bannerSlides.filter(slide => !hiddenBanners.has(slide.id.toString()));
  
  // Combine visible hardcoded banners + database banners
  const slides = [...visibleBannerSlides, ...dbSlides];

  // Auto-advance only when we have slides
  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) {
    // No banners to show; render nothing instead of breaking
    return null;
  }

  return (
    <section className="relative h-80 md:h-96 overflow-hidden bg-gray-900 dark:bg-gray-800">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            index === currentSlide ? 'translate-x-0' : 
            index < currentSlide ? '-translate-x-full' : 'translate-x-full'
          }`}
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-80`}></div>
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center justify-center text-center px-4">
            <div className="max-w-4xl mx-auto text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-2 text-shadow-lg">
                {slide.title}
              </h2>
              <p className="text-xl md:text-2xl font-semibold mb-4 text-yellow-300">
                {slide.subtitle}
              </p>
              <p className="text-lg md:text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                {slide.description}
              </p>
              {slide.ctaText === "Shop Fashion" ? (
                <div className="relative">
                  <button 
                    onClick={() => setShowFashionPopup(true)}
                    className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {slide.ctaText}
                  </button>
                </div>
              ) : (
                <Link href={slide.ctaLink}>
                  <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
                    {slide.ctaText}
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
        aria-label="Previous slide"
      >
        <i className="fas fa-chevron-left text-xl"></i>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
        aria-label="Next slide"
      >
        <i className="fas fa-chevron-right text-xl"></i>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Fashion Popup Modal */}
      {showFashionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
              Choose Fashion Category
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setLocation("/category/Fashion & Clothing?gender=men");
                  setShowFashionPopup(false);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <i className="fas fa-male text-xl"></i>
                <span>Men's Fashion</span>
              </button>
              <button
                onClick={() => {
                  setLocation("/category/Fashion & Clothing?gender=women");
                  setShowFashionPopup(false);
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <i className="fas fa-female text-xl"></i>
                <span>Women's Fashion</span>
              </button>
              <button
                onClick={() => {
                  setLocation("/category/Kid's Fashion");
                  setShowFashionPopup(false);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <i className="fas fa-child text-xl"></i>
                <span>Kid's Fashion</span>
              </button>
            </div>
            <button
              onClick={() => setShowFashionPopup(false)}
              className="mt-6 w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}