import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Trash2, Edit, Share2, ExternalLink, Facebook, Twitter, Instagram, MessageCircle, Star, DollarSign } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  originalPrice: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL'),
  affiliateUrl: z.string().url('Must be a valid URL'),
  affiliateNetworkId: z.string().optional(),
  category: z.enum(['Tech', 'Home', 'Beauty', 'Fashion', 'Deals', 'Fitness', 'Books', 'Kitchen', 'Gaming', 'Travel', 'Baby', 'Pets', 'Automotive']),
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
  const { toast } = useToast();

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

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleShare = (platform: string) => {
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
        // Updated Instagram sharing - opens Instagram with better integration
        const instagramText = `🛍️ Amazing Deal Alert! ${product.name} - Only ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''}! 💰\n\n✨ Get the best deals at PickNTrust\n\n#PickNTrust #Deals #Shopping #BestPrice`;
        
        // Copy to clipboard for easy sharing
        navigator.clipboard.writeText(instagramText + '\n\n' + productUrl);
        
        // Try to open Instagram app or web
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
    
    setShowShareMenu(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h5 className="font-semibold text-navy dark:text-blue-400">{product.name}</h5>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.description}</p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-600">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-gray-500 line-through">₹{product.originalPrice}</span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{product.rating}</span>
                <span className="text-gray-500">({product.reviewCount})</span>
              </div>
              
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
              
              {product.isNew && (
                <Badge className="bg-green-100 text-green-800 text-xs">NEW</Badge>
              )}
              
              {product.isFeatured && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">FEATURED</Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 border rounded-lg shadow-lg p-2 z-10">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Twitter className="w-4 h-4 text-blue-400" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                  >
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('instagram')}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                  >
                    <Instagram className="w-4 h-4 text-purple-600" />
                    Instagram
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(product.affiliateUrl, '_blank')}
            className="p-2"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="p-2"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteProductMutation.isPending}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Affiliate Network Manager Component
function AffiliateNetworkManager() {
  const { data: networks = [], isLoading } = useQuery({
    queryKey: ['/api/affiliate-networks']
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading networks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(networks as any[]).map((network: any) => (
          <div key={network.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-navy dark:text-blue-400">{network.name}</h4>
              <Badge variant={network.isActive ? "default" : "secondary"}>
                {network.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300">{network.description}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Commission Rate:</span>
                <span className="font-medium text-green-600">{network.commissionRate}%</span>
              </div>
              
              {network.trackingParams && (
                <div className="flex justify-between">
                  <span>Tracking:</span>
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                    {network.trackingParams}
                  </code>
                </div>
              )}
            </div>

            {network.joinUrl && (
              <a 
                href={network.joinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-bright-blue hover:underline"
              >
                Join Network →
              </a>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Network Integration Tips</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• Apply for networks with highest commission rates first</li>
          <li>• Use proper tracking parameters in all affiliate links</li>
          <li>• Test links regularly to ensure they work properly</li>
          <li>• Monitor performance and focus on best-converting networks</li>
          <li>• Diversify across multiple networks to maximize revenue</li>
        </ul>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showNetworks, setShowNetworks] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);

  // Check if admin session exists on page load
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    if (adminSession === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured']
  });

  const { data: affiliateNetworks = [] } = useQuery({
    queryKey: ['/api/affiliate-networks']
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        ...data,
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        rating: parseFloat(data.rating),
        reviewCount: parseInt(data.reviewCount),
        discount: data.discount ? parseInt(data.discount) : undefined,
        affiliateNetworkId: data.affiliateNetworkId ? parseInt(data.affiliateNetworkId) : undefined,
        isNew: data.isNew || false,
        isFeatured: data.isFeatured || false,
      };
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Product Added!',
        description: 'New product has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      // Reset form to default values instead of clearing
      form.reset({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        imageUrl: '',
        affiliateUrl: '',
        category: 'Tech',
        rating: '4.5',
        reviewCount: '100',
        discount: '',
        isNew: false,
        isFeatured: true,
      });
      setShowAddForm(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      imageUrl: '',
      affiliateUrl: '',
      category: 'Tech',
      rating: '4.5',
      reviewCount: '100',
      discount: '',
      isNew: false,
      isFeatured: true,
    },
  });

  const onSubmit = (data: ProductForm) => {
    addProductMutation.mutate(data);
  };

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
        title: 'Error',
        description: 'Failed to extract product details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const addExtractedProduct = async () => {
    if (!extractedProduct) return;

    // Validation
    if (!extractedProduct.name?.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a product name.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!extractedProduct.imageUrl?.trim()) {
      toast({
        title: 'Image Required',
        description: 'Please enter a valid image URL.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!extractedProduct.affiliateUrl?.trim()) {
      toast({
        title: 'Affiliate Link Required',
        description: 'Please enter a valid affiliate link.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const productData = {
        name: extractedProduct.name.trim(),
        description: extractedProduct.description?.trim() || `Professional-grade ${extractedProduct.name} with industry-leading features.`,
        price: extractedProduct.price,
        originalPrice: extractedProduct.originalPrice || undefined,
        rating: parseFloat(extractedProduct.rating) || 4.5,
        reviewCount: parseInt(extractedProduct.reviewCount) || 100,
        discount: extractedProduct.discount ? parseInt(extractedProduct.discount) : undefined,
        category: extractedProduct.category,
        imageUrl: extractedProduct.imageUrl.trim(),
        affiliateUrl: extractedProduct.affiliateUrl.trim(),
        affiliateNetworkId: extractedProduct.affiliateNetworkId ? parseInt(extractedProduct.affiliateNetworkId) : undefined,
        isNew: extractedProduct.isNew || false,
        isFeatured: extractedProduct.isFeatured !== false,
      };

      const addResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (addResponse.ok) {
        toast({
          title: 'Product Added Successfully!',
          description: `"${extractedProduct.name}" has been added to your catalog.`,
        });
        
        // Refresh the products list
        queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
        
        // Clear everything
        setProductUrl('');
        setExtractedProduct(null);
        setShowPreview(false);
      } else {
        throw new Error('Failed to add product');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - you can change this password
    if (password === 'pickntrust2025') {
      setIsAuthenticated(true);
      setPassword('');
      // Set admin session for all category pages
      localStorage.setItem('pickntrust-admin-session', 'active');
      toast({
        title: 'Access Granted',
        description: 'Welcome to PickNTrust Admin Panel. You now have admin controls across all pages.',
      });
    } else {
      toast({
        title: 'Access Denied',
        description: 'Incorrect password. Please try again.',
        variant: 'destructive',
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // Remove admin session from all category pages
    localStorage.removeItem('pickntrust-admin-session');
    toast({
      title: 'Logged Out',
      description: 'Admin session ended. Admin controls disabled across all pages.',
    });
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
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Logout
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-navy dark:text-blue-400">
                  {(products as any[]).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Featured Products</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent-green">
                  {(products as any[]).filter((p: any) => p.isFeatured).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent-orange">{(categories as any[]).length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Auto-Extract Section - Always Visible */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-xl text-bright-blue">🚀 Auto-Extract Product Details</CardTitle>
              <CardDescription>
                Paste any product URL (Amazon, Flipkart, etc.) to automatically extract and add products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Paste product URL here: https://amazon.in/dp/B08N5WRWNW or https://flipkart.com/product..."
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  onClick={extractProductDetails}
                  disabled={isExtracting || !productUrl.trim()}
                  className="bg-bright-blue hover:bg-navy text-white px-6"
                >
                  {isExtracting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Extracting...
                    </>
                  ) : (
                    'Extract Details'
                  )}
                </Button>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Amazon Products
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Flipkart Products  
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Other Retailers
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Preview Section */}
          {showPreview && extractedProduct && (
            <Card className="mb-8 border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-green-700 dark:text-green-400">
                      {isEditingPreview ? '✏️ Edit Product Details' : '📋 Product Preview'}
                    </CardTitle>
                    <CardDescription>
                      {isEditingPreview 
                        ? 'Edit the extracted details before adding to your catalog'
                        : 'Review the extracted details and confirm to add to your catalog'
                      }
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {isEditingPreview ? 'Preview' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditingPreview ? (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Product Name *</Label>
                        <Input
                          id="edit-name"
                          value={extractedProduct.name}
                          onChange={(e) => setExtractedProduct({...extractedProduct, name: e.target.value})}
                          placeholder="Enter product name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-category">Category *</Label>
                        <Select 
                          value={extractedProduct.category}
                          onValueChange={(value) => setExtractedProduct({...extractedProduct, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories as any[]).map((category: any) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name} - {category.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={extractedProduct.description}
                        onChange={(e) => setExtractedProduct({...extractedProduct, description: e.target.value})}
                        placeholder="Enter product description"
                        rows={3}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-price">Current Price (₹) *</Label>
                        <Input
                          id="edit-price"
                          value={extractedProduct.price}
                          onChange={(e) => setExtractedProduct({...extractedProduct, price: e.target.value})}
                          placeholder="9999.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-originalPrice">Original Price (₹)</Label>
                        <Input
                          id="edit-originalPrice"
                          value={extractedProduct.originalPrice || ''}
                          onChange={(e) => setExtractedProduct({...extractedProduct, originalPrice: e.target.value})}
                          placeholder="14999.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-discount">Discount %</Label>
                        <Input
                          id="edit-discount"
                          value={extractedProduct.discount || ''}
                          onChange={(e) => setExtractedProduct({...extractedProduct, discount: e.target.value})}
                          placeholder="33"
                          type="number"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-rating">Rating (1-5) *</Label>
                        <Input
                          id="edit-rating"
                          value={extractedProduct.rating}
                          onChange={(e) => setExtractedProduct({...extractedProduct, rating: e.target.value})}
                          placeholder="4.5"
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-reviewCount">Review Count *</Label>
                        <Input
                          id="edit-reviewCount"
                          value={extractedProduct.reviewCount}
                          onChange={(e) => setExtractedProduct({...extractedProduct, reviewCount: e.target.value})}
                          placeholder="1234"
                          type="number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="edit-imageUrl">Product Image URL *</Label>
                      <Input
                        id="edit-imageUrl"
                        value={extractedProduct.imageUrl}
                        onChange={(e) => setExtractedProduct({...extractedProduct, imageUrl: e.target.value})}
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Update with high-quality image URL if the extracted image is incorrect
                      </p>
                      {/* Image Preview */}
                      {extractedProduct.imageUrl && (
                        <div className="mt-3">
                          <img 
                            src={extractedProduct.imageUrl} 
                            alt={extractedProduct.name}
                            className="w-32 h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="edit-affiliateUrl">Affiliate Link *</Label>
                      <Input
                        id="edit-affiliateUrl"
                        value={extractedProduct.affiliateUrl}
                        onChange={(e) => setExtractedProduct({...extractedProduct, affiliateUrl: e.target.value})}
                        placeholder="https://amzn.to/XXXXXXX"
                      />
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={extractedProduct.isNew || false}
                          onChange={(e) => setExtractedProduct({...extractedProduct, isNew: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Mark as NEW</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={extractedProduct.isFeatured !== false}
                          onChange={(e) => setExtractedProduct({...extractedProduct, isFeatured: e.target.checked})}
                          className="rounded"
                        />
                        <span className="text-sm">Featured Product</span>
                      </label>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-navy dark:text-blue-400">Rating</h4>
                          <p className="text-sm">{extractedProduct.rating}/5 ⭐</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-navy dark:text-blue-400">Reviews</h4>
                          <p className="text-sm">{extractedProduct.reviewCount} reviews</p>
                        </div>
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

          {/* Manual Add Product Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Manual Product Management</CardTitle>
              <CardDescription>
                Add products manually or edit auto-extracted details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-bright-blue hover:bg-navy text-white mb-4"
              >
                {showAddForm ? 'Cancel Manual Entry' : 'Add Product Manually'}
              </Button>

              {showAddForm && (
                <div className="space-y-6">

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        placeholder="Premium Wireless Smartphone"
                      />
                      {form.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('category', value as any)}
                        defaultValue="Tech"
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(categories as any[]).map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name} - {category.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="High-quality product with amazing features..."
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Current Price (₹) *</Label>
                      <Input
                        id="price"
                        {...form.register('price')}
                        placeholder="₹9,999.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="originalPrice">Original Price (₹)</Label>
                      <Input
                        id="originalPrice"
                        {...form.register('originalPrice')}
                        placeholder="₹14,999.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount">Discount %</Label>
                      <Input
                        id="discount"
                        {...form.register('discount')}
                        placeholder="33"
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rating">Rating (1-5) *</Label>
                      <Input
                        id="rating"
                        {...form.register('rating')}
                        placeholder="4.5"
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reviewCount">Review Count *</Label>
                      <Input
                        id="reviewCount"
                        {...form.register('reviewCount')}
                        placeholder="1234"
                        type="number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">Product Image URL *</Label>
                    <Input
                      id="imageUrl"
                      {...form.register('imageUrl')}
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Use high-quality images from Unsplash or official product websites
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="affiliateUrl">Affiliate Link *</Label>
                      <Input
                        id="affiliateUrl"
                        {...form.register('affiliateUrl')}
                        placeholder="https://amzn.to/XXXXXXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="affiliateNetworkId">Affiliate Network</Label>
                      <Select 
                        onValueChange={(value) => form.setValue('affiliateNetworkId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                        <SelectContent>
                          {(affiliateNetworks as any[]).map((network: any) => (
                            <SelectItem key={network.id} value={network.id.toString()}>
                              {network.name} ({network.commissionRate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Select the affiliate network and enter your tracking link
                  </p>

                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...form.register('isNew')}
                        className="rounded"
                      />
                      <span className="text-sm">Mark as NEW</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...form.register('isFeatured')}
                        className="rounded"
                        defaultChecked
                      />
                      <span className="text-sm">Featured Product</span>
                    </label>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={addProductMutation.isPending}
                    className="bg-accent-green hover:bg-green-600 text-white"
                  >
                    {addProductMutation.isPending ? 'Adding Product...' : 'Add Product'}
                  </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Optimization */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Revenue Optimization</CardTitle>
                <CardDescription>Track performance and optimize earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Performance Tracking</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Monitor which products get the most clicks</li>
                      <li>Track conversion rates by category</li>
                      <li>Identify seasonal trending products</li>
                      <li>Analyze mobile vs desktop performance</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">A/B Testing Ideas</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Test different product descriptions</li>
                      <li>Compare image styles (lifestyle vs product)</li>
                      <li>Try different "Pick Now" button colors</li>
                      <li>Test product positioning on homepage</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">Click-Through Rate Tips</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Use urgency words: "Limited time", "Flash sale"</li>
                      <li>Highlight discounts prominently</li>
                      <li>Add social proof with review counts</li>
                      <li>Update bestsellers weekly</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-navy dark:text-blue-400">Seasonal Content Calendar</CardTitle>
                <CardDescription>Plan content for maximum revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">January - March</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>New Year fitness products</li>
                      <li>Valentine's Day gifts (Beauty, Fashion)</li>
                      <li>Holi festival deals</li>
                      <li>Summer prep products</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">April - June</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Summer cooling products</li>
                      <li>Father's Day tech deals</li>
                      <li>Student tech for exams</li>
                      <li>Monsoon prep items</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-navy dark:text-blue-400 mb-2">October - December</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5 space-y-1">
                      <li>Diwali festival shopping</li>
                      <li>Winter clothing collection</li>
                      <li>Year-end tech deals</li>
                      <li>Christmas gifts and decor</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Affiliate Networks Management */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Affiliate Networks</CardTitle>
              <CardDescription>Manage your affiliate partnerships and commission rates</CardDescription>
            </CardHeader>
            <CardContent>
              <AffiliateNetworkManager />
            </CardContent>
          </Card>

          {/* Product Management Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Product Management</CardTitle>
              <CardDescription>Manage all your products with full control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Product List */}
                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400 mb-4">Current Products ({(products as any[]).length})</h4>
                  <div className="grid gap-4">
                    {(products as any[]).map((product: any) => (
                      <ProductManagementCard 
                        key={product.id} 
                        product={product} 
                        onUpdate={() => queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] })}
                        onDelete={() => queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-navy dark:text-blue-400">Daily Management Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Morning Routine (10 min)</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Check affiliate partner sites for new deals</li>
                    <li>Update 2-3 products with current prices</li>
                    <li>Add 1 new product to "Deals" category</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Best Practices</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Always test affiliate links before adding</li>
                    <li>Use high-quality product images</li>
                    <li>Update seasonal content regularly</li>
                    <li>Monitor click-through rates</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-navy dark:text-blue-400">Content Sources</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
                    <li>Amazon Best Sellers & Daily Deals</li>
                    <li>Flipkart Super Deals & Flash Sales</li>
                    <li>Brand websites with affiliate programs</li>
                    <li>Social media trending products</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}