import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductTimer } from "@/components/product-timer";
import Header from "@/components/header";
import Footer from "@/components/footer";

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

export default function TopPicks() {
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  
  // Fetch products from API
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
    queryFn: async () => {
      const response = await fetch('/api/products/featured');
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
  
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleAffiliateClick = (product: Product) => {
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

  const handleShare = (platform: string, product: Product) => {
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    const shareText = `Check out this amazing deal: ${product.name} - Only ₹${product.price}! ${product.discount ? `${product.discount}% OFF!` : ''} - PickNTrust`;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'instagram':
        // Copy to clipboard for Instagram
        navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        toast({
          title: "Copied to clipboard!",
          description: "Share text copied. You can now paste it on Instagram.",
        });
        return;
      case 'youtube':
        url = `https://www.youtube.com/results?search_query=${encodeURIComponent(product.name)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'pinterest':
        url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}&media=${encodeURIComponent(product.imageUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
    
    // Close share menu
    setShowShareMenu(prev => ({...prev, [product.id]: false}));
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast({
        title: "Product deleted",
        description: "Product has been successfully deleted",
      });

      // Refresh the page to show updated products
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
                Today's Top Picks 🔥
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6">
                Loading amazing deals...
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden max-w-md mx-auto animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !products || products.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
                Today's Top Picks 🔥
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6">
                Hand-selected deals you can trust - Updated daily
              </p>
              <Link 
                href="/"
                className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="mb-8">
                <i className="fas fa-box-open text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
                <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                  No Featured Products Yet
                </h2>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  Our team is working hard to curate the best deals for you. Check back soon!
                </p>
                <Link 
                  href="/admin"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Products (Admin)
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Main Header */}
      <Header />
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
              Today's Top Picks 🔥
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6">
              Hand-selected deals you can trust - Updated daily
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/"
                className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Home
              </Link>
              <span className="inline-flex items-center px-4 py-2 bg-white/20 text-white rounded-full text-sm">
                <i className="fas fa-fire mr-2"></i>
                {products.length} Hot Deals Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product: Product, index: number) => (
              <div 
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 overflow-hidden max-w-md mx-auto"
              >
                <div className={`relative p-2 dark:bg-gradient-to-br dark:from-purple-900 dark:via-pink-900 dark:to-orange-900 ${
                  index % 4 === 0 ? 'bg-blue-400' : 
                  index % 4 === 1 ? 'bg-green-400' : 
                  index % 4 === 2 ? 'bg-yellow-400' :
                  'bg-purple-400'
                }`}>
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-48 object-cover rounded-xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://picsum.photos/400/300?random=${product.id}`;
                    }}
                  />
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {/* Wishlist Heart Icon */}
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        isInWishlist(product.id) 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-white text-gray-400 hover:text-red-500'
                      }`}
                      title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <i className="fas fa-heart text-sm"></i>
                    </button>

                    {/* Share Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [product.id]: !prev[product.id]}))}
                        className="p-2 bg-white text-gray-600 hover:text-blue-600 rounded-full shadow-md transition-colors"
                        title="Share product"
                      >
                        <i className="fas fa-share text-sm"></i>
                      </button>
                      
                      {/* Share Menu */}
                      {showShareMenu[product.id] && (
                        <div className="absolute left-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
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
                          <button
                            onClick={() => handleShare('youtube', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-youtube text-red-600"></i>
                            YouTube
                          </button>
                          <button
                            onClick={() => handleShare('telegram', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-telegram text-blue-500"></i>
                            Telegram
                          </button>
                          <button
                            onClick={() => handleShare('pinterest', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-pinterest text-red-600"></i>
                            Pinterest
                          </button>
                          <button
                            onClick={() => handleShare('linkedin', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-linkedin text-blue-700"></i>
                            LinkedIn
                          </button>
                          <button
                            onClick={() => handleShare('reddit', product)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-orange-50 rounded w-full text-left text-gray-700"
                          >
                            <i className="fab fa-reddit text-orange-600"></i>
                            Reddit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-white text-gray-600 hover:text-red-600 rounded-full shadow-md transition-colors"
                      title="Delete product"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    {product.discount ? (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
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
                  
                  <h4 className="font-bold text-lg text-navy dark:text-blue-400 mb-2 line-clamp-2">{product.name}</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-navy dark:text-blue-400">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-gray-400 dark:text-gray-500 line-through ml-2 text-base">₹{product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Product Timer */}
                  <div className="mb-4">
                    <ProductTimer product={product} />
                  </div>
                  
                  <button 
                    onClick={() => handleAffiliateClick(product)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
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
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
