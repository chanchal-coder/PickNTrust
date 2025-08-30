import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import Header from '@/components/header';
import Footer from '@/components/footer';
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

// Extended sample apps and AI apps data
const sampleAppsAIApps: Product[] = [
  {
    id: 2001,
    name: "ChatGPT Plus",
    description: "Advanced AI assistant with GPT-4 access, unlimited usage, and priority access to new features",
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
    pricingType: "Monthly Subscription"
  } as any,
  {
    id: 2002,
    name: "Midjourney Pro",
    description: "AI-powered image generation tool with unlimited fast generations and commercial usage rights",
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
    pricingType: "One-time Payment"
  } as any,
  {
    id: 2003,
    name: "Notion AI",
    description: "AI-powered workspace and note-taking with intelligent writing assistance and content generation",
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
    pricingType: "Yearly Subscription"
  } as any,
  {
    id: 2004,
    name: "GitHub Copilot",
    description: "AI pair programmer for developers with code suggestions, completions, and intelligent assistance",
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
    pricingType: "Monthly Subscription"
  } as any,
  {
    id: 2005,
    name: "Jasper AI",
    description: "AI content creation and copywriting tool for marketing, blogs, and creative writing",
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
    pricingType: "One-time Payment"
  } as any,
  {
    id: 2006,
    name: "Claude Pro",
    description: "Advanced AI assistant by Anthropic with enhanced reasoning and longer conversations",
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
    pricingType: "Monthly Subscription"
  } as any,
  {
    id: 2007,
    name: "Figma Pro",
    description: "Professional design and prototyping tool with advanced collaboration features",
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
    pricingType: "Yearly Subscription"
  } as any,
  {
    id: 2008,
    name: "Grammarly Premium",
    description: "AI-powered writing assistant with advanced grammar checking and style suggestions",
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
    pricingType: "One-time Payment"
  } as any,
  {
    id: 2009,
    name: "Canva Pro",
    description: "Professional design platform with AI-powered design tools and premium templates",
    price: "999",
    originalPrice: "1,199",
    imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=200&q=60",
    affiliateUrl: "https://canva.com/pro",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Design Apps",
    gender: null,
    rating: "4.7",
    reviewCount: 22345,
    discount: 17,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "Monthly Subscription"
  } as any,
  {
    id: 2010,
    name: "Copy.ai Pro",
    description: "AI copywriting tool for marketing content, social media posts, and email campaigns",
    price: "1,799",
    originalPrice: "2,299",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&q=60",
    affiliateUrl: "https://copy.ai",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "AI Apps",
    gender: null,
    rating: "4.4",
    reviewCount: 7654,
    discount: 22,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "Yearly Subscription"
  } as any,
  {
    id: 2011,
    name: "Loom Pro",
    description: "Screen recording and video messaging tool for teams and creators",
    price: "799",
    originalPrice: "999",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&q=60",
    affiliateUrl: "https://loom.com",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "Productivity Apps",
    gender: null,
    rating: "4.5",
    reviewCount: 9876,
    discount: 20,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "One-time Payment"
  } as any,
  {
    id: 2012,
    name: "Writesonic Pro",
    description: "AI writing assistant for articles, ads, and marketing copy with SEO optimization",
    price: "1,299",
    originalPrice: "1,699",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200&q=60",
    affiliateUrl: "https://writesonic.com",
    affiliateNetworkId: null,
    affiliateNetworkName: null,
    category: "AI Apps",
    gender: null,
    rating: "4.3",
    reviewCount: 5432,
    discount: 24,
    isNew: false,
    isFeatured: true,
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null,
    createdAt: new Date(),
    pricingType: "Monthly Subscription"
  } as any
];

export default function AppsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Check if user is admin (you can implement your own logic)
  const isAdmin = false; // Set to true for admin users

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch AI Apps products from API
  const { data: aiAppsProducts = [], isLoading } = useQuery({
    queryKey: ['/api/products/apps'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/products/apps');
        if (!response.ok) {
          console.warn('API call failed, using fallback data');
          return [];
        }
        return response.json();
      } catch (error) {
        console.warn('API call error, using fallback data:', error);
        return [];
      }
    },
    select: (data) => data || [],
    retry: false,
    refetchOnWindowFocus: false
  });

  // Use API data if available, fallback to sample data
  const displayApps = aiAppsProducts.length > 0 ? aiAppsProducts : sampleAppsAIApps;

  // Get unique categories
  const categories: string[] = ['All', ...Array.from(new Set(displayApps.map((app: Product) => app.category).filter(Boolean)))];

  // Filter and sort apps
  const filteredAndSortedApps = displayApps
    .filter((app: Product) => selectedCategory === 'All' || app.category === selectedCategory)
    .sort((a: Product, b: Product) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(String(a.price).replace(/,/g, '')) - parseFloat(String(b.price).replace(/,/g, ''));
        case 'price-high':
          return parseFloat(String(b.price).replace(/,/g, '')) - parseFloat(String(a.price).replace(/,/g, ''));
        case 'rating':
          return parseFloat(b.rating) - parseFloat(a.rating);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'featured':
        default:
          return b.isFeatured ? 1 : -1;
      }
    });

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

  const StarRating = ({ rating }: { rating: string }) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 !== 0;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, index) => (
          <i
            key={index}
            className={`fas fa-star text-sm ${
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
        <Header />
        <div className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading apps...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6 relative">
                Apps & AI Apps
                <div className="absolute -top-2 -right-6 text-2xl animate-bounce">🤖</div>
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover cutting-edge applications and AI-powered tools to boost your productivity and creativity
            </p>
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:bg-gray-800/20 dark:border-gray-700/30">
            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredAndSortedApps.length} apps
              </div>
            </div>
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedApps.map((app: Product, index: number) => (
              <div 
                key={app.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
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
                <div className="p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white space-y-3 relative">
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
                        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
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

                    {/* Delete Button - Only for admin */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteApp(app.id)}
                        className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-110"
                        title="Delete app"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    )}
                  </div>

                  {/* App Name */}
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white pr-16 leading-tight">
                    {app.name}
                  </h4>
                  
                  {/* App Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {app.description}
                  </p>
                  
                  {/* Category Badge */}
                  <div className="flex items-center justify-between">
                    <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      {app.category}
                    </span>
                    {app.isNew && (
                      <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  
                  {/* Rating and Reviews */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StarRating rating={app.rating} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {app.rating} ({app.reviewCount.toLocaleString()})
                      </span>
                    </div>
                  </div>
                  
                  {/* Price and CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      {/* Enhanced pricing display for apps page */}
                       {app.isFree || (app.pricingType === 'free') ? (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                       ) : app.priceDescription && app.priceDescription.trim() !== '' ? (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">{app.priceDescription}</span>
                       ) : app.monthlyPrice && app.monthlyPrice !== '0' && app.monthlyPrice !== '0' ? (
                         <div className="flex items-center space-x-2">
                           <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.monthlyPrice || '0', app.currency)}/month</span>
                        {app.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">{formatPrice(app.originalPrice, app.currency)}/month</span>
                        )}
                      </div>
                    ) : app.yearlyPrice && app.yearlyPrice !== '0' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.yearlyPrice, app.currency)}/year</span>
                        {app.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">{formatPrice(app.originalPrice, app.currency)}/year</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {/* For regular price, check pricingType to determine suffix */}
                        {app.pricingType === 'monthly' || app.pricingType === 'Monthly Subscription' ? (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency)}/month</span>
                        ) : app.pricingType === 'yearly' || app.pricingType === 'Yearly Subscription' ? (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency)}/year</span>
                        ) : app.pricingType === 'one-time' || app.pricingType === 'One-time Payment' ? (
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">One-time payment</span>
                          </div>
                        ) : app.price && app.price !== '0' && String(app.price).trim() !== '' ? (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(app.price, app.currency)}</span>
                        ) : (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
                        )}
                        {app.originalPrice && app.pricingType !== 'One-time Payment' && (
                          <span className="text-gray-500 line-through text-sm">
                            {formatPrice(app.originalPrice, app.currency)}
                               {app.pricingType === 'Monthly Subscription' ? '/month' : app.pricingType === 'Yearly Subscription' ? '/year' : ''}
                             </span>
                           )}
                         </div>
                       )}
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

          {/* Empty State */}
          {filteredAndSortedApps.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No apps found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}