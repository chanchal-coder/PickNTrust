import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductTimer } from "@/components/product-timer";

// Define Product type locally to avoid schema conflicts
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
  hasTimer: boolean;
  timerDuration: number | null;
  timerStartTime: Date | null;
  createdAt: Date | null;
}

// Fallback sample products data (shown only if API returns empty)
const fallbackProducts = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    description: "Latest Apple iPhone with titanium design",
    price: "134900",
    originalPrice: "159900",
    imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80",
    affiliateUrl: "https://amazon.in/dp/B0CHX1W1XY",
    affiliateNetworkId: 1,
    affiliateNetworkName: "Amazon",
    category: "Electronics & Gadgets",
    gender: null,
    rating: "4.8",
    reviewCount: 2847,
    discount: 16,
    isNew: true,
    isFeatured: true,
    hasTimer: true,
    timerDuration: 24,
    timerStartTime: new Date(),
    createdAt: new Date()
  },
  {
    id: 2,
    name: "Samsung 55\" 4K Smart TV",
    description: "Crystal UHD 4K Smart TV with HDR",
    price: "42990",
    originalPrice: "54990",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80",
    affiliateUrl: "https://amazon.in/dp/B08YKYDCWX",
    affiliateNetworkId: 1,
    affiliateNetworkName: "Amazon",
    category: "Electronics & Gadgets",
    gender: null,
    rating: "4.5",
    reviewCount: 1523,
    discount: 22,
    isNew: false,
    isFeatured: true,
    hasTimer: true,
    timerDuration: 12,
    timerStartTime: new Date(),
    createdAt: new Date()
  },
  {
    id: 3,
    name: "Nike Air Max 270",
    description: "Comfortable running shoes",
    price: "8995",
    originalPrice: "12995",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    affiliateUrl: "https://amazon.in/dp/B07XQXZXJG",
    affiliateNetworkId: 1,
    affiliateNetworkName: "Amazon",
    category: "Fashion & Clothing",
    gender: "unisex",
    rating: "4.6",
    reviewCount: 892,
    discount: 31,
    isNew: false,
    isFeatured: true,
    hasTimer: true,
    timerDuration: 6,
    timerStartTime: new Date(),
    createdAt: new Date()
  },
  {
    id: 4,
    name: "MacBook Air M2",
    description: "Apple MacBook Air with M2 chip",
    price: "114900",
    originalPrice: "119900",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
    affiliateUrl: "https://amazon.in/dp/B0B3C2R8MP",
    affiliateNetworkId: 1,
    affiliateNetworkName: "Amazon",
    category: "Electronics & Gadgets",
    gender: null,
    rating: "4.9",
    reviewCount: 1247,
    discount: 4,
    isNew: true,
    isFeatured: true,
    hasTimer: true,
    timerDuration: 18,
    timerStartTime: new Date(),
    createdAt: new Date()
  },
  {
    id: 5,
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise canceling",
    price: "24990",
    originalPrice: "29990",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    affiliateUrl: "https://amazon.in/dp/B09XS7JWHH",
    affiliateNetworkId: 1,
    affiliateNetworkName: "Amazon",
    category: "Electronics & Gadgets",
    gender: null,
    rating: "4.7",
    reviewCount: 756,
    discount: 17,
    isNew: false,
    isFeatured: true,
    hasTimer: true,
    timerDuration: 8,
    timerStartTime: new Date(),
    createdAt: new Date()
  },
  {
    id: 6,
    name: "Instant Pot Duo 7-in-1",
    description: "Electric pressure cooker",
    price: "7999",
    originalPrice: "12999",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
    affiliateUrl: "https://amazon.in/dp/B00FLYWNYQ",
    affiliateNetworkId: 1,
    affiliateNetworkName: "Amazon",
    category: "Home & Kitchen",
    gender: null,
    rating: "4.4",
    reviewCount: 2156,
    discount: 38,
    isNew: false,
    isFeatured: true,
    hasTimer: true,
    timerDuration: 4,
    timerStartTime: new Date(),
    createdAt: new Date()
  }
];

export default function FeaturedProducts() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      // Filter only featured products
      return (data.products || []).filter((product: Product) => product.isFeatured);
    },
    retry: 1
  });
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const queryClient = useQueryClient();

  // Admin state management
  const [isAdmin, setIsAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    if (adminAuth === 'active') {
      setIsAdmin(true);
    }
  }, []);

  // Listen for admin session changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Use API data if available, otherwise use fallback data (only featured ones)
  const displayProducts = products && products.length > 0 
    ? products 
    : fallbackProducts.filter(product => product.isFeatured);

  const trackAffiliateMutation = useMutation({
    mutationFn: async (data: { productId: number; affiliateUrl: string }) => {
      const response = await fetch('/api/affiliate/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to track affiliate click');
      }
      return response.json();
    },
  });

  const handleAffiliateClick = (product: Product) => {
    // Track the click
    trackAffiliateMutation.mutate({
      productId: product.id,
      affiliateUrl: product.affiliateUrl
    });
    
    // Open affiliate link in new tab
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWishlistToggle = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} removed from your wishlist`,
      });
    } else {
      addToWishlist(product);
      toast({
        title: "Added to wishlist",
        description: `${product.name} added to your wishlist`,
      });
    }
  };

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Success',
        description: 'Product deleted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  });

  const handleDelete = (productId: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleShare = (platform: string, product: Product) => {
    const productUrl = `${window.location.origin}`;
    const productText = `Check out this amazing deal: ${product.name} - ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/profile.php?id=61578969445670`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/+m-O-S6SSpVU2NWU1`;
        break;
      case 'twitter':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(productText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'instagram':
        const instagramText = `🛍️ Amazing Deal Alert! ${product.name} - Only ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''}! 💰\n\n✨ Get the best deals at PickNTrust\n\n#PickNTrust #Deals #Shopping #BestPrice`;
        navigator.clipboard.writeText(instagramText + '\n\n' + productUrl);
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        return;
      case 'pinterest':
        shareUrl = `https://www.pinterest.com/PickNTrust/`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(prev => ({...prev, [product.id]: false}));
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

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  // Handle mouse wheel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    }
  };

  return (
    <section id="featured-products" className="py-8 sm:py-12 lg:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4 relative">
              Today's Top Picks
              <div className="absolute -top-1 -right-4 sm:-top-2 sm:-right-6 text-lg sm:text-xl animate-bounce">🔥</div>
            </h3>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium mt-4 sm:mt-6 px-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">✨ Hand-selected deals you can trust ✨</span>
          </p>
        </div>
        
        {/* Horizontal Scrollable Container with Border */}
        <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-white/50 dark:bg-gray-800/50">
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl rounded-full p-3 transition-all transform hover:scale-110 hidden md:block"
          >
            <i className="fas fa-chevron-left text-lg"></i>
          </button>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl rounded-full p-3 transition-all transform hover:scale-110 hidden md:block"
          >
            <i className="fas fa-chevron-right text-lg"></i>
          </button>

          {/* Desktop: Scrollable Products Container - Single Row */}
          <div 
            ref={scrollContainerRef}
            onWheel={handleWheel}
            className="hidden md:flex gap-4 overflow-x-auto pb-6 px-12 md:px-16"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
            {displayProducts.map((product: Product, index: number) => (
              <div 
                key={product.id}
                className="flex-shrink-0 w-[320px] bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Product Image with colored border */}
                <div className={`relative p-3 ${
                  index % 5 === 0 ? 'bg-blue-500' : 
                  index % 5 === 1 ? 'bg-green-500' : 
                  index % 5 === 2 ? 'bg-red-500' :
                  index % 5 === 3 ? 'bg-purple-500' :
                  'bg-yellow-500'
                }`}>
                  <div className="w-full h-32 bg-gray-800 rounded-lg overflow-hidden">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  {/* Wishlist Heart Icon */}
                  <button
                    onClick={() => handleWishlistToggle(product)}
                    className={`absolute top-5 left-5 p-1.5 rounded-full shadow-md transition-colors ${
                      isInWishlist(product.id) 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-white text-gray-400 hover:text-red-500'
                    }`}
                    title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <i className="fas fa-heart text-xs"></i>
                  </button>
                </div>
                
                {/* Product Content */}
                <div className="p-4 bg-gray-800 text-white space-y-2 relative">
                  {/* Share and Delete Buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-2">
                    {/* Share Button - Always visible */}
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [product.id]: !prev[product.id]}))}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors"
                        title="Share product"
                      >
                        <i className="fas fa-share text-xs"></i>
                      </button>
                      
                      {/* Share Menu - Fixed positioning to prevent cutoff */}
                      {showShareMenu[product.id] && (
                        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
                          <button
                            onClick={() => handleShare('facebook', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-facebook text-blue-600"></i>
                            Facebook
                          </button>
                          <button
                            onClick={() => handleShare('twitter', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded w-full text-left text-gray-700"
                          >
                            <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                              <span className="text-white text-xs font-bold">𝕏</span>
                            </div>
                            X (Twitter)
                          </button>
                          <button
                            onClick={() => handleShare('whatsapp', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-whatsapp text-green-600"></i>
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare('instagram', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-instagram text-purple-600"></i>
                            Instagram
                          </button>
                          {/* Telegram - Only for admin */}
                          {isAdmin && (
                            <button
                              onClick={() => handleShare('telegram', product)}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                            >
                              <i className="fab fa-telegram text-blue-500"></i>
                              Telegram
                            </button>
                          )}
                          {/* Pinterest - Only for admin */}
                          {isAdmin && (
                            <button
                              onClick={() => handleShare('pinterest', product)}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 rounded w-full text-left text-gray-700"
                            >
                              <i className="fab fa-pinterest text-red-600"></i>
                              Pinterest
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Delete Button - Only for admin */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md transition-colors"
                        title="Delete product"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    )}
                  </div>

                  {/* Discount Badge */}
                  {product.discount && (
                    <div className="flex justify-start">
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {product.discount}% OFF
                      </span>
                    </div>
                  )}
                  
                  {/* Rating */}
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                    <span className="text-gray-300 ml-1 text-xs">({product.reviewCount})</span>
                  </div>
                  
                  {/* Product Name */}
                  <h4 className="font-bold text-sm text-blue-400 leading-tight pr-16">{product.name}</h4>
                  
                  {/* Product Description */}
                  <p className="text-gray-300 text-xs leading-relaxed">{product.description}</p>
                  
                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-blue-400">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-gray-500 line-through text-sm">₹{product.originalPrice}</span>
                    )}
                  </div>
                  
                  {/* Timer */}
                  <div className="py-1">
                    <ProductTimer product={product} />
                  </div>
                  
                  {/* Pick Now Button */}
                  <button 
                    onClick={() => handleAffiliateClick(product)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-300 text-sm"
                  >
                    <i className="fas fa-shopping-bag mr-2"></i>Pick Now
                  </button>
                  
                  {/* Affiliate Link Text */}
                  <p className="text-[10px] text-gray-400 text-center mt-1">
                    🔗 Affiliate Link - We earn from purchases
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: Vertical Grid Layout */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {displayProducts.slice(0, 6).map((product: Product, index: number) => (
              <div 
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
              >
                <div className="flex">
                  {/* Product Image */}
                  <div className="w-24 h-24 flex-shrink-0 relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover rounded-l-xl" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400';
                      }}
                    />
                    {/* Discount Badge */}
                    {product.discount && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                        -{product.discount}%
                      </div>
                    )}
                  </div>

                  {/* Product Content */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      {/* Product Name */}
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">
                        {product.name}
                      </h4>
                      
                      {/* Price */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">₹{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-gray-500 line-through text-sm">₹{product.originalPrice}</span>
                        )}
                      </div>

                      {/* Timer Message (if hasTimer) */}
                      {product.hasTimer && product.timerDuration && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2 mb-2">
                          <p className="text-red-600 dark:text-red-400 text-xs font-medium">
                            ⏰ Limited Time: {product.timerDuration}h left!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Pick Now Button */}
                    <button 
                      onClick={() => handleAffiliateClick(product)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 text-xs"
                    >
                      Pick Now
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col justify-start items-center p-2 space-y-2">
                    {/* Wishlist Button */}
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className={`p-1.5 rounded-full shadow-sm transition-colors ${
                        isInWishlist(product.id) 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500'
                      }`}
                      title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <i className="fas fa-heart text-xs"></i>
                    </button>

                    {/* Share Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [product.id]: !prev[product.id]}))}
                        className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full shadow-sm transition-colors"
                        title="Share product"
                      >
                        <i className="fas fa-share text-xs"></i>
                      </button>
                      
                      {/* Share Menu */}
                      {showShareMenu[product.id] && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-1 z-50 min-w-[140px]">
                          <button
                            onClick={() => handleShare('facebook', product)}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                          >
                            <i className="fab fa-facebook text-blue-600"></i>
                            Facebook
                          </button>
                          <button
                            onClick={() => handleShare('whatsapp', product)}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-green-50 dark:hover:bg-green-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
                          >
                            <i className="fab fa-whatsapp text-green-600"></i>
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare('instagram', product)}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded w-full text-left text-gray-700 dark:text-gray-300"
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
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors"
                        title="Delete product"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* More Button */}
        <div className="flex justify-end mt-6">
          <Link 
            href="/top-picks"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="mr-2">More</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
