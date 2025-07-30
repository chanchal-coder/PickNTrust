import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/header';
import { Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, Star, DollarSign, Trophy, Package, Globe, FileText, Eye, Play, X, Tag, Plus, Settings } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  originalPrice: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  affiliateNetworkId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  rating: z.string().min(1, 'Rating is required'),
  reviewCount: z.string().min(1, 'Review count is required'),
  discount: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// Product Management Card Component
function ProductManagementCard({ product, onUpdate, onDelete }: { product: any, onUpdate: () => void, onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [editData, setEditData] = useState(product);
  const { toast } = useToast();

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
      onDelete();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, password: 'pickntrust2025' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Product Updated!',
        description: 'Product has been updated successfully.',
      });
      setIsEditing(false);
      onUpdate();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleUpdate = () => {
    updateProductMutation.mutate(editData);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(product); // Reset to original data
    }
    setIsEditing(!isEditing);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
              {product.isNew && (
                <Badge className="bg-green-500 text-white text-xs">NEW</Badge>
              )}
              {product.isFeatured && (
                <Badge className="bg-blue-500 text-white text-xs">FEATURED</Badge>
              )}
            </div>
            
            <div className="flex items-start gap-4">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-16 h-16 object-cover rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/api/placeholder/64/64';
                }}
              />
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="font-medium"
                    />
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editData.price}
                        onChange={(e) => setEditData({...editData, price: e.target.value})}
                        placeholder="Price"
                      />
                      <Input
                        value={editData.originalPrice || ''}
                        onChange={(e) => setEditData({...editData, originalPrice: e.target.value})}
                        placeholder="Original Price"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2 mb-3">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-green-600">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-gray-500 line-through">₹{product.originalPrice}</span>
                      )}
                      {product.discount && (
                        <span className="text-red-500 font-medium">-{product.discount}%</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          {/* Social Media Sharing Buttons */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = product.affiliateUrl;
                const text = `Check out this amazing product: ${product.name} - Only ₹${product.price}!`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
              }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Share on Facebook"
            >
              <Facebook className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = product.affiliateUrl;
                const text = `Check out this amazing product: ${product.name} - Only ₹${product.price}!`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
              }}
              className="p-1.5 text-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20"
              title="Share on X (Twitter)"
            >
              <div className="w-3 h-3 bg-black rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">𝕏</span>
              </div>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`, '_blank', 'width=1200,height=800');
              }}
              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(product.affiliateUrl);
                toast({
                  title: "Link Copied!",
                  description: "Paste this link in your Instagram story or bio.",
                });
              }}
              className="p-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white hover:scale-110 transition-all"
              title="Copy link for Instagram"
            >
              <Instagram className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleUpdate} disabled={updateProductMutation.isPending}>
                  {updateProductMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleEditToggle}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={handleEditToggle}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteProductMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CleanAdminPage() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [productUrl, setProductUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showNetworks, setShowNetworks] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: products = [], refetch: refetchProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products/featured'],
    enabled: isAuthenticated,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    enabled: isAuthenticated,
  });

  const { data: affiliateNetworks = [] } = useQuery({
    queryKey: ['/api/affiliate-networks'],
    enabled: isAuthenticated,
  });

  const { data: adminStats = { totalProducts: 0, featuredProducts: 0, blogPosts: 0, affiliateNetworks: 0 } } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthenticated,
  });

  // Form for manual product entry
  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      imageUrl: '',
      affiliateUrl: '',
      affiliateNetworkId: '',
      category: '',
      rating: '4.5',
      reviewCount: '100',
      discount: '',
      isNew: false,
      isFeatured: false,
    },
  });

  // Check authentication on load
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    setIsAuthenticated(adminSession === 'active');
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setPassword('');
        localStorage.setItem('pickntrust-admin-session', 'active');
        toast({
          title: 'Access Granted',
          description: 'Welcome to PickNTrust Admin Panel.',
        });
      } else {
        setShowForgotPassword(true);
        toast({
          title: 'Access Denied',
          description: 'Incorrect password. Please try again.',
          variant: 'destructive',
        });
        setPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setShowForgotPassword(true);
      toast({
        title: 'Login Failed',
        description: 'Unable to connect to server. Please try again.',
        variant: 'destructive',
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pickntrust-admin-session');
    toast({
      title: 'Logged Out',
      description: 'Redirecting to homepage...',
    });
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  // Product extraction functionality
  const extractProductDetails = async () => {
    if (!productUrl.trim()) return;

    setIsExtracting(true);
    try {
      const response = await fetch('/api/admin/extract-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: productUrl.trim(),
          password: 'pickntrust2025'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExtractedProduct(data.product);
        setShowPreview(true);
        setIsEditingPreview(false);
        toast({
          title: 'Product Extracted!',
          description: 'Review the details and confirm to add to catalog.',
        });
      } else {
        throw new Error(data.message || 'Failed to extract product details');
      }
    } catch (error) {
      console.error('Product extraction error:', error);
      toast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : 'Failed to extract product details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return apiRequest('/api/admin/products', 'POST', {
        ...productData,
        password: 'pickntrust2025'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Product Added!',
        description: 'Product has been successfully added to your catalog.',
      });
      form.reset();
      setShowManualForm(false);
      setShowPreview(false);
      setExtractedProduct(null);
      setProductUrl('');
      refetchProducts();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProductForm) => {
    addProductMutation.mutate(data);
  };

  const confirmAddProduct = () => {
    if (extractedProduct) {
      addProductMutation.mutate(extractedProduct);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-navy dark:text-blue-400">PickNTrust Admin</CardTitle>
              <CardDescription>Enter password to access admin panel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-bright-blue hover:bg-navy">
                  Access Admin Panel
                </Button>
              </form>
              
              {showForgotPassword && (
                <div className="text-center mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    Can't access your account?
                  </p>
                  <Link 
                    href="/admin/change-password" 
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline font-medium"
                  >
                    Reset your password →
                  </Link>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                Only authorized users can access this panel
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-navy dark:text-blue-400 mb-2">
                PickNTrust Admin Panel
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your products and affiliate links daily
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/admin/change-password"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 text-sm font-medium flex items-center gap-2"
              >
                🔒 Change Password
              </Link>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Products</p>
                    <p className="text-2xl font-bold">{adminStats.totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Featured Products</p>
                    <p className="text-2xl font-bold">{adminStats.featuredProducts}</p>
                  </div>
                  <Star className="w-8 h-8 text-indigo-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Blog Posts</p>
                    <p className="text-2xl font-bold">{adminStats.blogPosts}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Networks</p>
                    <p className="text-2xl font-bold">{adminStats.affiliateNetworks}</p>
                  </div>
                  <Globe className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Management Section */}
          <div className="space-y-8">
            {/* Auto-Extract Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-xl text-bright-blue">🚀 Auto-Extract Product Details</CardTitle>
                <CardDescription>
                  Paste any product URL (Amazon, Flipkart, etc.) to automatically extract and add products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Paste product URL here..."
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={extractProductDetails}
                    disabled={isExtracting || !productUrl.trim()}
                    className="bg-bright-blue hover:bg-navy text-white px-6"
                  >
                    {isExtracting ? 'Extracting...' : 'Extract Details'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Product Preview Section */}
            {showPreview && extractedProduct && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="bg-green-50 dark:bg-green-900/20">
                  <CardTitle className="text-green-700 dark:text-green-400">
                    📋 Product Preview
                  </CardTitle>
                  <CardDescription>
                    Review the extracted details and confirm to add to your catalog
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex gap-4 mb-6">
                    <img 
                      src={extractedProduct.imageUrl} 
                      alt={extractedProduct.name}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{extractedProduct.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{extractedProduct.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600">₹{extractedProduct.price}</span>
                        {extractedProduct.originalPrice && (
                          <span className="text-gray-500 line-through">₹{extractedProduct.originalPrice}</span>
                        )}
                        {extractedProduct.discount && (
                          <span className="text-red-500 font-medium">-{extractedProduct.discount}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={confirmAddProduct} disabled={addProductMutation.isPending}>
                      {addProductMutation.isPending ? 'Adding...' : 'Add to Catalog'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowPreview(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Product Form */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Manual Product Entry</CardTitle>
                    <CardDescription>Add products manually when auto-extract doesn't work</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowManualForm(!showManualForm)}
                  >
                    {showManualForm ? 'Hide Form' : 'Show Manual Form'}
                  </Button>
                </div>
              </CardHeader>
              {showManualForm && (
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          {...form.register('name')}
                          placeholder="iPhone 15 Pro Max"
                        />
                        {form.formState.errors.name && (
                          <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select onValueChange={(value) => form.setValue('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories as any[]).map((category: any) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.category && (
                          <p className="text-red-500 text-sm">{form.formState.errors.category.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        {...form.register('description')}
                        placeholder="Product description..."
                        rows={3}
                      />
                      {form.formState.errors.description && (
                        <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="price">Current Price (₹) *</Label>
                        <Input
                          {...form.register('price')}
                          placeholder="99999"
                        />
                        {form.formState.errors.price && (
                          <p className="text-red-500 text-sm">{form.formState.errors.price.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="originalPrice">Original Price (₹)</Label>
                        <Input
                          {...form.register('originalPrice')}
                          placeholder="149999"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rating">Rating *</Label>
                        <Input
                          {...form.register('rating')}
                          placeholder="4.5"
                        />
                        {form.formState.errors.rating && (
                          <p className="text-red-500 text-sm">{form.formState.errors.rating.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="reviewCount">Review Count *</Label>
                        <Input
                          {...form.register('reviewCount')}
                          placeholder="1500"
                        />
                        {form.formState.errors.reviewCount && (
                          <p className="text-red-500 text-sm">{form.formState.errors.reviewCount.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="imageUrl">Image URL *</Label>
                        <Input
                          {...form.register('imageUrl')}
                          placeholder="https://example.com/image.jpg"
                        />
                        {form.formState.errors.imageUrl && (
                          <p className="text-red-500 text-sm">{form.formState.errors.imageUrl.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="affiliateUrl">Affiliate URL *</Label>
                        <Input
                          {...form.register('affiliateUrl')}
                          placeholder="https://affiliate-link.com"
                        />
                        {form.formState.errors.affiliateUrl && (
                          <p className="text-red-500 text-sm">{form.formState.errors.affiliateUrl.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...form.register('isNew')}
                        />
                        <span>Mark as New</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...form.register('isFeatured')}
                        />
                        <span>Mark as Featured</span>
                      </label>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={addProductMutation.isPending}
                      className="w-full"
                    >
                      {addProductMutation.isPending ? 'Adding Product...' : 'Add Product'}
                    </Button>
                  </form>
                </CardContent>
              )}
            </Card>

            {/* Product List */}
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>
                  Manage all your products - edit, share, or delete them
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((item) => (
                      <Card key={item} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
                          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !Array.isArray(products) || products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">No Products Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Add your first product to get started</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {products.map((product: any) => (
                      <ProductManagementCard
                        key={product.id}
                        product={product}
                        onUpdate={refetchProducts}
                        onDelete={refetchProducts}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}