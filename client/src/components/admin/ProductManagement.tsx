import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link, Sparkles, Loader2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  isFeatured: boolean;
  createdAt?: string;
}

export default function ProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [extractUrl, setExtractUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    imageUrl: '',
    affiliateUrl: '',
    category: '',
    gender: '',
    rating: '4.5',
    reviewCount: '100',
    discount: '',
    isFeatured: true,
    isService: false,
    hasTimer: false,
    timerDuration: '24',
    customFields: {} as Record<string, string>
  });
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([]);

  // Add custom field
  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  // Remove custom field
  const removeCustomField = (index: number) => {
    const newFields = customFields.filter((_, i) => i !== index);
    setCustomFields(newFields);
    
    // Update newProduct customFields
    const updatedCustomFields = { ...newProduct.customFields };
    const fieldToRemove = customFields[index];
    if (fieldToRemove.key) {
      delete updatedCustomFields[fieldToRemove.key];
    }
    setNewProduct({ ...newProduct, customFields: updatedCustomFields });
  };

  // Update custom field
  const updateCustomField = (index: number, key: string, value: string) => {
    const newFields = [...customFields];
    const oldKey = newFields[index].key;
    newFields[index] = { key, value };
    setCustomFields(newFields);
    
    // Update newProduct customFields
    const updatedCustomFields = { ...newProduct.customFields };
    if (oldKey && oldKey !== key) {
      delete updatedCustomFields[oldKey];
    }
    if (key) {
      updatedCustomFields[key] = value;
    }
    setNewProduct({ ...newProduct, customFields: updatedCustomFields });
  };

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      // Handle both array and object responses
      if (Array.isArray(data)) {
        return data;
      } else if (data.products && Array.isArray(data.products)) {
        return data.products;
      } else {
        return [];
      }
    },
    retry: 2
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: adminPassword,
          ...productData,
          price: parseFloat(productData.price),
          originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : null,
          reviewCount: parseInt(productData.reviewCount),
          rating: parseFloat(productData.rating),
          discount: productData.discount ? parseInt(productData.discount) : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setNewProduct({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        imageUrl: '',
        affiliateUrl: '',
        category: '',
        gender: '',
        rating: '4.5',
        reviewCount: '100',
        discount: '',
        isFeatured: true,
        isService: false,
        hasTimer: false,
        timerDuration: '24',
        customFields: {}
      });
      setCustomFields([]);
      setIsAddingProduct(false);
      toast({
        title: 'Success',
        description: 'Product added successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    }
  });

  // URL extraction mutation
  const extractProductMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/products/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract product details');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        const extracted = data.data;
        setNewProduct({
          name: extracted.name || '',
          description: extracted.description || '',
          price: extracted.price || '',
          originalPrice: extracted.originalPrice || '',
          imageUrl: extracted.imageUrl || '',
          affiliateUrl: extracted.affiliateUrl || extractUrl,
          category: extracted.category || 'Electronics & Gadgets',
          gender: '',
          rating: extracted.rating || '4.5',
          reviewCount: extracted.reviewCount || '100',
          discount: extracted.discount || '',
          isFeatured: true,
          isService: false,
          hasTimer: false,
          timerDuration: '24',
          customFields: {}
        });
        setCustomFields([]);
        setExtractUrl('');
        setIsAddingProduct(true);
        toast({
          title: 'Product Extracted!',
          description: 'Product details have been extracted. You can now edit and save.',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Extraction Failed',
        description: 'Could not extract product details from the URL. You can still add manually.',
        variant: 'destructive',
      });
    },
  });

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

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.price) {
      toast({
        title: 'Error',
        description: 'Product name and price are required',
        variant: 'destructive',
      });
      return;
    }
    addProductMutation.mutate(newProduct);
  };

  const handleExtractProduct = () => {
    if (!extractUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a product URL to extract details.',
        variant: 'destructive',
      });
      return;
    }
    setIsExtracting(true);
    extractProductMutation.mutate(extractUrl);
    setTimeout(() => setIsExtracting(false), 2000);
  };

  const handleDeleteProduct = (productId: number) => {
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
        const instagramText = `🛍️ Amazing Deal Alert! ${product.name}\n\n💰 Price: ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''}\n\n✨ Shop now at PickNTrust\n\n#PickNTrust #Deals #${product.category.replace(/\s+/g, '')} #Shopping`;
        navigator.clipboard.writeText(instagramText + '\n\n' + productUrl);
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard and Instagram opened. Paste to create your post!',
        });
        setShowShareMenu(prev => ({...prev, [product.id]: false}));
        return;
      case 'youtube':
        shareUrl = `https://www.youtube.com/@PickNTrust`;
        break;
      case 'pinterest':
        shareUrl = `https://www.pinterest.com/PickNTrust/`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(productUrl)}&title=${encodeURIComponent(product.name)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    setShowShareMenu(prev => ({...prev, [product.id]: false}));
  };

  const handleEditProduct = (product: Product) => {
    // Set the product data for editing
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      imageUrl: product.imageUrl,
      affiliateUrl: product.affiliateUrl,
      category: product.category,
      gender: '',
      rating: product.rating.toString(),
      reviewCount: product.reviewCount.toString(),
      discount: product.discount?.toString() || '',
      isFeatured: product.isFeatured,
      isService: false,
      hasTimer: false,
      timerDuration: '24',
      customFields: {}
    });
    setCustomFields([]);
    setIsAddingProduct(true);
    
    toast({
      title: 'Edit Mode',
      description: 'Product loaded for editing. Make your changes and save.',
    });
  };

  const commonCategories = [
    'Electronics & Gadgets', 'Fashion & Clothing', 'Home & Kitchen', 'Health & Beauty',
    'Sports & Fitness', 'Books & Education', 'Toys & Games', 'Automotive',
    'Travel & Luggage', 'Pet Supplies', 'Office Supplies', 'Garden & Outdoor'
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Products</CardTitle>
          <CardDescription>
            Failed to load products. Check your server connection.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Filter products based on active tab
  const filteredProducts = products.filter(product => {
    if (activeTab === 'services') {
      // Show only service products
      return product.category === 'Cards, Apps & Services' || 
             (product as any).isService === true ||
             ['Credit Cards', 'Banking Services', 'Streaming Services', 'Software & Apps', 'Insurance', 'Investment'].includes(product.category);
    } else {
      // Show only regular products (exclude services)
      return product.category !== 'Cards, Apps & Services' && 
             (product as any).isService !== true &&
             !['Credit Cards', 'Banking Services', 'Streaming Services', 'Software & Apps', 'Insurance', 'Investment'].includes(product.category);
    }
  });

  // Service categories for the services tab
  const serviceCategories = [
    'Credit Cards', 'Banking Services', 'Streaming Services', 'Software & Apps', 
    'Insurance', 'Investment', 'Mobile Apps', 'Subscription Services', 'Financial Services'
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="flex items-center gap-2">
              {activeTab === 'products' ? (
                <i className="fas fa-box text-blue-400"></i>
              ) : (
                <i className="fas fa-credit-card text-purple-400"></i>
              )}
              Product & Service Management
            </div>
          </CardTitle>
          <CardDescription className="text-blue-200">
            Manage your products and services with comprehensive admin controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'products' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('products');
                setIsAddingProduct(false);
                setNewProduct({
                  ...newProduct,
                  isService: false,
                  category: '',
                  customFields: {}
                });
              }}
              className={`flex items-center gap-2 ${
                activeTab === 'products' 
                  ? 'bg-blue-600 text-white' 
                  : 'border-blue-600 text-blue-300 hover:bg-blue-800'
              }`}
            >
              <i className="fas fa-box"></i>
              Products Management
            </Button>
            <Button
              variant={activeTab === 'services' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('services');
                setIsAddingProduct(false);
                setNewProduct({
                  ...newProduct,
                  isService: true,
                  category: '',
                  customFields: {}
                });
              }}
              className={`flex items-center gap-2 ${
                activeTab === 'services' 
                  ? 'bg-purple-600 text-white' 
                  : 'border-purple-600 text-purple-300 hover:bg-purple-800'
              }`}
            >
              <i className="fas fa-credit-card"></i>
              Cards, Apps & Services
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* URL Product Extractor */}
      <Card className="border-2 border-dashed border-purple-400 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-5 h-5" />
            Smart {activeTab === 'services' ? 'Service' : 'Product'} Extractor
          </CardTitle>
          <CardDescription className="text-blue-200">
            Paste any {activeTab === 'services' ? 'service' : 'product'} URL to automatically extract details (Amazon, eBay, Flipkart, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder={`Paste ${activeTab === 'services' ? 'service' : 'product'} URL here (e.g., https://amazon.com/product/...)`}
              value={extractUrl}
              onChange={(e) => setExtractUrl(e.target.value)}
              className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
            />
            <Button 
              onClick={handleExtractProduct}
              disabled={isExtracting || extractProductMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 min-w-[140px]"
            >
              {isExtracting || extractProductMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract Details
                </>
              )}
            </Button>
          </div>
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-2 text-purple-300">Supported platforms:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-slate-800 text-blue-300 border-slate-600">Amazon</Badge>
              <Badge variant="outline" className="bg-slate-800 text-blue-300 border-slate-600">eBay</Badge>
              <Badge variant="outline" className="bg-slate-800 text-blue-300 border-slate-600">AliExpress</Badge>
              <Badge variant="outline" className="bg-slate-800 text-blue-300 border-slate-600">Flipkart</Badge>
              <Badge variant="outline" className="bg-slate-800 text-blue-300 border-slate-600">Shopify</Badge>
              <Badge variant="outline" className="bg-slate-800 text-blue-300 border-slate-600">And more...</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Product Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New {activeTab === 'services' ? 'Service' : 'Product'}</CardTitle>
          <CardDescription className="text-blue-200">
            Add a new {activeTab === 'services' ? 'service' : 'product'} manually or use the extractor above
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAddingProduct ? (
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  setIsAddingProduct(true);
                  setNewProduct({
                    ...newProduct,
                    isService: activeTab === 'services',
                    category: ''
                  });
                }}
                className={`${activeTab === 'services' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {activeTab === 'services' ? (
                  <>
                    <i className="fas fa-credit-card mr-2"></i>
                    Add Service Manually
                  </>
                ) : (
                  <>
                    <i className="fas fa-box mr-2"></i>
                    Add Product Manually
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">
                    {activeTab === 'services' ? 'Service' : 'Product'} Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder={activeTab === 'services' ? 'e.g., HDFC Credit Card' : 'e.g., Wireless Headphones'}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {(activeTab === 'services' ? serviceCategories : commonCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Gender (Optional)</label>
                  <select
                    value={newProduct.gender || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                  >
                    <option value="">Select Gender (Optional)</option>
                    <option value="men">👨 Men</option>
                    <option value="women">👩 Women</option>
                    <option value="boys">👦 Boys</option>
                    <option value="girls">👧 Girls</option>
                  </select>
                </div>
                <div></div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-blue-300">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Product description..."
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Price (₹)</label>
                  <input
                    type="text"
                    value={newProduct.price}
                    onChange={(e) => {
                      // Allow numbers and commas
                      const value = e.target.value.replace(/[^\d,]/g, '');
                      setNewProduct({ ...newProduct, price: value });
                    }}
                    placeholder="2,999"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Use commas for thousands (e.g., 2,999)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Original Price (₹)</label>
                  <input
                    type="text"
                    value={newProduct.originalPrice}
                    onChange={(e) => {
                      // Allow numbers and commas
                      const value = e.target.value.replace(/[^\d,]/g, '');
                      setNewProduct({ ...newProduct, originalPrice: value });
                    }}
                    placeholder="3,999"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Use commas for thousands (e.g., 3,999)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Discount (%)</label>
                  <input
                    type="number"
                    value={newProduct.discount}
                    onChange={(e) => setNewProduct({ ...newProduct, discount: e.target.value })}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Image URL</label>
                  <input
                    type="url"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Affiliate URL</label>
                  <input
                    type="url"
                    value={newProduct.affiliateUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, affiliateUrl: e.target.value })}
                    placeholder="https://affiliate-link.com"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newProduct.rating}
                    onChange={(e) => setNewProduct({ ...newProduct, rating: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Review Count</label>
                  <input
                    type="number"
                    value={newProduct.reviewCount}
                    onChange={(e) => setNewProduct({ ...newProduct, reviewCount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={newProduct.isFeatured}
                    onChange={(e) => setNewProduct({ ...newProduct, isFeatured: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-blue-300">Featured Product</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isService"
                    checked={newProduct.isService}
                    onChange={(e) => setNewProduct({ ...newProduct, isService: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isService" className="text-sm font-medium text-blue-300">💳 Service Product (Cards, Apps & Services)</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasTimer"
                    checked={newProduct.hasTimer}
                    onChange={(e) => setNewProduct({ ...newProduct, hasTimer: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="hasTimer" className="text-sm font-medium text-blue-300">Add Countdown Timer</label>
                </div>

                {newProduct.hasTimer && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-300">Timer Duration (hours)</label>
                    <select
                      value={newProduct.timerDuration}
                      onChange={(e) => setNewProduct({ ...newProduct, timerDuration: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                    >
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                      <option value="6">6 hours</option>
                      <option value="12">12 hours</option>
                      <option value="24">24 hours (1 day)</option>
                      <option value="48">48 hours (2 days)</option>
                      <option value="72">72 hours (3 days)</option>
                      <option value="168">1 week</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      ⚠️ Product will be automatically deleted when timer expires
                    </p>
                  </div>
                )}
              </div>

              {/* Service-Specific Fields */}
              {newProduct.isService && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">
                    💳 Service Product Fields
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Service Type</label>
                      <select
                        value={newProduct.customFields?.serviceType || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, serviceType: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                      >
                        <option value="">Select Service Type</option>
                        <option value="subscription">📱 Subscription Service</option>
                        <option value="credit-card">💳 Credit Card</option>
                        <option value="banking">🏦 Banking Service</option>
                        <option value="insurance">🛡️ Insurance</option>
                        <option value="investment">📈 Investment</option>
                        <option value="loan">💰 Loan Service</option>
                        <option value="app">📲 Mobile App</option>
                        <option value="software">💻 Software</option>
                        <option value="streaming">🎬 Streaming Service</option>
                        <option value="other">🔧 Other Service</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Monthly/Annual Price</label>
                      <select
                        value={newProduct.customFields?.pricingType || 'monthly'}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, pricingType: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                      >
                        <option value="monthly">💰 Monthly Pricing</option>
                        <option value="annual">📅 Annual Pricing</option>
                        <option value="one-time">⚡ One-time Payment</option>
                        <option value="free">🆓 Free Service</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Provider/Company</label>
                      <input
                        type="text"
                        value={newProduct.customFields?.provider || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, provider: e.target.value }
                        })}
                        placeholder="e.g., Netflix, HDFC Bank, Amazon"
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Service Features</label>
                      <input
                        type="text"
                        value={newProduct.customFields?.features || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, features: e.target.value }
                        })}
                        placeholder="e.g., 4K Streaming, Cashback, Premium Support"
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Eligibility Criteria</label>
                      <textarea
                        value={newProduct.customFields?.eligibility || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, eligibility: e.target.value }
                        })}
                        placeholder="e.g., Age 18+, Minimum income ₹25,000, Good credit score"
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Terms & Conditions</label>
                      <textarea
                        value={newProduct.customFields?.terms || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, terms: e.target.value }
                        })}
                        placeholder="e.g., No hidden charges, Cancel anytime, 30-day free trial"
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Processing Time</label>
                      <input
                        type="text"
                        value={newProduct.customFields?.processingTime || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, processingTime: e.target.value }
                        })}
                        placeholder="e.g., Instant, 2-3 days, 1 week"
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Customer Support</label>
                      <input
                        type="text"
                        value={newProduct.customFields?.support || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, support: e.target.value }
                        })}
                        placeholder="e.g., 24/7 Chat, Phone, Email"
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Reward/Cashback Rate</label>
                      <input
                        type="text"
                        value={newProduct.customFields?.rewards || ''}
                        onChange={(e) => setNewProduct({ 
                          ...newProduct, 
                          customFields: { ...newProduct.customFields, rewards: e.target.value }
                        })}
                        placeholder="e.g., 1.5% cashback, 5X points"
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-purple-300 mb-2">
                      <i className="fas fa-info-circle"></i>
                      <span className="text-sm font-medium">Service Product Information</span>
                    </div>
                    <p className="text-purple-200 text-xs">
                      These fields are specifically for Cards, Apps & Services section. Fill in relevant information to help users make informed decisions about financial products and services.
                    </p>
                  </div>
                </div>
              )}

              {/* Custom Fields Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-blue-300">Custom Fields</label>
                  <Button
                    type="button"
                    onClick={addCustomField}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Custom Field
                  </Button>
                </div>
                
                {customFields.length > 0 && (
                  <div className="space-y-3">
                    {customFields.map((field, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label htmlFor={`custom-key-${index}`} className="block text-sm font-medium mb-2 text-blue-300">Field Name</label>
                          <input
                            id={`custom-key-${index}`}
                            value={field.key}
                            onChange={(e) => updateCustomField(index, e.target.value, field.value)}
                            placeholder="e.g., Brand, Color, Size"
                            className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                          />
                        </div>
                        <div className="flex-1">
                          <label htmlFor={`custom-value-${index}`} className="block text-sm font-medium mb-2 text-blue-300">Field Value</label>
                          <input
                            id={`custom-value-${index}`}
                            value={field.value}
                            onChange={(e) => updateCustomField(index, field.key, e.target.value)}
                            placeholder="e.g., Nike, Red, Large"
                            className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeCustomField(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {customFields.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <i className="fas fa-info-circle mr-2"></i>
                    No custom fields added. Click "Add Custom Field" to add product-specific information.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={addProductMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addProductMutation.isPending ? 'Adding...' : 'Add Product'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddingProduct(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Current {activeTab === 'services' ? 'Services' : 'Products'} ({filteredProducts.length})
          </CardTitle>
          <CardDescription className="text-blue-200">
            Manage all your {activeTab === 'services' ? 'services' : 'products'} with full control
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading {activeTab === 'services' ? 'services' : 'products'}...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                {activeTab === 'services' ? (
                  <i className="fas fa-credit-card text-6xl text-purple-400 mb-4"></i>
                ) : (
                  <i className="fas fa-box text-6xl text-blue-400 mb-4"></i>
                )}
              </div>
              <p className="text-gray-600 mb-2">
                No {activeTab === 'services' ? 'services' : 'products'} found in this category.
              </p>
              <p className="text-gray-500 text-sm">
                Add your first {activeTab === 'services' ? 'service' : 'product'} using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product: Product) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 rounded-lg hover:bg-gray-750 transition-colors ${
                    activeTab === 'services' 
                      ? 'bg-purple-900/20 border border-purple-600/30' 
                      : 'bg-gray-800'
                  }`}
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-blue-400 truncate">{product.name}</h3>
                      {activeTab === 'services' && (
                        <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">SERVICE</span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-2 line-clamp-1">{product.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400 font-bold">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-gray-500 line-through">₹{product.originalPrice}</span>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-white">{product.rating}</span>
                        <span className="text-gray-400">({product.reviewCount})</span>
                      </div>
                      <span className="text-gray-400">{product.category}</span>
                      {product.isFeatured && (
                        <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">FEATURED</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(prev => ({...prev, [product.id]: !prev[product.id]}))}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title={`Share ${activeTab === 'services' ? 'service' : 'product'}`}
                      >
                        <i className="fas fa-share text-gray-300"></i>
                      </button>
                      
                      {/* Share Menu */}
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
                    <button
                      onClick={() => window.open(product.affiliateUrl, '_blank')}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Open affiliate link"
                    >
                      <i className="fas fa-external-link-alt text-gray-300"></i>
                    </button>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title={`Edit ${activeTab === 'services' ? 'service' : 'product'}`}
                    >
                      <i className="fas fa-edit text-gray-300"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deleteProductMutation.isPending}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title={`Delete ${activeTab === 'services' ? 'service' : 'product'}`}
                    >
                      <i className="fas fa-trash text-white"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
