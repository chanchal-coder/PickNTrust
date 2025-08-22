import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import Header from "@/components/header";
import Footer from "@/components/footer";

// Define Product type locally to match the complete schema with service pricing fields
interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  originalPrice: string | null;
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
  isService: boolean;
  hasTimer: boolean;
  timerDuration: number | null;
  timerStartTime: Date | null;
  createdAt: Date | null;
  // Service-specific pricing fields
  pricingType?: string | null;
  monthlyPrice?: string | null;
  yearlyPrice?: string | null;
  isFree?: boolean;
  priceDescription?: string | null;
}

// Extended sample cards, apps and services data
const sampleCardsAppsServices: Product[] = [
  {
    id: 1001,
    name: "Netflix Premium Subscription",
    description: "Stream unlimited movies and TV shows in 4K with HDR support",
    price: "649",
    originalPrice: "799",
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
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1002,
    name: "Amazon Prime Credit Card",
    description: "Earn 5% cashback on Amazon purchases and 1% on all other purchases",
    price: "0",
    originalPrice: null,
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
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1003,
    name: "Spotify Premium Family",
    description: "Music streaming for up to 6 accounts with offline downloads",
    price: "179",
    originalPrice: "199",
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
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1004,
    name: "Adobe Creative Cloud",
    description: "Complete suite of creative apps including Photoshop, Illustrator, and more",
    price: "1675",
    originalPrice: "2290",
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
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1005,
    name: "HDFC Bank Cashback Card",
    description: "Get 1.5% cashback on all purchases with no annual fee for first year",
    price: "0",
    originalPrice: null,
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
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1006,
    name: "Microsoft 365 Personal",
    description: "Office apps + 1TB OneDrive storage with premium features",
    price: "4199",
    originalPrice: "5299",
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
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1007,
    name: "Disney+ Hotstar Premium",
    description: "Watch Disney, Marvel, Star Wars & live sports in 4K",
    price: "299",
    originalPrice: "399",
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
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1008,
    name: "Canva Pro Subscription",
    description: "Professional design tools with premium templates and assets",
    price: "399",
    originalPrice: "499",
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
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1009,
    name: "YouTube Premium Family",
    description: "Ad-free YouTube with YouTube Music for up to 6 members",
    price: "189",
    originalPrice: "229",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80",
    affiliateUrl: "https://youtube.com/premium",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Streaming Services",
    gender: null,
    rating: "4.6",
    reviewCount: 9543,
    discount: 17,
    isNew: false,
    isFeatured: true,
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1010,
    name: "SBI SimplyCLICK Card",
    description: "Earn 10X reward points on online shopping and dining",
    price: "0",
    originalPrice: null,
    imageUrl: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=400&q=80",
    affiliateUrl: "https://sbi.co.in/credit-cards",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Credit Cards",
    gender: null,
    rating: "4.3",
    reviewCount: 4567,
    discount: null,
    isNew: false,
    isFeatured: true,
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1011,
    name: "Notion Pro Workspace",
    description: "All-in-one workspace for notes, docs, and project management",
    price: "399",
    originalPrice: "499",
    imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&q=80",
    affiliateUrl: "https://notion.so/pricing",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Productivity Tools",
    gender: null,
    rating: "4.8",
    reviewCount: 6789,
    discount: 20,
    isNew: false,
    isFeatured: true,
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  },
  {
    id: 1012,
    name: "Grammarly Premium",
    description: "Advanced writing assistant with plagiarism checker",
    price: "599",
    originalPrice: "799",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80",
    affiliateUrl: "https://grammarly.com/premium",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Writing Tools",
    gender: null,
    rating: "4.7",
    reviewCount: 8901,
    discount: 25,
    isNew: false,
    isFeatured: true,
    isService: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date()
  }
];

export default function Services() {
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

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

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(displayServices.map(service => service.category)))];

  // Filter services by category
  const filteredServices = selectedCategory === 'All' 
    ? displayServices 
    : displayServices.filter(service => service.category === selectedCategory);

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
        const instagramText = `💳 Amazing Service Alert! ${service.name}\n\n💰 Price: ${service.price === '0' ? 'FREE' : `₹${service.price}/month`}${service.originalPrice ? ` (was ₹${service.originalPrice})` : ''}\n\n✨ Get the best services at PickNTrust\n\n#PickNTrust #Services #${service.category.replace(/\s+/g, '')}`;
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="relative inline-block">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 relative">
                  Cards, Apps & Services
                  <div className="absolute -top-2 -right-6 text-2xl animate-bounce">💳</div>
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium max-w-3xl mx-auto">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ✨ Discover premium digital services, financial products, and exclusive offers at unbeatable prices ✨
                </span>
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
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
                    {/* Share Button - Top Right */}
                    <div className="absolute top-2 right-2">
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
                    
                    {/* Price - Enhanced for all service pricing types */}
                    <div className="flex flex-col space-y-1">
                      {/* Check for free service first - prioritize isFree flag over price values */}
                      {service.isFree || (service.pricingType === 'free') ? (
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                      ) : service.price === '0' && !service.monthlyPrice && !service.yearlyPrice ? (
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                      ) : (
                        <>
                          {/* Priority: Custom price description > Monthly > Yearly > Regular price */}
                          {service.priceDescription ? (
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{service.priceDescription}</span>
                          ) : service.monthlyPrice && service.monthlyPrice !== '0' ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{service.monthlyPrice}/month</span>
                              {service.originalPrice && (
                                <span className="text-gray-500 line-through text-sm">₹{service.originalPrice}/month</span>
                              )}
                            </div>
                          ) : service.yearlyPrice && service.yearlyPrice !== '0' ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{service.yearlyPrice}/year</span>
                              {service.originalPrice && (
                                <span className="text-gray-500 line-through text-sm">₹{service.originalPrice}/year</span>
                              )}
                            </div>
                          ) : service.price && service.price !== '0' ? (
                            <div className="flex items-center space-x-2">
                              {/* For regular price, check pricingType to determine suffix */}
                              {service.pricingType === 'monthly' ? (
                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{service.price}/month</span>
                              ) : service.pricingType === 'yearly' ? (
                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{service.price}/year</span>
                              ) : (
                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">₹{service.price}</span>
                              )}
                              {service.originalPrice && (
                                <span className="text-gray-500 line-through text-sm">
                                  ₹{service.originalPrice}
                                  {service.pricingType === 'monthly' ? '/month' : service.pricingType === 'yearly' ? '/year' : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Contact for Price</span>
                          )}
                          
                          {/* Show both monthly and yearly if both are available */}
                          {service.monthlyPrice && service.yearlyPrice && service.monthlyPrice !== '0' && service.yearlyPrice !== '0' && !service.priceDescription && (
                            <div className="text-xs text-gray-500">
                              <span>₹{service.monthlyPrice}/month or ₹{service.yearlyPrice}/year</span>
                            </div>
                          )}
                          
                          {/* Show pricing type indicator for custom types */}
                          {service.pricingType && !['monthly', 'yearly', 'one-time', 'free'].includes(service.pricingType) && (
                            <span className="text-xs text-gray-500 capitalize">({service.pricingType})</span>
                          )}
                        </>
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

            {/* Back to Home Button */}
            <div className="flex justify-center mt-12">
              <Link 
                href="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <i className="fas fa-arrow-left mr-3"></i>
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
