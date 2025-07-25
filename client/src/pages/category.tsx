import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [productUrl, setProductUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Clear any previous state when category changes
  useEffect(() => {
    setShowShareMenu({});
  }, [category]);
  
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/category', category],
    queryFn: async () => {
      if (!category) throw new Error('No category specified');
      const response = await fetch(`/api/products/category/${encodeURIComponent(category)}`);
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
      return response.json();
    },
    enabled: !!category,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all categories for navigation
  const { data: allCategories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
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

  // Delete product mutation with secure admin authentication
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'pickntrust2025' }),
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
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
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

  // Product extraction functionality
  const extractProductDetails = async () => {
    if (!productUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a product URL to extract details.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      const extractResponse = await fetch('/api/products/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: productUrl }),
      });

      const extractResult = await extractResponse.json();

      if (extractResult.success && extractResult.data) {
        const data = extractResult.data;
        setExtractedProduct({
          ...data,
          affiliateUrl: productUrl,
        });
        setShowPreview(true);
        setIsEditingPreview(false);
        
        toast({
          title: 'Product Details Extracted!',
          description: 'Review the details below and click "Add Product" to confirm.',
        });
      } else {
        toast({
          title: 'Extraction Failed',
          description: extractResult.message || 'Could not extract product details from this URL.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Extraction Error',
        description: 'Failed to extract product details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Add extracted product
  const addExtractedProduct = async () => {
    if (!extractedProduct) return;

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...extractedProduct,
          password: 'pickntrust2025',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add product');
      }

      toast({
        title: 'Product Added!',
        description: 'Product has been added to the catalog successfully.',
      });

      // Reset all states
      setShowAddModal(false);
      setShowPreview(false);
      setProductUrl('');
      setExtractedProduct(null);
      setIsEditingPreview(false);
      
      // Refresh category products and featured products
      queryClient.invalidateQueries({ queryKey: ['/api/products/category', category] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive',
      });
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
    const decodedCategory = decodeURIComponent(categoryName);
    const categoryMap: { [key: string]: { title: string; description: string; color: string; icon: string } } = {
      'Electronics & Gadgets': {
        title: 'Electronics & Gadgets',
        description: 'Latest technology and smart devices to enhance your life',
        color: 'from-bright-blue to-navy',
        icon: 'fas fa-laptop'
      },
      'Home & Living': {
        title: 'Home & Living',
        description: 'Transform your space with smart home solutions and decor',
        color: 'from-accent-green to-green-600',
        icon: 'fas fa-home'
      },
      'Beauty & Personal Care': {
        title: 'Beauty & Personal Care',
        description: 'Premium beauty products for your self-care routine',
        color: 'from-pink-500 to-purple-600',
        icon: 'fas fa-sparkles'
      },
      'Fashion & Clothing': {
        title: 'Fashion & Clothing',
        description: 'Trendy clothing and accessories to express your style',
        color: 'from-purple-500 to-indigo-600',
        icon: 'fas fa-tshirt'
      },
      'Special Deals': {
        title: 'Special Deals',
        description: 'Limited time offers and exclusive discounts',
        color: 'from-accent-orange to-red-600',
        icon: 'fas fa-fire'
      }
    };
    
    // Return the matching category or a default based on the first word
    return categoryMap[decodedCategory] || {
      title: decodedCategory,
      description: `Discover amazing products in ${decodedCategory}`,
      color: 'from-bright-blue to-navy',
      icon: 'fas fa-tags'
    };
  };

  const categoryInfo = getCategoryInfo(category || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="header-spacing">
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
        </div>
        <Footer />
      </div>
    );
  }

  // Handle errors
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="header-spacing pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Category</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">There was an issue loading this category. Please try again.</p>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh Page
              </button>
              <Link href="/" className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors">
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle category not found or empty
  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="header-spacing pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Category Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">The requested category could not be found.</p>
            <Link href="/" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
              Return to Homepage
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="header-spacing">
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
                  <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogTrigger asChild>
                      <button className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-blue-600 transition-colors">
                        + Add Product
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl text-navy dark:text-blue-400">Add Product to {categoryInfo.title}</DialogTitle>
                        <DialogDescription>
                          Add a new product by extracting details from a URL or entering manually
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* URL Extraction Section */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg text-bright-blue">🔗 Auto-Extract from URL</CardTitle>
                            <CardDescription>Paste a product URL to automatically extract details</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="product-url">Product URL</Label>
                              <Input
                                id="product-url"
                                type="url"
                                value={productUrl}
                                onChange={(e) => setProductUrl(e.target.value)}
                                placeholder="https://www.amazon.in/product-link or https://www.flipkart.com/product-link"
                                className="text-base"
                              />
                            </div>
                            <Button 
                              onClick={extractProductDetails}
                              disabled={isExtracting || !productUrl.trim()}
                              className="bg-bright-blue hover:bg-navy text-white"
                            >
                              {isExtracting ? 'Extracting...' : 'Extract Product Details'}
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Extracted Product Preview */}
                        {showPreview && extractedProduct && (
                          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                            <CardHeader>
                              <CardTitle className="text-green-800 dark:text-green-300">✅ Product Details Extracted</CardTitle>
                              <CardDescription>Review and edit details before adding to catalog</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {isEditingPreview ? (
                                <div className="space-y-4">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Product Name</Label>
                                      <Input
                                        value={extractedProduct.name}
                                        onChange={(e) => setExtractedProduct({...extractedProduct, name: e.target.value})}
                                      />
                                    </div>
                                    <div>
                                      <Label>Price (₹)</Label>
                                      <Input
                                        value={extractedProduct.price}
                                        onChange={(e) => setExtractedProduct({...extractedProduct, price: e.target.value})}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Description</Label>
                                    <Textarea
                                      value={extractedProduct.description}
                                      onChange={(e) => setExtractedProduct({...extractedProduct, description: e.target.value})}
                                      rows={3}
                                    />
                                  </div>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Original Price (₹)</Label>
                                      <Input
                                        value={extractedProduct.originalPrice || ''}
                                        onChange={(e) => setExtractedProduct({...extractedProduct, originalPrice: e.target.value})}
                                      />
                                    </div>
                                    <div>
                                      <Label>Category</Label>
                                      <Input
                                        value={extractedProduct.category}
                                        onChange={(e) => setExtractedProduct({...extractedProduct, category: e.target.value})}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <Label>Rating</Label>
                                      <Input
                                        value={extractedProduct.rating}
                                        onChange={(e) => setExtractedProduct({...extractedProduct, rating: e.target.value})}
                                      />
                                    </div>
                                    <div>
                                      <Label>Review Count</Label>
                                      <Input
                                        value={extractedProduct.reviewCount}
                                        onChange={(e) => setExtractedProduct({...extractedProduct, reviewCount: e.target.value})}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Image URL</Label>
                                    <Input
                                      value={extractedProduct.imageUrl}
                                      onChange={(e) => setExtractedProduct({...extractedProduct, imageUrl: e.target.value})}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold text-navy dark:text-blue-400">Product Name</h4>
                                      <p className="text-sm">{extractedProduct.name}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-navy dark:text-blue-400">Description</h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">{extractedProduct.description}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-semibold text-navy dark:text-blue-400">Price</h4>
                                        <p className="text-lg font-bold text-green-600">₹{extractedProduct.price}</p>
                                      </div>
                                      {extractedProduct.originalPrice && (
                                        <div>
                                          <h4 className="font-semibold text-navy dark:text-blue-400">Original Price</h4>
                                          <p className="text-sm line-through text-gray-500">₹{extractedProduct.originalPrice}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold text-navy dark:text-blue-400">Product Image</h4>
                                      <img 
                                        src={extractedProduct.imageUrl} 
                                        alt={extractedProduct.name}
                                        className="w-full h-48 object-cover rounded-lg border"
                                        onError={(e) => {
                                          e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400';
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-navy dark:text-blue-400">Category</h4>
                                      <p className="text-sm">{extractedProduct.category}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex gap-3 mt-6 pt-4 border-t">
                                <Button
                                  onClick={addExtractedProduct}
                                  className="bg-accent-green hover:bg-green-600 text-white"
                                >
                                  ✓ Add Product to Catalog
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsEditingPreview(!isEditingPreview)}
                                >
                                  {isEditingPreview ? 'Preview' : 'Edit Details'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowPreview(false);
                                    setExtractedProduct(null);
                                    setIsEditingPreview(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Manual Entry Option */}
                        <div className="text-center">
                          <Button
                            variant="outline"
                            onClick={() => setShowManualForm(!showManualForm)}
                            className="border-dashed"
                          >
                            {showManualForm ? 'Hide Manual Entry' : 'Or Add Product Manually'}
                          </Button>
                        </div>

                        {showManualForm && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg text-navy dark:text-blue-400">✍️ Manual Product Entry</CardTitle>
                              <CardDescription>Enter product details manually</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Manual entry form would go here (similar to admin panel form)
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Category Navigation for Mobile */}
        <section className="py-8 md:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Browse Categories</h3>
            <div className="flex overflow-x-auto pb-2 space-x-3">
              {allCategories.map((cat: any) => (
                <Link
                  key={cat.name}
                  href={`/category/${encodeURIComponent(cat.name)}`}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    decodeURIComponent(category || '') === cat.name
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <i className={`${cat.icon} text-xs mr-2`} style={{color: decodeURIComponent(category || '') === cat.name ? 'white' : cat.color}}></i>
                  {cat.name}
                </Link>
              ))}
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