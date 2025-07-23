import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/category', category],
    queryFn: () => fetch(`/api/products/category/${category}`).then(res => res.json()),
  });

  const trackAffiliateMutation = useMutation({
    mutationFn: async (data: { productId: number; affiliateUrl: string }) => {
      return apiRequest('POST', '/api/affiliate/track', data);
    },
  });

  const handleAffiliateClick = (product: Product) => {
    trackAffiliateMutation.mutate({
      productId: product.id,
      affiliateUrl: product.affiliateUrl
    });
    
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

  const getCategoryInfo = (categoryName: string) => {
    const categoryMap: { [key: string]: { title: string; description: string; color: string; icon: string } } = {
      'Tech': {
        title: 'Tech & Gadgets',
        description: 'Latest technology and smart devices to enhance your life',
        color: 'from-bright-blue to-navy',
        icon: 'fas fa-laptop'
      },
      'Home': {
        title: 'Home & Living',
        description: 'Transform your space with smart home solutions and decor',
        color: 'from-accent-green to-green-600',
        icon: 'fas fa-home'
      },
      'Beauty': {
        title: 'Beauty & Skincare',
        description: 'Premium beauty products for your self-care routine',
        color: 'from-pink-500 to-purple-600',
        icon: 'fas fa-sparkles'
      },
      'Fashion': {
        title: 'Fashion & Style',
        description: 'Trendy clothing and accessories to express your style',
        color: 'from-purple-500 to-indigo-600',
        icon: 'fas fa-tshirt'
      },
      'Deals': {
        title: 'Special Deals',
        description: 'Limited time offers and exclusive discounts',
        color: 'from-accent-orange to-red-600',
        icon: 'fas fa-fire'
      }
    };
    
    return categoryMap[categoryName] || categoryMap['Tech'];
  };

  const categoryInfo = getCategoryInfo(category || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20">
          <section className={`py-16 bg-gradient-to-r ${categoryInfo.color} text-white`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full mx-auto mb-6"></div>
                <div className="h-8 bg-white bg-opacity-30 rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-white bg-opacity-30 rounded w-96 mx-auto"></div>
              </div>
            </div>
          </section>
          
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20">
        {/* Category Hero Section */}
        <section className={`py-16 bg-gradient-to-r ${categoryInfo.color} text-white`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className={`${categoryInfo.icon} text-3xl`}></i>
            </div>
            <h1 className="text-5xl font-bold mb-4">{categoryInfo.title}</h1>
            <p className="text-xl text-white text-opacity-90 max-w-2xl mx-auto">{categoryInfo.description}</p>
            <div className="mt-6">
              <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm">
                {products?.length || 0} Products Available
              </span>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {products && products.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 overflow-hidden"
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
                          <span className="text-gray-600 ml-2 text-sm">({product.reviewCount})</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-lg text-navy mb-2">{product.name}</h4>
                      <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-navy">₹{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-gray-400 line-through ml-2">₹{product.originalPrice}</span>
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
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        🔗 Affiliate Link - We earn from purchases
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-search text-4xl text-gray-400"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-4">No Products Found</h3>
                <p className="text-gray-500">We're working on adding more products to this category.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}