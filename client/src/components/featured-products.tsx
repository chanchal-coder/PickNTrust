import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
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
  rating: number;
  reviewCount: number;
  discount: number | null;
  isNew: boolean;
  isFeatured: boolean;
  hasTimer: boolean;
  timerDuration: number | null;
  timerStartTime: Date | null;
  createdAt: Date | null;
}

export default function FeaturedProducts() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Check admin status
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminSession === 'active');

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleShare = (platform: string, product: Product) => {
    const productUrl = `${window.location.origin}`;
    const productText = `Check out this amazing deal: ${product.name} - ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''} at PickNTrust!`;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(productText)}`;
        break;
      case 'twitter':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(productText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        // Try to open channel admin interface for posting
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'instagram':
        const instagramText = `🛍️ Amazing Deal Alert! ${product.name} - Only ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''}! 💰\n\n✨ Get the best deals at PickNTrust\n\n#PickNTrust #Deals #Shopping #BestPrice`;
        navigator.clipboard.writeText(instagramText + '\n\n' + productUrl);
        window.open('https://www.instagram.com/', '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(prev => ({...prev, [product.id]: false}));
  };

  const trackAffiliateMutation = useMutation({
    mutationFn: async (data: { productId: number; affiliateUrl: string }) => {
      return apiRequest('POST', '/api/affiliate/track', data);
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
    console.log('Wishlist toggle clicked for product:', product);
    if (isInWishlist(product.id)) {
      console.log('Product is in wishlist, removing:', product.id);
      removeFromWishlist(product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} removed from your wishlist`,
      });
    } else {
      console.log('Product not in wishlist, adding:', product);
      addToWishlist(product);
      toast({
        title: "Added to wishlist",
        description: `${product.name} added to your wishlist`,
      });
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <i 
            key={i}
            className={`${
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

  if (isLoading) {
    return (
      <section id="featured-products" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-navy dark:text-blue-400 mb-4">Today's Top Picks</h3>
            <p className="text-xl text-gray-600 dark:text-gray-300">Hand-selected deals you can trust</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden animate-pulse">
                <div className={`w-full h-48 ${
                  i === 0 ? 'bg-gradient-to-br from-purple-200 to-pink-300 dark:from-purple-700 dark:to-pink-800' :
                  i === 1 ? 'bg-gradient-to-br from-orange-200 to-red-300 dark:from-orange-700 dark:to-red-800' :
                  'bg-gradient-to-br from-blue-200 to-cyan-300 dark:from-blue-700 dark:to-cyan-800'
                }`}></div>
                <div className="p-6">
                  <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-700 dark:to-pink-700 rounded mb-2"></div>
                  <div className="h-6 bg-gradient-to-r from-orange-200 to-red-200 dark:from-orange-700 dark:to-red-700 rounded mb-2"></div>
                  <div className="h-4 bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-700 dark:to-cyan-700 rounded mb-4"></div>
                  <div className="h-12 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-700 dark:to-purple-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {products?.map((product, index) => (
            <div 
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-102 sm:hover:scale-105 overflow-hidden"
            >
              <div className={`relative p-1.5 sm:p-2 dark:bg-gradient-to-br dark:from-purple-900 dark:via-pink-900 dark:to-orange-900 ${
                index % 3 === 0 ? 'bg-blue-400' : 
                index % 3 === 1 ? 'bg-green-400' : 
                'bg-yellow-400'
              }`}>
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-40 sm:h-48 object-cover rounded-xl sm:rounded-2xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg" 
                />
                
                {/* Wishlist Heart Icon - Mobile Optimized */}
                <button
                  onClick={() => handleWishlistToggle(product)}
                  className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 p-1.5 sm:p-2 rounded-full shadow-md transition-colors touch-manipulation ${
                    isInWishlist(product.id) 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-white text-gray-400 hover:text-red-500'
                  }`}
                  title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <i className={`fas fa-heart text-xs sm:text-sm`}></i>
                </button>

                {isAdmin && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [product.id]: !prev[product.id]}))}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 sm:p-2 shadow-md touch-manipulation"
                      >
                        <i className="fas fa-share text-blue-600 text-xs sm:text-sm"></i>
                      </button>
                      
                      {showShareMenu[product.id] && (
                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-10 min-w-[140px]">
                      <button
                        onClick={() => handleShare('facebook', product)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left"
                      >
                        <i className="fab fa-facebook text-blue-600"></i>
                        Facebook
                      </button>
                      <button
                        onClick={() => handleShare('twitter', product)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded w-full text-left"
                      >
                        <div className="w-4 h-4 bg-black dark:bg-white rounded-sm flex items-center justify-center">
                          <span className="text-white dark:text-black text-xs font-bold">𝕏</span>
                        </div>
                        X (Twitter)
                      </button>
                      <button
                        onClick={() => handleShare('telegram', product)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded w-full text-left"
                      >
                        <i className="fab fa-telegram text-blue-500"></i>
                        Telegram
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp', product)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 rounded w-full text-left"
                      >
                        <i className="fab fa-whatsapp text-green-600"></i>
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleShare('youtube', product)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded w-full text-left"
                      >
                        <i className="fab fa-youtube text-red-600"></i>
                        YouTube
                      </button>
                      <button
                        onClick={() => handleShare('instagram', product)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded w-full text-left"
                      >
                        <i className="fab fa-instagram text-purple-600"></i>
                        Instagram
                      </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className={`p-4 sm:p-6 ${
                index % 3 === 0 ? 'bg-blue-50 dark:bg-gray-800' : 
                index % 3 === 1 ? 'bg-green-50 dark:bg-gray-800' : 
                'bg-yellow-50 dark:bg-gray-800'
              }`}>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  {product.discount ? (
                    <span className="bg-accent-orange text-white px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-bold">
                      {product.discount}% OFF
                    </span>
                  ) : product.isNew ? (
                    <span className="bg-pink-500 text-white px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-bold">
                      NEW
                    </span>
                  ) : (
                    <div></div>
                  )}
                  <div className="flex items-center">
                    <div className="flex items-center text-yellow-400 text-sm sm:text-base">
                      {[...Array(5)].map((_, i) => (
                        <i 
                          key={i}
                          className={`${
                            i < Math.floor(product.rating) 
                              ? 'fas fa-star' 
                              : i === Math.floor(product.rating) && product.rating % 1 !== 0
                                ? 'fas fa-star-half-alt' 
                                : 'far fa-star'
                          } text-xs sm:text-sm`}
                        ></i>
                      ))}
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 ml-1 sm:ml-2 text-xs sm:text-sm">({product.reviewCount})</span>
                  </div>
                </div>
                <h4 className="font-bold text-base sm:text-lg text-navy dark:text-blue-400 mb-2 line-clamp-2">{product.name}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div>
                    <span className="text-xl sm:text-2xl font-bold text-navy dark:text-blue-400">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-gray-400 dark:text-gray-500 line-through ml-1 sm:ml-2 text-sm sm:text-base">₹{product.originalPrice}</span>
                    )}
                  </div>
                </div>
                {/* Individual Product Timer */}
                <div className="mb-3 sm:mb-4">
                  <ProductTimer product={product} />
                </div>
                <button 
                  onClick={() => handleAffiliateClick(product)}
                  className={`w-full text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:shadow-lg transition-all transform hover:scale-102 sm:hover:scale-105 text-sm sm:text-base touch-manipulation ${
                    product.category === 'Tech' 
                      ? 'bg-gradient-to-r from-bright-blue to-navy'
                      : product.category === 'Home'
                        ? 'bg-gradient-to-r from-accent-green to-green-600'
                        : product.category === 'Beauty'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                          : product.category === 'Fashion'
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                            : 'bg-gradient-to-r from-accent-orange to-red-600'
                  }`}
                >
                  <i className="fas fa-shopping-bag mr-1 sm:mr-2"></i>Pick Now
                </button>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2 text-center">
                  🔗 Affiliate Link - We earn from purchases
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
