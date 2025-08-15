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

// Extended fallback products for the full page
const fallbackProducts = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    description: "Latest Apple iPhone with titanium design and advanced camera system",
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
    description: "Crystal UHD 4K Smart TV with HDR and built-in streaming apps",
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
    description: "Comfortable running shoes with Max Air cushioning technology",
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
    description: "Apple MacBook Air with M2 chip, 13.6-inch Liquid Retina display",
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
    description: "Industry-leading noise canceling wireless headphones",
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
    description: "Electric pressure cooker, slow cooker, rice cooker, and more",
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
  },
  {
    id: 7,
    name: "iPad Pro 12.9\"",
    description: "Apple iPad Pro with M2 chip and Liquid Retina XDR display",
    price: "112900",
    originalPrice: "129900",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80",
    affiliateUrl: "https://amazon.in/dp/B0BJLBKMV2",
    affiliateNetworkId: 1,
    affiliateNetworkName: "Amazon",
    category: "Electronics & Gadgets",
    gender: null,
    rating: "4.8",
    reviewCount: 934,
    discount: 13,
    isNew: true,
    isFeatured: true,
    hasTimer: true,
    timerDuration: 15,
    timerStartTime: new Date(),
    createdAt: new Date()
  },
  {
    id: 8,
    name: "Dyson V15 Detect",
    description: "Cordless vacuum cleaner with laser dust detection",
    price: "58900",
    originalPrice: "65900",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    affiliateUrl: "https://amazon.in/dp/B08WJR2NZ2",
    affiliateNetworkId: 1,
    affiliateNetworkName: "Amazon",
    category: "Home & Kitchen",
    gender: null,
    rating: "4.6",
    reviewCount: 567,
    discount: 11,
    isNew: false,
    isFeatured: true,
    hasTimer: true,
    timerDuration: 20,
    timerStartTime: new Date(),
    createdAt: new Date()
  }
];

export default function TopPicks() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
    enabled: false, // Use fallback data immediately
  });
  
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Always use fallback data for immediate display
  const displayProducts = fallbackProducts;

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

      {/* Products Grid */}
      <div className="bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProducts.map((product: Product, index: number) => (
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
                    <i className="fas fa-heart text-sm"></i>
                  </button>
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
