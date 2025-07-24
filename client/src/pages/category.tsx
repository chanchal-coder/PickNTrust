import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useToast } from '@/hooks/use-toast';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/category', category],
    queryFn: () => fetch(`/api/products/category/${category}`).then(res => res.json()),
  });

  // Check admin authentication from main admin panel login
  useEffect(() => {
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    if (adminAuth === 'active') {
      setIsAdmin(true);
    }
  }, []);

  // Listen for admin session changes (when user logs in/out of main admin panel)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        if (e.newValue === 'active') {
          setIsAdmin(true);
          toast({
            title: 'Admin Mode Active',
            description: 'You have admin controls in all categories.',
          });
        } else {
          setIsAdmin(false);
          toast({
            title: 'Admin Session Ended',
            description: 'Admin controls have been disabled.',
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [toast]);

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

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Product Deleted!',
        description: 'Product has been removed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/category', category] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    },
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
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm">
                {products?.length || 0} Products Available
              </span>
              {/* Admin indicator and quick add button */}
              {isAdmin && (
                <>
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                    ADMIN MODE
                  </span>
                  <button
                    onClick={() => window.open('/admin', '_blank')}
                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-blue-600 transition-colors"
                  >
                    + Add Product
                  </button>
                </>
              )}
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
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:transform hover:scale-105 overflow-hidden"
                  >
                    <div className="relative">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-48 object-cover" 
                      />
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-2">
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
                          
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 text-white rounded-full p-2 shadow-md"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
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