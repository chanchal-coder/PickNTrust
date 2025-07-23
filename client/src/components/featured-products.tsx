import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export default function FeaturedProducts() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
  });

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
          <h3 className="text-4xl font-bold text-navy dark:text-blue-400 mb-4">Today's Top Picks</h3>
          <p className="text-xl text-gray-600 dark:text-gray-300">Hand-selected deals you can trust</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products?.map((product) => (
            <div 
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 overflow-hidden"
            >
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-48 object-cover" 
              />
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
