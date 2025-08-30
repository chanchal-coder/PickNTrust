import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState, useEffect } from "react";
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
import { GenderSwitchTabs } from '@/components/gender-switch-tabs';
import CategoryNavigation from '@/components/category-navigation';
import { ProductTimer } from "@/components/product-timer";
import { formatPrice } from '@/utils/currency';

// Universal Subcategories Component - Works for any category
function UniversalSubcategoriesSection({ categoryName }: { categoryName: string }) {
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
  });

  // Find the current category and its subcategories
  const currentCategory = categories.find((cat: any) => cat.name === categoryName);
  const subcategories = categories.filter((cat: any) => cat.parentId === currentCategory?.id);

  // Don't render if no category found or no subcategories
  if (!currentCategory || subcategories.length === 0) {
    return null;
  }

  // Dynamic color scheme based on category
  const getColorScheme = (categoryName: string) => {
    const schemes = {
      'Apps & AI Apps': {
        bg: 'from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20',
        title: 'from-green-600 via-emerald-600 to-teal-600',
        description: 'cutting-edge applications and AI-powered tools'
      },
      'Fashion & Clothing': {
        bg: 'from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-pink-900/20 dark:to-purple-900/20',
        title: 'from-pink-600 via-purple-600 to-indigo-600',
        description: 'stylish fashion and clothing options'
      },
      'Electronics & Gadgets': {
        bg: 'from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-cyan-900/20',
        title: 'from-blue-600 via-cyan-600 to-teal-600',
        description: 'latest electronics and innovative gadgets'
      },
      'Health & Beauty': {
        bg: 'from-rose-50 via-pink-50 to-red-50 dark:from-gray-900 dark:via-rose-900/20 dark:to-pink-900/20',
        title: 'from-rose-600 via-pink-600 to-red-600',
        description: 'health and beauty essentials'
      },
      'Home & Kitchen': {
        bg: 'from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-amber-900/20',
        title: 'from-orange-600 via-amber-600 to-yellow-600',
        description: 'home and kitchen essentials'
      }
    };
    
    return schemes[categoryName as keyof typeof schemes] || {
      bg: 'from-gray-50 via-slate-50 to-zinc-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700',
      title: 'from-gray-600 via-slate-600 to-zinc-600',
      description: `explore ${categoryName.toLowerCase()} options`
    };
  };

  const colorScheme = getColorScheme(categoryName);

  return (
    <section className={`py-12 bg-gradient-to-br ${colorScheme.bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${colorScheme.title} bg-clip-text text-transparent mb-4`}>
            {categoryName} Categories
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Explore our collection of {colorScheme.description}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {subcategories.map((subcategory: any) => (
            <Link 
              key={subcategory.id}
              href={`/category/${encodeURIComponent(subcategory.name)}`}
              className="group block"
            >
              <div 
                className="relative overflow-hidden rounded-2xl p-4 sm:p-6 text-center h-32 sm:h-36 flex flex-col justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${subcategory.color || '#6366F1'}CC, ${subcategory.color || '#6366F1'}FF)`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  <div className="mb-2">
                    <i className={`${subcategory.icon || 'fas fa-cube'} text-xl sm:text-2xl text-white drop-shadow-lg`}></i>
                  </div>
                  <h3 className="text-white font-bold text-xs sm:text-sm mb-1 leading-tight">
                    {subcategory.name}
                  </h3>
                  <p className="text-white/80 text-xs leading-tight">
                    {subcategory.description || 'Explore this category'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Define Product type locally to avoid schema conflicts
interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  originalPrice: string | null;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  affiliateNetworkId?: number | null;
  affiliateNetworkName?: string | null;
  category: string;
  gender?: string | null;
  rating: string;
  reviewCount: number;
  discount?: number | null;
  isNew: boolean;
  isFeatured: boolean;
  hasTimer?: boolean;
  timerDuration?: number | null;
  timerStartTime?: Date | null;
  createdAt?: Date | null;
  pricingType?: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
  isFree?: boolean;
  priceDescription?: string;
  isService?: boolean;
  isAIApp?: boolean;
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState<'products' | 'services' | 'aiapps'>('products');
  const [productUrl, setProductUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProduct, setManualProduct] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    currency: 'INR',
    category: category ? decodeURIComponent(category) : '',
    gender: '',
    rating: '4.0',
    reviewCount: '100',
    imageUrl: '',
    affiliateUrl: '',
    isFeatured: false,
    isService: false,
    isAIApp: false,
    hasTimer: false,
    timerDuration: '24',
    isAvailable: true,
    discount: '',
    customFields: {} as Record<string, string>,
    // Service-specific fields
    pricingType: 'one-time',
    monthlyPrice: '',
    yearlyPrice: '',
    isFree: false,
    priceDescription: ''
  });
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Gender filtering state - using title case for consistency
  const [currentGender, setCurrentGender] = useState('Men');
  
  // Categories that require gender filtering
  const genderSpecificCategories = [
    'Fashion & Clothing',
    'Health & Beauty', 
    'Jewelry & Watches',
    'Baby & Kids'
  ];

  const decodedCategory = category ? decodeURIComponent(category) : '';
  const isGenderSpecific = genderSpecificCategories.includes(decodedCategory);

  // Helper function to normalize gender values
  const normalizeGender = (gender: string): string => {
    const genderMap: { [key: string]: string } = {
      'men': 'Men',
      'women': 'Women', 
      'kids': 'Kids',
      'boys': 'Boys',
      'girls': 'Girls'
    };
    return genderMap[gender.toLowerCase()] || gender;
  };

  // Get gender from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const genderParam = urlParams.get('gender');
    
    // Check if this is a baby category
    const isBabyCategory = decodedCategory.toLowerCase().includes('baby') || decodedCategory.toLowerCase().includes('kids');
    
    if (genderParam) {
      const normalizedGender = normalizeGender(genderParam);
      
      if (isBabyCategory && ['Boys', 'Girls'].includes(normalizedGender)) {
        setCurrentGender(normalizedGender);
      } else if (!isBabyCategory && ['Men', 'Women', 'Kids', 'Boys', 'Girls'].includes(normalizedGender)) {
        // If kids is selected, automatically switch to boys
        if (normalizedGender === 'Kids') {
          setCurrentGender('Boys');
        } else {
          setCurrentGender(normalizedGender);
        }
      }
    } else {
      // Set default gender based on category type
      if (isBabyCategory) {
        setCurrentGender('Boys');
      } else {
        setCurrentGender('Men');
      }
    }
    
    // Scroll to top when category changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, decodedCategory]);

  // Clear any previous state when category changes and scroll to top
  useEffect(() => {
    setShowShareMenu({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category]);
  
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/category', category, currentGender],
    queryFn: async (): Promise<Product[]> => {
      if (!category) throw new Error('No category specified');
      let url = `/api/products/category/${encodeURIComponent(category)}`;
      if (isGenderSpecific) {
        url += `?gender=${currentGender}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
      return response.json();
    },
    enabled: !!category,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all categories for navigation
  const { data: allCategories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
    queryFn: async (): Promise<string[]> => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      const response = await fetch('/api/affiliate/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to track affiliate click');
      }
      return response.json();
    },
  });

  const handleAffiliateClick = (product: Product) => {
    trackAffiliateMutation.mutate({
      productId: product.id,
      affiliateUrl: product.affiliateUrl
    });
    
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  // Delete product mutation with secure admin authentication and comprehensive cache invalidation
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
        description: 'Product has been removed from everywhere on the website.',
      });
      
      // Comprehensive cache invalidation - remove from ALL locations
      // Invalidate all product-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/services'] });
      
      // Invalidate all category-specific queries
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === '/api/products/category' 
      });
      
      // Invalidate admin stats and management queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Force refetch of current page data
      queryClient.refetchQueries({ queryKey: ['/api/products/category', category, currentGender] });
      
      // Clear all cached product data to ensure fresh fetch
      queryClient.removeQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].includes('/api/products')
      });
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
          gender: isGenderSpecific ? currentGender : null,
          isService: activeProductTab === 'services',
        });
        setShowPreview(true);
        setIsEditingPreview(false);
        
        toast({
          title: `${activeProductTab === 'services' ? 'Service' : 'Product'} Details Extracted!`,
          description: 'Review the details below and click "Add" to confirm.',
        });
      } else {
        toast({
          title: 'Extraction Failed',
          description: extractResult.message || `Could not extract ${activeProductTab === 'services' ? 'service' : 'product'} details from this URL.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Extraction Error',
        description: `Failed to extract ${activeProductTab === 'services' ? 'service' : 'product'} details. Please try again.`,
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
        throw new Error(`Failed to add ${activeProductTab === 'services' ? 'service' : 'product'}`);
      }

      toast({
        title: `${activeProductTab === 'services' ? 'Service' : 'Product'} Added!`,
        description: `${activeProductTab === 'services' ? 'Service' : 'Product'} has been added to the catalog successfully.`,
      });

      // Reset all states
      setShowAddModal(false);
      setShowPreview(false);
      setProductUrl('');
      setExtractedProduct(null);
      setIsEditingPreview(false);
      setCustomFields([]);
      
      // Refresh category products and featured products
      queryClient.invalidateQueries({ queryKey: ['/api/products/category', category] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to add ${activeProductTab === 'services' ? 'service' : 'product'}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Add custom field
  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  // Remove custom field
  const removeCustomField = (index: number) => {
    const newFields = customFields.filter((_, i) => i !== index);
    setCustomFields(newFields);
    
    // Update manualProduct customFields
    const updatedCustomFields = { ...manualProduct.customFields };
    const fieldToRemove = customFields[index];
    if (fieldToRemove.key) {
      delete updatedCustomFields[fieldToRemove.key];
    }
    setManualProduct({ ...manualProduct, customFields: updatedCustomFields });
  };

  // Update custom field
  const updateCustomField = (index: number, key: string, value: string) => {
    const newFields = [...customFields];
    const oldKey = newFields[index].key;
    newFields[index] = { key, value };
    setCustomFields(newFields);
    
    // Update manualProduct customFields
    const updatedCustomFields = { ...manualProduct.customFields };
    if (oldKey && oldKey !== key) {
      delete updatedCustomFields[oldKey];
    }
    if (key) {
      updatedCustomFields[key] = value;
    }
    setManualProduct({ ...manualProduct, customFields: updatedCustomFields });
  };

  // Add manual product
  const addManualProduct = async () => {
    // Enhanced validation for services vs products vs AI apps
    if (!manualProduct.name || !manualProduct.affiliateUrl) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in ${activeProductTab === 'services' ? 'service' : activeProductTab === 'aiapps' ? 'AI app' : 'product'} name and URL.`,
        variant: 'destructive',
      });
      return;
    }

    // Price validation - different logic for services/AI apps vs products
    if (activeProductTab === 'services' || activeProductTab === 'aiapps') {
      // For services, price is only required if it's not free and pricing type requires it
      if (!manualProduct.isFree) {
        const needsPrice = manualProduct.pricingType === 'one-time' || manualProduct.pricingType === 'custom';
        const needsMonthlyPrice = manualProduct.pricingType === 'monthly' || manualProduct.pricingType === 'custom';
        const needsYearlyPrice = manualProduct.pricingType === 'yearly' || manualProduct.pricingType === 'custom';
        
        if (needsPrice && !manualProduct.price) {
          toast({
            title: 'Validation Error',
            description: 'Price is required for this pricing type',
            variant: 'destructive',
          });
          return;
        }
        
        if (needsMonthlyPrice && !manualProduct.monthlyPrice) {
          toast({
            title: 'Validation Error',
            description: 'Monthly price is required for this pricing type',
            variant: 'destructive',
          });
          return;
        }
        
        if (needsYearlyPrice && !manualProduct.yearlyPrice) {
          toast({
            title: 'Validation Error',
            description: 'Yearly price is required for this pricing type',
            variant: 'destructive',
          });
          return;
        }
      }
    } else {
      // For products, price is always required
      if (!manualProduct.price) {
        toast({
          title: 'Missing Required Fields',
          description: 'Product price is required',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      // Clean and prepare the payload with proper field handling
      const cleanPrice = manualProduct.price ? manualProduct.price.toString().replace(/[^\d.]/g, '') : '0';
      const cleanOriginalPrice = manualProduct.originalPrice ? manualProduct.originalPrice.toString().replace(/[^\d.]/g, '') : null;
      
      // Prepare customFields - convert object to JSON string for storage
      const customFieldsJson = Object.keys(manualProduct.customFields || {}).length > 0 
        ? JSON.stringify(manualProduct.customFields) 
        : null;

      const payload = {
        password: 'pickntrust2025',
        name: manualProduct.name.trim(),
        description: manualProduct.description?.trim() || '',
        price: parseFloat(cleanPrice) || 0,
        originalPrice: cleanOriginalPrice ? parseFloat(cleanOriginalPrice) : null,
        currency: manualProduct.currency || 'INR',
        imageUrl: manualProduct.imageUrl?.trim() || '',
        affiliateUrl: manualProduct.affiliateUrl?.trim() || '',
        category: manualProduct.category || '',
        gender: manualProduct.gender || null,
        rating: parseFloat(manualProduct.rating) || 4.5,
        reviewCount: parseInt(manualProduct.reviewCount) || 100,
        discount: manualProduct.discount ? parseInt(manualProduct.discount.toString()) : null,
        isFeatured: Boolean(manualProduct.isFeatured),
        isService: activeProductTab === 'services',
        isAIApp: activeProductTab === 'aiapps',
        isNew: false,
        hasTimer: Boolean(manualProduct.hasTimer),
        timerDuration: manualProduct.hasTimer ? parseInt(manualProduct.timerDuration?.toString() || '24') : null,
        customFields: customFieldsJson,
        
        // Service/AI App-specific fields - include for services and AI apps
        pricingType: (activeProductTab === 'services' || activeProductTab === 'aiapps') ? (manualProduct.pricingType || 'one-time') : null,
        monthlyPrice: (activeProductTab === 'services' || activeProductTab === 'aiapps') && manualProduct.monthlyPrice ? parseFloat(manualProduct.monthlyPrice.toString().replace(/[^\d.]/g, '')) : null,
        yearlyPrice: (activeProductTab === 'services' || activeProductTab === 'aiapps') && manualProduct.yearlyPrice ? parseFloat(manualProduct.yearlyPrice.toString().replace(/[^\d.]/g, '')) : null,
        isFree: (activeProductTab === 'services' || activeProductTab === 'aiapps') ? Boolean(manualProduct.isFree) : false,
        priceDescription: (activeProductTab === 'services' || activeProductTab === 'aiapps') ? (manualProduct.priceDescription?.trim() || null) : null,
      };

      console.log('Submitting manual product/service with cleaned data:', payload);

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to add ${activeProductTab === 'services' ? 'service' : activeProductTab === 'aiapps' ? 'AI app' : 'product'}: ${errorText}`);
      }

      toast({
        title: `${activeProductTab === 'services' ? 'Service' : activeProductTab === 'aiapps' ? 'AI App' : 'Product'} Added!`,
        description: `Manual ${activeProductTab === 'services' ? 'service' : activeProductTab === 'aiapps' ? 'AI app' : 'product'} has been added to the catalog successfully.`,
      });

      // Reset all states
      setShowAddModal(false);
      setShowManualForm(false);
      setManualProduct({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        currency: 'INR',
        category: category ? decodeURIComponent(category) : '',
        gender: '',
        rating: '4.0',
        reviewCount: '100',
        imageUrl: '',
        affiliateUrl: '',
        isFeatured: false,
        isService: false,
        isAIApp: false,
        hasTimer: false,
        timerDuration: '24',
        isAvailable: true,
        discount: '',
        customFields: {},
        pricingType: 'one-time',
        monthlyPrice: '',
        yearlyPrice: '',
        isFree: false,
        priceDescription: ''
      });
      setCustomFields([]);
      
      // Refresh category products and featured products
      queryClient.invalidateQueries({ queryKey: ['/api/products/category', category] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    } catch (error: any) {
      console.error('Error adding manual product/service:', error);
      toast({
        title: 'Error',
        description: `Failed to add manual ${activeProductTab === 'services' ? 'service' : 'product'}. ${error.message || 'Please try again.'}`,
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
        shareUrl = `https://www.facebook.com/profile.php?id=61578969445670`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/+m-O-S6SSpVU2NWU1`;
        break;
      case 'twitter':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(productText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case 'whatsapp':
        // Try to open channel admin interface for posting
        shareUrl = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
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
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl text-navy dark:text-blue-400">
                          Add {activeProductTab === 'services' ? 'Service' : activeProductTab === 'aiapps' ? 'AI App' : 'Product'} to {categoryInfo.title}
                        </DialogTitle>
                        <DialogDescription>
                          Add a new {activeProductTab === 'services' ? 'service' : activeProductTab === 'aiapps' ? 'AI app' : 'product'} by extracting details from a URL or entering manually
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* Product/Service/AI Apps Toggle */}
                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <button
                            onClick={() => {
                              setActiveProductTab('products');
                              setManualProduct({
                                ...manualProduct,
                                isService: false,
                                isAIApp: false,
                                pricingType: 'one-time'
                              });
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                              activeProductTab === 'products'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            <i className="fas fa-box"></i>
                            Product
                          </button>
                          <button
                            onClick={() => {
                              setActiveProductTab('services');
                              setManualProduct({
                                ...manualProduct,
                                isService: true,
                                isAIApp: false,
                                pricingType: 'subscription'
                              });
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                              activeProductTab === 'services'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            <i className="fas fa-cogs"></i>
                            Service
                          </button>
                          <button
                            onClick={() => {
                              setActiveProductTab('aiapps');
                              setManualProduct({
                                ...manualProduct,
                                isService: false,
                                isAIApp: true,
                                pricingType: 'monthly'
                              });
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
                              activeProductTab === 'aiapps'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            <i className="fas fa-robot"></i>
                            AI App
                          </button>
                        </div>

                        {/* URL Extraction Section */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg text-bright-blue">
                              🔗 Auto-Extract from URL
                            </CardTitle>
                            <CardDescription>
                              Paste a {activeProductTab === 'services' ? 'service' : activeProductTab === 'aiapps' ? 'AI app' : 'product'} URL to automatically extract details
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="product-url">{activeProductTab === 'services' ? 'Service' : activeProductTab === 'aiapps' ? 'AI App' : 'Product'} URL</Label>
                              <Input
                                id="product-url"
                                type="url"
                                value={productUrl}
                                onChange={(e) => setProductUrl(e.target.value)}
                                placeholder="https://example.com/product-or-service-link"
                                className="text-base"
                              />
                            </div>
                            <Button 
                              onClick={extractProductDetails}
                              disabled={isExtracting || !productUrl.trim()}
                              className="bg-bright-blue hover:bg-navy text-white"
                            >
                              {isExtracting ? 'Extracting...' : `Extract ${activeProductTab === 'services' ? 'Service' : activeProductTab === 'aiapps' ? 'AI App' : 'Product'} Details`}
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Extracted Product Preview */}
                        {showPreview && extractedProduct && (
                          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                            <CardHeader>
                              <CardTitle className="text-green-800 dark:text-green-300">
                                ✅ {activeProductTab === 'services' ? 'Service' : 'Product'} Details Extracted
                              </CardTitle>
                              <CardDescription>Review and edit details before adding to catalog</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-navy dark:text-blue-400">{activeProductTab === 'services' ? 'Service' : 'Product'} Name</h4>
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
                                    <h4 className="font-semibold text-navy dark:text-blue-400">{activeProductTab === 'services' ? 'Service' : 'Product'} Image</h4>
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
                              
                              <div className="flex gap-3 mt-6 pt-4 border-t">
                                <Button
                                  onClick={addExtractedProduct}
                                  className="bg-accent-green hover:bg-green-600 text-white"
                                >
                                  ✓ Add {activeProductTab === 'services' ? 'Service' : 'Product'} to Catalog
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
                            {showManualForm ? 'Hide Manual Entry' : `Or Add ${activeProductTab === 'services' ? 'Service' : 'Product'} Manually`}
                          </Button>
                        </div>

                        {showManualForm && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg text-navy dark:text-blue-400">
                                ✍️ Manual {activeProductTab === 'services' ? 'Service' : activeProductTab === 'aiapps' ? 'AI App' : 'Product'} Entry
                              </CardTitle>
                              <CardDescription>
                                Enter {activeProductTab === 'services' ? 'service' : activeProductTab === 'aiapps' ? 'AI app' : 'product'} details manually for {categoryInfo.title}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="manual-name">{activeProductTab === 'services' ? 'Service' : activeProductTab === 'aiapps' ? 'AI App' : 'Product'} Name *</Label>
                                    <Input
                                      id="manual-name"
                                      value={manualProduct.name}
                                      onChange={(e) => setManualProduct({...manualProduct, name: e.target.value})}
                                      placeholder={`Enter ${activeProductTab === 'services' ? 'service' : activeProductTab === 'aiapps' ? 'AI app' : 'product'} name`}
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="manual-price">
                                      Price (₹) {activeProductTab === 'products' ? '*' : ''}
                                    </Label>
                                    <Input
                                      id="manual-price"
                                      type="number"
                                      value={manualProduct.price}
                                      onChange={(e) => setManualProduct({...manualProduct, price: e.target.value})}
                                      placeholder="999"
                                      required={activeProductTab === 'products'}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="manual-description">Description</Label>
                                  <Textarea
                                    id="manual-description"
                                    value={manualProduct.description}
                                    onChange={(e) => setManualProduct({...manualProduct, description: e.target.value})}
                                    placeholder={`Enter ${activeProductTab === 'services' ? 'service' : 'product'} description`}
                                    rows={3}
                                  />
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                  <div>
                                    <Label htmlFor="manual-original-price">Original Price (₹)</Label>
                                    <Input
                                      id="manual-original-price"
                                      type="number"
                                      value={manualProduct.originalPrice}
                                      onChange={(e) => setManualProduct({...manualProduct, originalPrice: e.target.value})}
                                      placeholder="1299"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="manual-discount">Discount (%)</Label>
                                    <Input
                                      id="manual-discount"
                                      type="number"
                                      value={manualProduct.discount}
                                      onChange={(e) => setManualProduct({...manualProduct, discount: e.target.value})}
                                      placeholder="25"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="manual-category">Category</Label>
                                    <Input
                                      id="manual-category"
                                      value={manualProduct.category}
                                      onChange={(e) => setManualProduct({...manualProduct, category: e.target.value})}
                                      placeholder="Electronics & Gadgets"
                                    />
                                  </div>
                                </div>

                                {/* Gender field - Only show for gender-specific categories */}
                                {isGenderSpecific && (
                                  <div>
                                    <Label htmlFor="manual-gender">Gender Category</Label>
                                    <Select 
                                      value={manualProduct.gender} 
                                      onValueChange={(value) => setManualProduct({...manualProduct, gender: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select gender category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Men">
                                          <div className="flex items-center">
                                            <i className="fas fa-male mr-2 text-blue-500"></i>
                                            Men
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="Women">
                                          <div className="flex items-center">
                                            <i className="fas fa-female mr-2 text-pink-500"></i>
                                            Women
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="Boys">
                                          <div className="flex items-center">
                                            <i className="fas fa-child mr-2 text-blue-400"></i>
                                            Boys
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="Girls">
                                          <div className="flex items-center">
                                            <i className="fas fa-child mr-2 text-pink-400"></i>
                                            Girls
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="Kids">
                                          <div className="flex items-center">
                                            <i className="fas fa-child mr-2 text-green-500"></i>
                                            Kids
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="manual-rating">Rating</Label>
                                    <Input
                                      id="manual-rating"
                                      type="number"
                                      min="1"
                                      max="5"
                                      step="0.1"
                                      value={manualProduct.rating}
                                      onChange={(e) => setManualProduct({...manualProduct, rating: e.target.value})}
                                      placeholder="4.0"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="manual-review-count">Review Count</Label>
                                    <Input
                                      id="manual-review-count"
                                      type="number"
                                      value={manualProduct.reviewCount}
                                      onChange={(e) => setManualProduct({...manualProduct, reviewCount: e.target.value})}
                                      placeholder="100"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="manual-image-url">{activeProductTab === 'services' ? 'Service' : 'Product'} Image URL</Label>
                                  <Input
                                    id="manual-image-url"
                                    type="url"
                                    value={manualProduct.imageUrl}
                                    onChange={(e) => setManualProduct({...manualProduct, imageUrl: e.target.value})}
                                    placeholder="https://example.com/image.jpg"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="manual-affiliate-url">{activeProductTab === 'services' ? 'Service' : 'Product'} URL *</Label>
                                  <Input
                                    id="manual-affiliate-url"
                                    type="url"
                                    value={manualProduct.affiliateUrl}
                                    onChange={(e) => setManualProduct({...manualProduct, affiliateUrl: e.target.value})}
                                    placeholder={`https://example.com/${activeProductTab === 'services' ? 'service' : 'product'}-link`}
                                    required
                                  />
                                </div>

                                {/* Service/AI App-Specific Pricing Fields */}
                                {(activeProductTab === 'services' || activeProductTab === 'aiapps') && (
                                  <div className="space-y-4 border-t pt-4">
                                    <h4 className={`text-lg font-semibold ${activeProductTab === 'services' ? 'text-purple-600' : 'text-green-600'}`}>
                                      {activeProductTab === 'services' ? 'Service' : 'AI App'} Pricing Options
                                    </h4>
                                    
                                    {/* Pricing Type */}
                                    <div>
                                      <Label htmlFor="pricing-type">Pricing Type</Label>
                                      <Select 
                                        value={manualProduct.pricingType} 
                                        onValueChange={(value) => setManualProduct({...manualProduct, pricingType: value})}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select pricing type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="one-time">One-time Payment</SelectItem>
                                          <SelectItem value="monthly">Monthly Subscription</SelectItem>
                                          <SelectItem value="yearly">Yearly Subscription</SelectItem>
                                          <SelectItem value="free">Free {activeProductTab === 'services' ? 'Service' : 'AI App'}</SelectItem>
                                          <SelectItem value="custom">Custom Pricing</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Free Service/AI App Toggle */}
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="manual-free"
                                        checked={manualProduct.isFree}
                                        onChange={(e) => setManualProduct({...manualProduct, isFree: e.target.checked})}
                                        className="rounded"
                                      />
                                      <Label htmlFor="manual-free">Free {activeProductTab === 'services' ? 'Service' : 'AI App'}</Label>
                                    </div>

                                    {/* Additional Pricing Fields for Services */}
                                    {!manualProduct.isFree && (
                                      <div className="grid md:grid-cols-2 gap-4">
                                        {(manualProduct.pricingType === 'monthly' || manualProduct.pricingType === 'custom') && (
                                          <div>
                                            <Label htmlFor="monthly-price">Monthly Price (₹)</Label>
                                            <Input
                                              id="monthly-price"
                                              type="number"
                                              value={manualProduct.monthlyPrice}
                                              onChange={(e) => setManualProduct({...manualProduct, monthlyPrice: e.target.value})}
                                              placeholder="299"
                                            />
                                          </div>
                                        )}
                                        
                                        {(manualProduct.pricingType === 'yearly' || manualProduct.pricingType === 'custom') && (
                                          <div>
                                            <Label htmlFor="yearly-price">Yearly Price (₹)</Label>
                                            <Input
                                              id="yearly-price"
                                              type="number"
                                              value={manualProduct.yearlyPrice}
                                              onChange={(e) => setManualProduct({...manualProduct, yearlyPrice: e.target.value})}
                                              placeholder="2999"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Price Description */}
                                    <div>
                                      <Label htmlFor="price-description">Price Description (Optional)</Label>
                                      <Input
                                        id="price-description"
                                        value={manualProduct.priceDescription}
                                        onChange={(e) => setManualProduct({...manualProduct, priceDescription: e.target.value})}
                                        placeholder="e.g., Starting from, Per user, One-time setup fee"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">Optional description to clarify pricing structure</p>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-4">
                                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Options & Features</h4>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="manual-featured"
                                        checked={manualProduct.isFeatured}
                                        onChange={(e) => setManualProduct({...manualProduct, isFeatured: e.target.checked})}
                                        className="rounded"
                                      />
                                      <Label htmlFor="manual-featured">Featured Product</Label>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="manual-timer"
                                        checked={manualProduct.hasTimer}
                                        onChange={(e) => setManualProduct({...manualProduct, hasTimer: e.target.checked})}
                                        className="rounded"
                                      />
                                      <Label htmlFor="manual-timer">Add Countdown Timer</Label>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="manual-service"
                                        checked={manualProduct.isService}
                                        onChange={(e) => setManualProduct({...manualProduct, isService: e.target.checked})}
                                        className="rounded"
                                      />
                                      <Label htmlFor="manual-service">Mark as Service</Label>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id="manual-aiapp"
                                        checked={manualProduct.isAIApp}
                                        onChange={(e) => setManualProduct({...manualProduct, isAIApp: e.target.checked})}
                                        className="rounded"
                                      />
                                      <Label htmlFor="manual-aiapp">Mark as AI App</Label>
                                    </div>
                                  </div>
                                </div>

                                {manualProduct.hasTimer && (
                                  <div>
                                    <Label htmlFor="manual-timer-duration">Timer Duration (hours)</Label>
                                    <Input
                                      id="manual-timer-duration"
                                      type="number"
                                      value={manualProduct.timerDuration}
                                      onChange={(e) => setManualProduct({...manualProduct, timerDuration: e.target.value})}
                                      placeholder="24"
                                    />
                                  </div>
                                )}

                                {/* Custom Fields Section */}
                                <div className="border-t pt-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <Label className="text-lg font-semibold text-navy dark:text-blue-400">Custom Fields</Label>
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
                                            <Label htmlFor={`custom-key-${index}`}>Field Name</Label>
                                            <Input
                                              id={`custom-key-${index}`}
                                              value={field.key}
                                              onChange={(e) => updateCustomField(index, e.target.value, field.value)}
                                              placeholder="e.g., Brand, Color, Size"
                                              className="text-sm"
                                            />
                                          </div>
                                          <div className="flex-1">
                                            <Label htmlFor={`custom-value-${index}`}>Field Value</Label>
                                            <Input
                                              id={`custom-value-${index}`}
                                              value={field.value}
                                              onChange={(e) => updateCustomField(index, field.key, e.target.value)}
                                              placeholder="e.g., Nike, Red, Large"
                                              className="text-sm"
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
                                      No custom fields added. Click "Add Custom Field" to add {activeProductTab === 'services' ? 'service' : activeProductTab === 'aiapps' ? 'AI app' : 'product'}-specific information.
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                  <Button
                                    onClick={addManualProduct}
                                    className="bg-accent-green hover:bg-green-600 text-white"
                                  >
                                    ✓ Add {activeProductTab === 'services' ? 'Service' : activeProductTab === 'aiapps' ? 'AI App' : 'Product'} to Catalog
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowManualForm(false);
                                      setManualProduct({
                                        name: '',
                                        description: '',
                                        price: '',
                                        originalPrice: '',
                                        currency: 'INR',
                                        category: category ? decodeURIComponent(category) : '',
                                        gender: '',
                                        rating: '4.0',
                                        reviewCount: '100',
                                        imageUrl: '',
                                        affiliateUrl: '',
                                        isFeatured: false,
                                        isService: false,
                                        isAIApp: false,
                                        hasTimer: false,
                                        timerDuration: '24',
                                        isAvailable: true,
                                        discount: '',
                                        customFields: {},
                                        pricingType: 'one-time',
                                        monthlyPrice: '',
                                        yearlyPrice: '',
                                        isFree: false,
                                        priceDescription: ''
                                      });
                                      setCustomFields([]);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
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

        {/* Gender Switch Tabs - Only for gender-specific categories */}
        {isGenderSpecific && (
          <section className="py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <GenderSwitchTabs 
                currentGender={currentGender}
                onGenderChange={setCurrentGender}
                categoryName={decodedCategory}
              />
            </div>
          </section>
        )}

        {/* Category Navigation Tabs */}
        <CategoryNavigation currentCategory={category || ''} />

        {/* Universal Subcategories - Dynamic loading for any category */}
        <UniversalSubcategoriesSection categoryName={decodedCategory} />

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
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded w-full text-left"
                                >
                                  <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">𝕏</span>
                                  </div>
                                  X (Twitter)
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
                          {/* Enhanced pricing display for services */}
                          {(product as any).isFree || ((product as any).pricingType === 'free') ? (
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">FREE</span>
                          ) : (product as any).priceDescription ? (
                            <span className="text-2xl font-bold text-navy dark:text-blue-400">{(product as any).priceDescription}</span>
                          ) : (product as any).monthlyPrice && (product as any).monthlyPrice !== '0' ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-navy dark:text-blue-400">{formatPrice((product as any).monthlyPrice, (product as any).currency || 'INR')}/month</span>
                              {product.originalPrice && (
                                <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice, (product as any).currency || 'INR')}/month</span>
                              )}
                            </div>
                          ) : (product as any).yearlyPrice && (product as any).yearlyPrice !== '0' ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-navy dark:text-blue-400">{formatPrice((product as any).yearlyPrice, (product as any).currency || 'INR')}/year</span>
                              {product.originalPrice && (
                                <span className="text-gray-400 line-through text-sm">{formatPrice(product.originalPrice, (product as any).currency || 'INR')}/year</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {/* For regular price, check pricingType to determine suffix */}
                              {(product as any).pricingType === 'monthly' ? (
                                <span className="text-2xl font-bold text-navy dark:text-blue-400">{formatPrice(product.price, (product as any).currency || 'INR')}/month</span>
                              ) : (product as any).pricingType === 'yearly' ? (
                                <span className="text-2xl font-bold text-navy dark:text-blue-400">{formatPrice(product.price, (product as any).currency || 'INR')}/year</span>
                              ) : (
                                <span className="text-2xl font-bold text-navy dark:text-blue-400">{formatPrice(product.price, (product as any).currency || 'INR')}</span>
                              )}
                              {product.originalPrice && (
                                <span className="text-gray-400 line-through ml-2">
                                  {formatPrice(product.originalPrice, (product as any).currency || 'INR')}
                                  {(product as any).pricingType === 'monthly' ? '/month' : (product as any).pricingType === 'yearly' ? '/year' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Timer */}
                      <div className="mb-4">
                        <ProductTimer product={product} />
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
