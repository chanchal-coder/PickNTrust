import { useState, useEffect } from "react";
import { Link } from "wouter";

const bannerSlides = [
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

export default function HeroBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  return (
    <section className="relative h-80 md:h-96 overflow-hidden bg-gray-900 dark:bg-gray-800">
      {bannerSlides.map((slide, index) => (
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
              <Link href={slide.ctaLink}>
                <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-100 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
                  {slide.ctaText}
                </button>
              </Link>
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
        {bannerSlides.map((_, index) => (
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
    </section>
  );
}