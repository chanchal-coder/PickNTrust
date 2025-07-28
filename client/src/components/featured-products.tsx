import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";

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
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(productText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(productText + ' ' + productUrl)}`;
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

  const renderStars = (rating: string) => {
    const ratingNum = parseFloat(rating);
    const fullStars = Math.floor(ratingNum);
    const hasHalfStar = ratingNum % 1 !== 0;
    
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
            <h3 className="text-4xl font-bold text-navy dark:text-blue-400 mb-4">Today's Top Picks</h3>
            <p className="text-xl text-gray-600 dark:text-gray-300">Hand-selected deals you can trust</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured-products" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h3 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4 relative">
              Today's Top Picks
              <div className="absolute -top-2 -right-8 text-3xl animate-bounce">🔥</div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
            </h3>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mt-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">✨ Hand-selected deals you can trust ✨</span>
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products?.map((product) => (
            <div 
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 overflow-hidden"
            >
              <div className="relative">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-48 object-cover" 
                />
                
                {/* Wishlist Heart Icon */}
                <button
                  onClick={() => handleWishlistToggle(product)}
                  className={`absolute top-2 left-2 p-2 rounded-full shadow-md transition-colors ${
                    isInWishlist(product.id) 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-white text-gray-400 hover:text-red-500'
                  }`}
                  title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <i className={`fas fa-heart text-sm`}></i>
                </button>

                {isAdmin && (
                  <div className="absolute top-2 right-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [product.id]: !prev[product.id]}))}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-md"
                      >
                        <i className="fas fa-share text-blue-600"></i>
                      </button>
                      
                      {showShareMenu[product.id] && (
                        <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-10 min-w-[140px]">
                          <button
                            onClick={() => handleShare('facebook', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left"
                          >
                            <i className="fab fa-facebook text-blue-600"></i>
                            Facebook
                          </button>
                          <button
                            onClick={() => handleShare('twitter', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left"
                          >
                            <i className="fab fa-twitter text-blue-400"></i>
                            Twitter
                          </button>
                          <button
                            onClick={() => handleShare('whatsapp', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 rounded w-full text-left"
                          >
                            <i className="fab fa-whatsapp text-green-600"></i>
                            WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare('instagram', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 rounded w-full text-left"
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
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  {product.discount ? (
                    <span className="bg-accent-orange text-white px-3 py-1 rounded-full text-sm font-bold">
                      {product.discount}% OFF
                    </span>
                  ) : product.isNew ? (
                    <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      NEW
                    </span>
                  ) : (
                    <div></div>
                  )}
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                    <span className="text-gray-600 dark:text-gray-300 ml-2 text-sm">({product.reviewCount})</span>
                  </div>
                </div>
                <h4 className="font-bold text-lg text-navy dark:text-blue-400 mb-2">{product.name}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{product.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-navy dark:text-blue-400">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-gray-400 dark:text-gray-500 line-through ml-2">₹{product.originalPrice}</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleAffiliateClick(product)}
                  className={`w-full text-white font-bold py-3 px-6 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 ${
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
                  <i className="fas fa-shopping-bag mr-2"></i>Pick Now
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
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
