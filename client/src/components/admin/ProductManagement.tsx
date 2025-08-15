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
  const [isAddingProduct, setIsAddingProduct] = useState(false);
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
    rating: '4.5',
    reviewCount: '100',
    discount: '',
    isFeatured: true
  });

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      return data.products || [];
    },
    retry: 1
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
        rating: '4.5',
        reviewCount: '100',
        discount: '',
        isFeatured: true
      });
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
          rating: extracted.rating || '4.5',
          reviewCount: extracted.reviewCount || '100',
          discount: extracted.discount || '',
          isFeatured: true
        });
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

  return (
    <div className="space-y-6">
      {/* URL Product Extractor */}
      <Card className="border-2 border-dashed border-purple-400 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-5 h-5" />
            Smart Product Extractor
          </CardTitle>
          <CardDescription className="text-blue-200">
            Paste any product URL to automatically extract details (Amazon, eBay, Flipkart, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Paste product URL here (e.g., https://amazon.com/product/...)"
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
          <CardTitle>Add New Product</CardTitle>
          <CardDescription className="text-blue-200">
            Add a new product manually or use the extractor above
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAddingProduct ? (
            <div className="flex gap-4">
              <Button 
                onClick={() => setIsAddingProduct(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Add Product Manually
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g., Wireless Headphones"
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
                    {commonCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
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
                  <label className="block text-sm font-medium mb-2 text-blue-300">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="29.99"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Original Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                    placeholder="39.99"
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                  />
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
          <CardTitle>Manage Products ({products.length})</CardTitle>
          <CardDescription className="text-blue-200">
            View and manage all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No products found. Add your first product above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product: Product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-green-600">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                        )}
                        {product.discount && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>⭐ {product.rating}</span>
                        <span>({product.reviewCount} reviews)</span>
                        {product.isFeatured && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deleteProductMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
