import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link, Sparkles, Loader2 } from 'lucide-react';
import { CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContext';
import { formatPrice as formatCurrencyPrice } from '@/utils/currency';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  isFeatured: boolean;
  isService?: boolean;
  isAIApp?: boolean;
  displayPages?: string[];
  createdAt?: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
  subcategory: string;
  gender: string;
  rating: string;
  reviewCount: string;
  discount: string;
  isFeatured: boolean;
  isService: boolean;
  isAIApp: boolean;
  hasTimer: boolean;
  timerDuration: string;
  pricingType: string;
  monthlyPrice: string;
  yearlyPrice: string;
  isFree: boolean;
  customPricingDetails?: string;
  displayPages: string[];
  customFields: Record<string, string>;
}

interface NavTab {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color_from: string;
  color_to: string;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  description?: string;
}

export default function ProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'apps'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<{[key: number]: boolean}>({});
  const [extractUrl, setExtractUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Helper function to format product price without conversion (displays original currency)
  const formatProductPrice = (price: string | number, productCurrency?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price.toString().replace(/,/g, '')) : price;
    const originalCurrency = (productCurrency as CurrencyCode) || 'INR';
    
    // Always display in the product's original currency (no conversion)
    return formatCurrencyPrice(numPrice, originalCurrency);
  };
  const [newProduct, setNewProduct] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    currency: 'INR',
    imageUrl: '',
    affiliateUrl: '',
    category: '',
    subcategory: '',
    gender: '',
    rating: '4.5',
    reviewCount: '100',
    discount: '',
    isFeatured: true,
    isService: false,
    isAIApp: false,
    hasTimer: false,
    timerDuration: '24',
    // Enhanced service pricing fields
    pricingType: 'one-time',
    monthlyPrice: '',
    yearlyPrice: '',
    isFree: false,
    customPricingDetails: '',
    displayPages: ['home'],
    customFields: {} as Record<string, string>
  });
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  // CSV Bulk Upload state
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkAdminPassword, setBulkAdminPassword] = useState('');
  // Bulk selection state for multi-delete across Products/Services/Apps
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isSelected = (id: number) => selectedIds.includes(id);
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const clearSelection = () => setSelectedIds([]);
  const selectAllVisible = (ids: number[]) => setSelectedIds(ids);

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
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async (): Promise<Product[]> => {
      try {
        console.log('Fetching products from /api/products...');
        const response = await fetch('/api/products');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to fetch products: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        // Handle both array and object responses
        if (Array.isArray(data)) {
          console.log('Data is array, returning:', data.length, 'products');
          return data as Product[];
        } else if (data && data.products && Array.isArray(data.products)) {
          console.log('Data has products array, returning:', data.products.length, 'products');
          return data.products as Product[];
        } else if (data && typeof data === 'object') {
          console.log('Data is object but no products array, returning empty array');
          return [];
        } else {
          console.log('Unexpected data format, returning empty array');
          return [];
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 30000 // 30 seconds
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async () => {
      if (!bulkUploadFile) throw new Error('Please select a CSV file');
      const fd = new FormData();
      fd.append('file', bulkUploadFile);
      if (bulkAdminPassword) {
        fd.append('password', bulkAdminPassword);
      }
      const res = await fetch('/api/admin/products/bulk-upload', {
        method: 'POST',
        body: fd
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Bulk upload failed');
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'CSV Bulk Upload Complete',
        description: `Inserted ${data.inserted}/${data.processed} rows. Failed: ${data.failed}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setBulkUploadFile(null);
    },
    onError: (err: any) => {
      toast({ title: 'Upload Error', description: err?.message || 'Failed to upload CSV', variant: 'destructive' });
    }
  });

  // Fetch navigation tabs for dynamic display pages
  const { data: navTabs = [] } = useQuery<NavTab[]>({
    queryKey: ['/api/nav-tabs'],
    queryFn: async () => {
      // Try direct backend call first, fallback to proxy
      let response;
      try {
        response = await fetch('/api/nav-tabs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });
       } catch (error) {
         console.log('Direct call failed, trying proxy...');
        response = await fetch('/api/nav-tabs');
      }
      
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    staleTime: 0, // Real-time updates
     refetchOnWindowFocus: true, // Refetch when window gains focus
     refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
   });

  // Create dynamic pages array from navigation tabs
  const dynamicPages = [
    { id: 'home', label: '<i className="fas fa-home"></i> Home Page', description: 'Main website' },
    { id: 'trending', label: 'Trending', description: 'Trending products page' },
    // Ensure newly added dynamic pages are available even before backend nav-tabs exist
    { id: 'fresh-picks', label: 'Fresh Picks', description: 'Latest and freshest curated selections' },
    { id: 'artists-corner', label: "Artist's Corner", description: 'Creative picks, art and design highlights' },
    { id: 'ott-hub', label: 'OTT Hub', description: 'Streaming, OTT platforms and entertainment' },
    ...(Array.isArray(navTabs) ? navTabs : [])
      .filter(tab => tab.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(tab => ({
        id: tab.slug,
        label: `${tab.name}`,
        description: tab.description || 'Navigation page'
      }))
  ];

  // Fetch categories dynamically from API
  const { data: allCategories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch product-specific categories for forms (all categories)
  const { data: productCategories = [] } = useQuery({
    queryKey: ['/api/categories/forms/products'],
    queryFn: async () => {
      const response = await fetch('/api/categories/forms/products');
      if (!response.ok) {
        throw new Error('Failed to fetch product categories');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });

  // Fetch service-specific categories for forms (all categories)
  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['/api/categories/forms/services'],
    queryFn: async () => {
      const response = await fetch('/api/categories/forms/services');
      if (!response.ok) {
        throw new Error('Failed to fetch service categories');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });

  // Fetch AI app-specific categories for forms (all categories)
  const { data: aiAppCategories = [] } = useQuery({
    queryKey: ['/api/categories/forms/aiapps'],
    queryFn: async () => {
      const response = await fetch('/api/categories/forms/aiapps');
      if (!response.ok) {
        throw new Error('Failed to fetch AI app categories');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
  });

  // Fetch subcategories for selected category
  const { data: subcategories = [] } = useQuery({
    queryKey: ['/api/categories/subcategories', newProduct.category || ''],
    queryFn: async () => {
      if (!newProduct.category) return [];
      const response = await fetch(`/api/categories/subcategories?parent=${encodeURIComponent(newProduct.category)}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    retry: 1,
    staleTime: 0,
    enabled: !!newProduct.category,
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      // Clean and parse price values safely
      const cleanPrice = productData.price ? productData.price.toString().replace(/[^\d.]/g, '') : '0';
      const cleanOriginalPrice = productData.originalPrice ? productData.originalPrice.toString().replace(/[^\d.]/g, '') : null;
      
      // Prepare customFields - convert object to JSON string for storage
      const customFieldsJson = Object.keys(productData.customFields || {}).length > 0 
        ? JSON.stringify(productData.customFields) 
        : null;
      
      // Clean and parse service pricing fields
      const cleanMonthlyPrice = productData.monthlyPrice ? productData.monthlyPrice.toString().replace(/[^\d.]/g, '') : '';
      const cleanYearlyPrice = productData.yearlyPrice ? productData.yearlyPrice.toString().replace(/[^\d.]/g, '') : '';
      
      // Smart pricing logic: if pricingType is monthly/yearly but specific price field is empty,
      // use the regular price field as the specific price
      let finalMonthlyPrice = cleanMonthlyPrice;
      let finalYearlyPrice = cleanYearlyPrice;
      
      if (productData.pricingType === 'monthly' && !cleanMonthlyPrice && cleanPrice && cleanPrice !== '0') {
        finalMonthlyPrice = cleanPrice;
      }
      
      if (productData.pricingType === 'yearly' && !cleanYearlyPrice && cleanPrice && cleanPrice !== '0') {
        finalYearlyPrice = cleanPrice;
      }
      
      const payload = {
        password: 'pickntrust2025',
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: parseFloat(cleanPrice) || 0,
        originalPrice: cleanOriginalPrice ? parseFloat(cleanOriginalPrice) : null,
        currency: productData.currency || 'INR',
        imageUrl: productData.imageUrl.trim(),
        affiliateUrl: productData.affiliateUrl.trim(),
        category: productData.category,
        subcategory: productData.subcategory || null,
        gender: productData.gender || null,
        rating: parseFloat(productData.rating) || 4.5,
        reviewCount: parseInt(productData.reviewCount) || 100,
        discount: productData.discount ? parseInt(productData.discount) : null,
        isFeatured: Boolean(productData.isFeatured),
        isService: Boolean(productData.isService),
        isAIApp: Boolean(productData.isAIApp),
        isNew: false,
        hasTimer: Boolean(productData.hasTimer),
        timerDuration: productData.hasTimer ? parseInt(productData.timerDuration) : null,
        customFields: customFieldsJson,
        
        // Enhanced service pricing fields with smart fallback
        pricingType: productData.pricingType || 'one-time',
        monthlyPrice: finalMonthlyPrice || null,
        yearlyPrice: finalYearlyPrice || null,
        isFree: Boolean(productData.isFree),
        priceDescription: productData.customPricingDetails?.trim() || null,
        
        // Display pages selection: ensure 'apps' is included when App is checked
        displayPages: Array.from(new Set([...(productData.displayPages || []), Boolean(productData.isAIApp) ? 'apps' : null].filter(Boolean)))
      };

      console.log('Sending product data:', payload);

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
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Failed to add product' };
        }
        throw new Error(errorData.message || 'Failed to add product');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      // Also invalidate categories to refresh the dropdown
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories/services'] });
      // Invalidate AI Apps products to refresh Apps & AI Apps section
      queryClient.invalidateQueries({ queryKey: ['/api/products/apps'] });
      // Also invalidate the page-scoped Apps & AI endpoint used by the Apps page
      queryClient.invalidateQueries({ queryKey: ['/api/products/page/apps-ai-apps'] });
      // Also invalidate with daily rotation offset for home page
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === '/api/products/apps' 
      });
      // Invalidate apps page query
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === '/api/apps/all-pages' 
      });
      // Invalidate featured and service products as well
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/services'] });
      // Invalidate home page featured products (top-picks)
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === '/api/products/page/top-picks' 
      });
      // Invalidate home page services
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === '/api/services' 
      });
      
      // Invalidate all page-specific queries for real-time updates
      const pages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'deals-hub', 'loot-box', 'top-picks', 'global-picks', 'trending'];
      pages.forEach(page => {
        queryClient.invalidateQueries({ queryKey: [`/api/products/page/${page}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/categories/page/${page}`] });
      });
      
      // Trigger Canva automation for the newly added product/service
      if (data && data.id) {
        try {
          // Determine content type based on whether it's a service or product
          const contentType = newProduct.isService || activeTab === 'services' ? 'service' : 'product';
          console.log(`<i className="fas fa-palette"></i> Triggering Canva automation for new ${contentType}:`, data.id);
          const password = localStorage.getItem('adminPassword') || 'pickntrust2025';
          const canvaResponse = await fetch('/api/admin/canva/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              password, 
              contentType, 
              contentId: data.id 
            })
          });
          
          if (canvaResponse.ok) {
            const canvaResult = await canvaResponse.json();
            console.log('<i className="fas fa-check-circle"></i> Canva automation triggered successfully:', canvaResult);
            toast({
              title: '<i className="fas fa-palette"></i> Automation Triggered!',
              description: 'Product added and Canva automation started for social media posting.',
            });
          } else {
            console.log('<i className="fas fa-exclamation-triangle"></i> Canva automation failed, but product was added successfully');
            toast({
              title: 'Product Added <i className="fas fa-check-circle"></i>',
              description: 'Product added successfully! (Canva automation may be disabled)',
            });
          }
        } catch (canvaError) {
          console.log('<i className="fas fa-exclamation-triangle"></i> Canva automation error:', canvaError);
          toast({
            title: 'Product Added <i className="fas fa-check-circle"></i>',
            description: 'Product added successfully! (Canva automation encountered an issue)',
          });
        }
      } else {
        toast({
          title: 'Success',
          description: 'Product added successfully!',
        });
      }
      
      setNewProduct({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        currency: 'INR',
        imageUrl: '',
        affiliateUrl: '',
        category: '',
      subcategory: '',
        gender: '',
        rating: '4.5',
        reviewCount: '100',
        discount: '',
        isFeatured: true,
        isService: false,
        isAIApp: false,
        hasTimer: false,
        timerDuration: '24',
        // Enhanced service pricing fields
        pricingType: 'one-time',
        monthlyPrice: '',
        yearlyPrice: '',
        isFree: false,
        customPricingDetails: '',
        displayPages: ['home'],
        customFields: {}
      });
      setCustomFields([]);
      setIsAddingProduct(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive',
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      if (!editingProductId) {
        throw new Error('No product ID for update');
      }

      // Clean and parse price values safely
      const cleanPrice = productData.price ? productData.price.toString().replace(/[^\d.]/g, '') : '0';
      const cleanOriginalPrice = productData.originalPrice ? productData.originalPrice.toString().replace(/[^\d.]/g, '') : null;
      
      // Prepare customFields - convert object to JSON string for storage
      const customFieldsJson = Object.keys(productData.customFields || {}).length > 0 
        ? JSON.stringify(productData.customFields) 
        : null;
      
      // Clean and parse service pricing fields
      const cleanMonthlyPrice = productData.monthlyPrice ? productData.monthlyPrice.toString().replace(/[^\d.]/g, '') : '';
      const cleanYearlyPrice = productData.yearlyPrice ? productData.yearlyPrice.toString().replace(/[^\d.]/g, '') : '';
      
      // Smart pricing logic: if pricingType is monthly/yearly but specific price field is empty,
      // use the regular price field as the specific price
      let finalMonthlyPrice = cleanMonthlyPrice;
      let finalYearlyPrice = cleanYearlyPrice;
      
      if (productData.pricingType === 'monthly' && !cleanMonthlyPrice && cleanPrice && cleanPrice !== '0') {
        finalMonthlyPrice = cleanPrice;
      }
      
      if (productData.pricingType === 'yearly' && !cleanYearlyPrice && cleanPrice && cleanPrice !== '0') {
        finalYearlyPrice = cleanPrice;
      }
      
      const payload = {
        password: 'pickntrust2025',
        name: productData.name.trim(),
        description: productData.description.trim(),
        price: parseFloat(cleanPrice) || 0,
        originalPrice: cleanOriginalPrice ? parseFloat(cleanOriginalPrice) : null,
        currency: productData.currency || 'INR',
        imageUrl: productData.imageUrl.trim(),
        affiliateUrl: productData.affiliateUrl.trim(),
        category: productData.category,
        subcategory: productData.subcategory || null,
        gender: productData.gender || null,
        rating: parseFloat(productData.rating) || 4.5,
        reviewCount: parseInt(productData.reviewCount) || 100,
        discount: productData.discount ? parseInt(productData.discount) : null,
        isFeatured: Boolean(productData.isFeatured),
        isService: Boolean(productData.isService),
        isAIApp: Boolean(productData.isAIApp),
        isNew: false,
        hasTimer: Boolean(productData.hasTimer),
        timerDuration: productData.hasTimer ? parseInt(productData.timerDuration) : null,
        customFields: customFieldsJson,
        
        // Enhanced service pricing fields with smart fallback
        pricingType: productData.pricingType || 'one-time',
        monthlyPrice: finalMonthlyPrice || null,
        yearlyPrice: finalYearlyPrice || null,
        isFree: Boolean(productData.isFree),
        priceDescription: productData.customPricingDetails?.trim() || null
        ,
        // Include display pages on update to sync page tags with flags
        displayPages: Array.from(new Set([...(productData.displayPages || []), Boolean(productData.isAIApp) ? 'apps' : null].filter(Boolean)))
      };

      console.log('Updating product data:', payload);

      const response = await fetch(`/api/admin/products/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Failed to update product' };
        }
        throw new Error(errorData.message || 'Failed to update product');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories/services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/apps'] });
      // Also invalidate the page-scoped Apps & AI endpoint used by the Apps page
      queryClient.invalidateQueries({ queryKey: ['/api/products/page/apps-ai-apps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/services'] });
      
      // Invalidate all page-specific queries for real-time updates
      const pages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'deals-hub', 'loot-box', 'top-picks', 'global-picks', 'trending'];
      pages.forEach(page => {
        queryClient.invalidateQueries({ queryKey: [`/api/products/page/${page}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/categories/page/${page}`] });
      });
      
      toast({
        title: 'Success',
        description: 'Product updated successfully!',
      });
      
      // Reset form and editing state
      setNewProduct({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        currency: 'INR',
        imageUrl: '',
        affiliateUrl: '',
        category: '',
        subcategory: '',
        gender: '',
        rating: '4.5',
        reviewCount: '100',
        discount: '',
        isFeatured: true,
        isService: false,
        isAIApp: false,
        hasTimer: false,
        timerDuration: '24',
        pricingType: 'one-time',
        monthlyPrice: '',
        yearlyPrice: '',
        isFree: false,
        customPricingDetails: '',
        displayPages: ['home'],
        customFields: {}
      });
      setCustomFields([]);
      setEditingProductId(null);
      setIsAddingProduct(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
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
          currency: extracted.currency || 'INR',
          imageUrl: extracted.imageUrl || '',
          affiliateUrl: extracted.affiliateUrl || extractUrl,
          category: extracted.category || 'Electronics & Gadgets',
          subcategory: '',
          gender: '',
          rating: extracted.rating || '4.5',
          reviewCount: extracted.reviewCount || '100',
          discount: extracted.discount || '',
          isFeatured: true,
          isService: false,
          isAIApp: false,
          hasTimer: false,
          timerDuration: '24',
          // Enhanced service pricing fields
          pricingType: 'one-time',
          monthlyPrice: '',
          yearlyPrice: '',
          isFree: false,
          customPricingDetails: '',
          displayPages: ['home'],
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

  // Delete product mutation with comprehensive cache invalidation
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
      toast({
        title: 'Success',
        description: 'Product deleted from everywhere on the website!',
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
      
      // Invalidate all page-specific queries for real-time updates
      const pages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'deals-hub', 'loot-box', 'top-picks', 'global-picks', 'trending'];
      pages.forEach(page => {
        queryClient.invalidateQueries({ queryKey: [`/api/products/page/${page}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/categories/page/${page}`] });
      });
      
      // Invalidate admin stats and management queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Clear all cached product data to ensure fresh fetch
      queryClient.removeQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && 
        query.queryKey[0].includes('/api/products')
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation with detailed error messages
    if (!newProduct.name.trim()) {
      toast({
        title: 'Validation Error',
        description: `${activeTab === 'services' ? 'Service' : activeTab === 'apps' ? 'App' : 'Product'} name is required`,
        variant: 'destructive',
      });
      return;
    }
    
    // Price validation - different logic for services/AI apps vs products
    if (activeTab === 'services' || activeTab === 'apps') {
      // For services and AI apps, price is only required if it's not free and pricing type requires it
      if (!newProduct.isFree && newProduct.pricingType !== 'free') {
        // For custom pricing, all explicit price fields are optional
        const isCustomPricing = newProduct.pricingType === 'custom';
        const needsPrice = newProduct.pricingType === 'one-time';
        const needsMonthlyPrice = newProduct.pricingType === 'monthly';
        const needsYearlyPrice = newProduct.pricingType === 'yearly';

        if (!isCustomPricing && needsPrice && !newProduct.price.trim()) {
          toast({
            title: 'Validation Error',
            description: 'Price is required for this pricing type',
            variant: 'destructive',
          });
          return;
        }

        if (!isCustomPricing && needsMonthlyPrice && !newProduct.monthlyPrice.trim()) {
          toast({
            title: 'Validation Error',
            description: 'Monthly price is required for this pricing type',
            variant: 'destructive',
          });
          return;
        }

        if (!isCustomPricing && needsYearlyPrice && !newProduct.yearlyPrice.trim()) {
          toast({
            title: 'Validation Error',
            description: 'Yearly price is required for this pricing type',
            variant: 'destructive',
          });
          return;
        }
      }
    } else {
      // For regular products, price is always required
      if (!newProduct.price.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Product price is required',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (!newProduct.category) {
      toast({
        title: 'Validation Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }
    
    if (!newProduct.description.trim()) {
      toast({
        title: 'Validation Error',
        description: `${activeTab === 'services' ? 'Service' : 'Product'} description is required`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!newProduct.imageUrl.trim()) {
      toast({
        title: 'Validation Error',
        description: `${activeTab === 'services' ? 'Service' : 'Product'} image URL is required`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!newProduct.affiliateUrl.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Affiliate URL is required',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('Form validation passed. Submitting:', activeTab === 'services' ? 'service' : 'product', newProduct);
    
    // Use appropriate mutation based on editing state
    if (editingProductId) {
      updateProductMutation.mutate(newProduct);
    } else {
      addProductMutation.mutate(newProduct);
    }
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
    // Ensure currency is a valid CurrencyCode for formatter
    const displayCurrency: CurrencyCode = (String(product.currency || 'INR').toUpperCase() as CurrencyCode);
    const currentPrice = formatCurrencyPrice(Number(product.price) || 0, displayCurrency);
    const originalPriceText = product.originalPrice ? ` (was ${formatCurrencyPrice(Number(product.originalPrice) || 0, displayCurrency)})` : '';
    const productText = `Check out this amazing deal: ${product.name} - ${currentPrice}${originalPriceText} at PickNTrust!`;
    
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
        const instagramText = `<i className="fas fa-shopping-bag"></i> Amazing Deal Alert! ${product.name}\n\n<i className="fas fa-dollar-sign"></i> Price: ₹${product.price}${product.originalPrice ? ` (was ₹${product.originalPrice})` : ''}\n\n<i className="fas fa-sparkles"></i> Shop now at PickNTrust\n\n#PickNTrust #Deals #${product.category.replace(/\s+/g, '')} #Shopping`;
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
    // Set the product data for editing with actual product values
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      currency: product.currency || 'INR',
      imageUrl: product.imageUrl,
      affiliateUrl: product.affiliateUrl,
      category: product.category,
      subcategory: (product as any).subcategory || '',
      gender: '',
      rating: product.rating.toString(),
      reviewCount: product.reviewCount.toString(),
      discount: product.discount?.toString() || '',
      isFeatured: product.isFeatured,
      isService: Boolean((product as any).isService),
      isAIApp: Boolean((product as any).isAIApp),
      hasTimer: Boolean((product as any).hasTimer),
      timerDuration: (product as any).timerDuration?.toString() || '24',
      // Enhanced service pricing fields - load actual values
      pricingType: (product as any).pricingType || 'one-time',
      monthlyPrice: (product as any).monthlyPrice || '',
      yearlyPrice: (product as any).yearlyPrice || '',
      isFree: Boolean((product as any).isFree),
      customPricingDetails: (product as any).priceDescription || '',
      displayPages: (product as any).displayPages || ['home'],
      customFields: {}
    });
    setCustomFields([]);
    setEditingProductId(product.id); // Set editing mode
    setIsAddingProduct(true);
    
    toast({
      title: 'Edit Mode',
      description: 'Product loaded for editing. Make your changes and save.',
    });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setIsAddingProduct(false);
    setNewProduct({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      currency: 'INR',
      imageUrl: '',
      affiliateUrl: '',
      category: '',
      subcategory: '',
      gender: '',
      rating: '4.5',
      reviewCount: '100',
      discount: '',
      isFeatured: true,
      isService: false,
      isAIApp: false,
      hasTimer: false,
      timerDuration: '24',
      pricingType: 'one-time',
      monthlyPrice: '',
      yearlyPrice: '',
      isFree: false,
      customPricingDetails: '',
      displayPages: ['home'],
      customFields: {}
    });
    setCustomFields([]);
    
    toast({
      title: 'Edit Cancelled',
      description: 'Product editing has been cancelled.',
    });
  };

  // Add automatic discount calculation function
  const calculateDiscount = (price: string, originalPrice: string) => {
    if (price && originalPrice) {
      // Remove commas and parse as numbers
      const currentPrice = parseFloat(price.replace(/,/g, ''));
      const origPrice = parseFloat(originalPrice.replace(/,/g, ''));
      
      if (origPrice > currentPrice && origPrice > 0) {
        const discount = Math.round(((origPrice - currentPrice) / origPrice) * 100);
        return discount.toString();
      }
    }
    return '';
  };

  // Get categories based on active tab - use dynamic categories from API
  const getAvailableCategories = () => {
    // Helper to normalize only top-level categories (exclude subcategories)
    const mapTopLevel = (list: any[]) => {
      // Preserve order while deduping and exclude misformatted names
      const seen = new Set<string>();
      const result: string[] = [];
      for (const cat of list) {
        const name = (cat?.name ?? cat) as string;
        if (!name || typeof name !== 'string') continue;
        // Skip subcategories and malformed names like "Beauty > Tools"
        if (cat?.parentId || name.includes('>')) continue;
        if (!seen.has(name)) {
          seen.add(name);
          result.push(name);
        }
      }
      return result;
    };

    if (activeTab === 'services') {
      // For services, use service-specific categories from API
      if (serviceCategories.length > 0) {
        return mapTopLevel(serviceCategories);
      }
      // Fallback service categories only if API fails
      return [
        'Credit Cards', 'Banking Services', 'Streaming Services', 'Software & Apps', 
        'Insurance', 'Investment', 'Mobile Apps', 'Subscription Services', 'Financial Services'
      ];
    } else if (activeTab === 'apps') {
      // For Apps (including AI Apps), use AI app-specific categories from API
      if (aiAppCategories.length > 0) {
        return mapTopLevel(aiAppCategories);
      }
      // Fallback AI app categories only if API fails
      return [
        'AI Apps', 'Productivity Apps', 'Developer Tools', 'Design Apps', 'Writing Tools',
        'Image Generation', 'Video Editing', 'Audio Tools', 'Data Analysis', 'Automation Tools',
        'Business Intelligence', 'Machine Learning', 'Natural Language Processing', 'Computer Vision'
      ];
    } else {
      // For products, use product-specific categories from API
      if (productCategories.length > 0) {
        return mapTopLevel(productCategories);
      }
      // Fallback product categories only if API fails
      return [
        'Electronics & Gadgets', 'Fashion & Clothing', 'Home & Kitchen', 'Health & Beauty',
        'Sports & Fitness', 'Books & Education', 'Toys & Games', 'Automotive',
        'Travel & Luggage', 'Pet Supplies', 'Office Supplies', 'Garden & Outdoor'
      ];
    }
  };

  const availableCategories = getAvailableCategories();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Connection Error</CardTitle>
          <CardDescription className="space-y-2">
            <p>Unable to connect to the server. This could be because:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>The server is not running (try starting it with <code className="bg-gray-200 px-1 rounded">npm run dev</code>)</li>
              <li>The server is running on a different port</li>
              <li>There's a network connectivity issue</li>
            </ul>
            <div className="mt-4">
              <Button 
                onClick={() => {
                  // Use proper navigation instead of page reload
                  window.location.reload();
                }} 
                variant="outline"
                className="mr-2"
              >
                Retry Connection
              </Button>
              <Button 
                onClick={() => {
                  setIsAddingProduct(true);
                  setNewProduct({
                    ...newProduct,
                    isService: activeTab === 'services',
                    isAIApp: activeTab === 'apps',
                    category: ''
                  });
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Add Product Anyway
              </Button>
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Filter products based on active tab
  const filteredProducts = products.filter((product: Product) => {
    if (activeTab === 'services') {
      // Show only service products
      return product.category === 'Cards & Services' || 
             (product as any).isService === true ||
             availableCategories.includes(product.category);
    } else if (activeTab === 'apps') {
      // Show only Apps (including AI Apps)
      return (product as any).isAIApp === true || 
             availableCategories.includes(product.category);
    } else {
      // Show only regular products (exclude services and AI apps)
      return product.category !== 'Cards & Services' && 
             product.category !== 'AI Apps' &&
             (product as any).isService !== true &&
             (product as any).isAIApp !== true &&
             !serviceCategories.map((cat: any) => typeof cat === 'string' ? cat : cat.name).includes(product.category);
    }
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="flex items-center gap-2">
              {activeTab === 'products' ? (
                <i className="fas fa-box text-blue-400"></i>
              ) : activeTab === 'services' ? (
                <i className="fas fa-credit-card text-purple-400"></i>
              ) : (
                <i className="fas fa-robot text-green-400"></i>
              )}
              Product, Service & Apps Management
            </div>
          </CardTitle>
          <CardDescription className="text-blue-200">
            Manage your products, services, and apps with comprehensive admin controls
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
                  isAIApp: false,
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
                  isAIApp: false,
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
              Cards & Services
            </Button>
            <Button
              variant={activeTab === 'apps' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('apps');
                setIsAddingProduct(false);
                setNewProduct({
                  ...newProduct,
                  isService: false,
                  isAIApp: true,
                  category: '',
                  customFields: {}
                });
              }}
              className={`flex items-center gap-2 ${
                activeTab === 'apps' 
                  ? 'bg-green-600 text-white' 
                  : 'border-green-600 text-green-300 hover:bg-green-800'
              }`}
            >
              <i className="fas fa-robot"></i>
              Apps
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* URL Product Extractor */}
      <Card className="border-2 border-dashed border-purple-400 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-300">
            <Sparkles className="w-5 h-5" />
            Smart {activeTab === 'services' ? 'Service' : activeTab === 'apps' ? 'App' : 'Product'} Extractor
          </CardTitle>
          <CardDescription className="text-blue-200">
            Paste any {activeTab === 'services' ? 'service' : 'product'} URL to automatically extract details (Amazon, eBay, Flipkart, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder={`Paste ${activeTab === 'services' ? 'service' : activeTab === 'apps' ? 'app' : 'product'} URL here (e.g., https://amazon.com/product/...)`}
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
          <CardTitle>Add New {activeTab === 'services' ? 'Service' : activeTab === 'apps' ? 'App' : 'Product'}</CardTitle>
          <CardDescription className="text-blue-200">
            Add a new {activeTab === 'services' ? 'service' : activeTab === 'apps' ? 'app' : 'product'} manually or use the extractor above
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
                className={`${activeTab === 'services' ? 'bg-purple-600 hover:bg-purple-700' : activeTab === 'apps' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {activeTab === 'services' ? (
                  <>
                    <i className="fas fa-credit-card mr-2"></i>
                    Add Service Manually
                  </>
                ) : activeTab === 'apps' ? (
                  <>
                    <i className="fas fa-robot mr-2"></i>
                    Add App Manually
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
                    {activeTab === 'services' ? 'Service' : activeTab === 'apps' ? 'App' : 'Product'} Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder={activeTab === 'services' ? 'e.g., HDFC Credit Card' : activeTab === 'apps' ? 'e.g., ChatGPT Plus' : 'e.g., Wireless Headphones'}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-300">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value, subcategory: '' })}
                    className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {availableCategories.map((cat: string) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {availableCategories.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Loading categories... If this persists, categories may need to be added in the Categories tab.
                    </p>
                  )}
                </div>
                
                {/* Subcategory field - dependent on selected category */}
                {newProduct.category && subcategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-300">Subcategory (Optional)</label>
                    <select
                      value={newProduct.subcategory}
                      onChange={(e) => setNewProduct({ ...newProduct, subcategory: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                    >
                      <option value="">Select Subcategory (Optional)</option>
                      {subcategories.map((subcat: any) => (
                        <option key={subcat.id} value={subcat.name}>{subcat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                    <option value="men"><i className="fas fa-male"></i> Men</option>
                    <option value="women"><i className="fas fa-female"></i> Women</option>
                    <option value="boys"><i className="fas fa-child"></i> Boys</option>
                    <option value="girls"><i className="fas fa-child"></i> Girls</option>
                    <option value="common"><i className="fas fa-globe"></i> Common</option>
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

              {/* Pricing Section - Different for Products vs Services/AI Apps */}
              {activeTab === 'products' ? (
                // Simple pricing for products (original design)
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-300">Pricing Information</h3>
                  
                  {/* Currency Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-300">Currency</label>
                    <select
                      value={newProduct.currency}
                      onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                    >
                      {Object.entries(CURRENCIES).map(([code, info]) => (
                        <option key={code} value={code}>
                          {info.symbol} {code} - {info.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Simple Price Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">
                        Price ({CURRENCIES[newProduct.currency as CurrencyCode]?.symbol || '₹'})
                      </label>
                      <input
                        type="text"
                        value={newProduct.price}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, '');
                          const updatedProduct = { ...newProduct, price: value };
                          // Auto-calculate discount when price changes
                          const calculatedDiscount = calculateDiscount(value, newProduct.originalPrice);
                          if (calculatedDiscount) {
                            updatedProduct.discount = calculatedDiscount;
                          }
                          setNewProduct(updatedProduct);
                        }}
                        placeholder="2,999"
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">Use commas for thousands (e.g., 2,999)</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">
                        Original Price ({CURRENCIES[newProduct.currency as CurrencyCode]?.symbol || '₹'})
                      </label>
                      <input
                        type="text"
                        value={newProduct.originalPrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,]/g, '');
                          const updatedProduct = { ...newProduct, originalPrice: value };
                          // Auto-calculate discount when original price changes
                          const calculatedDiscount = calculateDiscount(newProduct.price, value);
                          if (calculatedDiscount) {
                            updatedProduct.discount = calculatedDiscount;
                          }
                          setNewProduct(updatedProduct);
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
                </div>
              ) : (
                // Complex pricing for services and apps
                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold ${
                    activeTab === 'services' ? 'text-purple-300' : 
                    activeTab === 'apps' ? 'text-green-300' : 
                    'text-blue-300'
                  }`}>Pricing Information</h3>
                  
                  {/* Pricing Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-300">Pricing Type</label>
                    <select
                      value={newProduct.pricingType || 'one-time'}
                      onChange={(e) => setNewProduct({ ...newProduct, pricingType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                    >
                      <option value="one-time">One-time Payment</option>
                      <option value="monthly">Monthly Subscription</option>
                      <option value="yearly">Yearly Subscription</option>
                      <option value="free">Free</option>
                      <option value="custom">Custom Pricing</option>
                    </select>
                  </div>

                  {/* Currency Selector */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-300">Currency</label>
                    <select
                      value={newProduct.currency}
                      onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white"
                    >
                      {Object.entries(CURRENCIES).map(([code, info]) => (
                        <option key={code} value={code}>
                          {info.symbol} {code} - {info.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Free Toggle */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFree"
                      checked={newProduct.isFree || newProduct.pricingType === 'free'}
                      onChange={(e) => {
                        const isFree = e.target.checked;
                        setNewProduct({ 
                          ...newProduct, 
                          isFree,
                          pricingType: isFree ? 'free' : (newProduct.pricingType || 'one-time')
                        });
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="isFree" className="text-sm font-medium text-blue-300">Free Product/Service</label>
                  </div>

                  {/* Pricing Fields - Show based on pricing type and free status */}
                  {!newProduct.isFree && newProduct.pricingType !== 'free' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* One-time Price */}
                      {(newProduct.pricingType === 'one-time' || newProduct.pricingType === 'custom') && (
                        <div>
                          <label className="block text-sm font-medium mb-2 text-blue-300">
                            One-time Price ({CURRENCIES[newProduct.currency as CurrencyCode]?.symbol || '₹'})
                          </label>
                          <input
                            type="text"
                            value={newProduct.price}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d,]/g, '');
                              const updatedProduct = { ...newProduct, price: value };
                              // Auto-calculate discount when price changes
                              const calculatedDiscount = calculateDiscount(value, newProduct.originalPrice);
                              if (calculatedDiscount) {
                                updatedProduct.discount = calculatedDiscount;
                              }
                              setNewProduct(updatedProduct);
                            }}
                            placeholder="2,999"
                            className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                            required={newProduct.pricingType === 'one-time'}
                          />
                          <p className="text-xs text-gray-400 mt-1">Use commas for thousands (e.g., 2,999)</p>
                        </div>
                      )}
                      
                      {/* Monthly Price */}
                      {(newProduct.pricingType === 'monthly' || newProduct.pricingType === 'custom') && (
                        <div>
                          <label className="block text-sm font-medium mb-2 text-blue-300">
                            Monthly Price ({CURRENCIES[newProduct.currency as CurrencyCode]?.symbol || '₹'})
                          </label>
                          <input
                            type="text"
                            value={newProduct.monthlyPrice}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d,]/g, '');
                              setNewProduct({ ...newProduct, monthlyPrice: value });
                            }}
                            placeholder="299"
                            className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                            required={newProduct.pricingType === 'monthly'}
                          />
                          <p className="text-xs text-gray-400 mt-1">Monthly subscription price</p>
                        </div>
                      )}
                      
                      {/* Yearly Price */}
                      {(newProduct.pricingType === 'yearly' || newProduct.pricingType === 'custom') && (
                        <div>
                          <label className="block text-sm font-medium mb-2 text-blue-300">
                            Yearly Price ({CURRENCIES[newProduct.currency as CurrencyCode]?.symbol || '₹'})
                          </label>
                          <input
                            type="text"
                            value={newProduct.yearlyPrice}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d,]/g, '');
                              setNewProduct({ ...newProduct, yearlyPrice: value });
                            }}
                            placeholder="2,999"
                            className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                            required={newProduct.pricingType === 'yearly'}
                          />
                          <p className="text-xs text-gray-400 mt-1">Yearly subscription price</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-300">Price Description</label>
                    <input
                      type="text"
                      value={newProduct.customPricingDetails || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, customPricingDetails: e.target.value })}
                      placeholder="e.g., Starting from, Per user, One-time setup fee, Contact for pricing"
                      className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Optional description to clarify pricing structure</p>
                  </div>

                  {/* Custom Pricing Details */}
                  {newProduct.pricingType === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-blue-300">Custom Pricing Details</label>
                      <textarea
                        value={newProduct.customPricingDetails || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, customPricingDetails: e.target.value })}
                        placeholder="Describe your custom pricing structure, tiers, or contact information..."
                        className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Original Price and Discount */}
                  {!newProduct.isFree && newProduct.pricingType !== 'free' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-300">
                          Original Price ({CURRENCIES[newProduct.currency as CurrencyCode]?.symbol || '₹'})
                        </label>
                        <input
                          type="text"
                          value={newProduct.originalPrice}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d,]/g, '');
                            const updatedProduct = { ...newProduct, originalPrice: value };
                            // Auto-calculate discount when original price changes
                            const calculatedDiscount = calculateDiscount(newProduct.price, value);
                            if (calculatedDiscount) {
                              updatedProduct.discount = calculatedDiscount;
                            }
                            setNewProduct(updatedProduct);
                          }}
                          placeholder="3,999"
                          className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                        />
                        <p className="text-xs text-gray-400 mt-1">Optional - for showing discounts</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-300">
                          Discount (%) <span className="text-xs text-green-400">Auto-calculated</span>
                        </label>
                        <input
                          type="number"
                          value={newProduct.discount}
                          onChange={(e) => setNewProduct({ ...newProduct, discount: e.target.value })}
                          placeholder="25"
                          className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-slate-800 text-white placeholder-slate-400"
                          readOnly
                        />
                        <p className="text-xs text-green-400 mt-1">Automatically calculated from prices</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  <label htmlFor="isService" className="text-sm font-medium text-blue-300"><i className="fas fa-credit-card"></i> Service Product (Cards & Services)</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAIApp"
                    checked={newProduct.isAIApp}
                    onChange={(e) => setNewProduct({ ...newProduct, isAIApp: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isAIApp" className="text-sm font-medium text-blue-300"><i className="fas fa-robot"></i> Apps & AI Apps</label>
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
                      <i className="fas fa-exclamation-triangle"></i> Product will be automatically deleted when timer expires
                    </p>
                  </div>
                )}
              </div>

              {/* Display Pages Selection */}
              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-300 mb-3">
                  <i className="fas fa-globe"></i>
                  <span className="text-sm font-medium">Where to Display This Product</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dynamicPages.map((page) => (
                    <label key={page.id} className="flex items-start space-x-2 cursor-pointer p-2 rounded hover:bg-blue-800/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={newProduct.displayPages.includes(page.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewProduct({
                              ...newProduct,
                              displayPages: [...newProduct.displayPages, page.id]
                            });
                          } else {
                            setNewProduct({
                              ...newProduct,
                              displayPages: newProduct.displayPages.filter(p => p !== page.id)
                            });
                          }
                        }}
                        className="mt-1 rounded border-blue-400 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-blue-200">{page.label}</div>
                        <div className="text-xs text-blue-400">{page.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-blue-400 mt-3">
                  <i className="fas fa-lightbulb"></i> Select multiple pages to show this product in different sections. Pages are dynamically loaded from Navigation Management and update in real-time.
                </p>
              </div>

              {/* Service-Specific Note */}
              {activeTab === 'services' && (
                <div className="bg-purple-900/30 border border-purple-600/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-300 mb-2">
                    <i className="fas fa-info-circle"></i>
                    <span className="text-sm font-medium">Service Product Information</span>
                  </div>
                  <p className="text-purple-200 text-xs">
                    You're adding a service product for the Cards & Services section. Use the description field to include service-specific details like provider, features, eligibility, and terms.
                  </p>
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
                  disabled={addProductMutation.isPending || updateProductMutation.isPending}
                  className={editingProductId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {editingProductId 
                    ? (updateProductMutation.isPending ? 'Updating...' : 'Update Product')
                    : (addProductMutation.isPending ? 'Adding...' : 'Add Product')
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={editingProductId ? handleCancelEdit : () => setIsAddingProduct(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* CSV Bulk Upload */}
      <Card className="border-2 border-dashed border-blue-500 bg-gradient-to-r from-blue-900/20 to-blue-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <i className="fas fa-file-csv text-blue-400"></i>
            CSV Bulk Upload ({activeTab === 'services' ? 'Services' : activeTab === 'apps' ? 'Apps' : 'Products'})
          </CardTitle>
          <CardDescription className="text-blue-200">
            Upload multiple {activeTab === 'services' ? 'services' : activeTab === 'apps' ? 'apps' : 'products'} in one go.
            Set `is_service` or `is_ai_app` in CSV to target Services or Apps. Accepted headers: 
            name, description, price, original_price, category, image_url, affiliate_url, brand, is_featured, is_service, is_ai_app, gender.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setBulkUploadFile(e.target.files?.[0] || null)}
              className="px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white"
            />
            <input
              type="password"
              value={bulkAdminPassword}
              onChange={(e) => setBulkAdminPassword(e.target.value)}
              placeholder="Admin password"
              className="px-3 py-2 border border-slate-600 rounded-lg bg-slate-800 text-white"
            />
            <Button
              onClick={() => bulkUploadMutation.mutate()}
              disabled={bulkUploadMutation.isPending || !bulkUploadFile}
              className="bg-blue-600 hover:bg-blue-700 min-w-[180px]"
            >
              {bulkUploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-2"></i>
                  Upload & Process CSV
                </>
              )}
            </Button>
          </div>
          <div className="text-sm text-blue-200">
            <a
              href="/product-bulk-template.csv"
              download
              className="text-blue-300 hover:text-blue-200 underline"
            >
              Download CSV Template
            </a>
            <span className="mx-2">•</span>
            <a
              href="/product-bulk-notes.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              Field Notes & Valid Page Slugs
            </a>
            <p className="mt-2">Notes:</p>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>Column names must match exactly. Use commas, UTF-8 encoding.</li>
              <li>Set `is_service` to true for Services, `is_ai_app` to true for Apps.</li>
              <li>`price` and `original_price` can include symbols; they are normalized.</li>
              <li>
                `display_pages` accepts comma-separated page slugs. Common slugs:
                <span className="ml-1 font-mono">prime-picks, cue-picks, value-picks, click-picks, global-picks, travel-picks, deals-hub, loot-box, top-picks, services, apps, homepage, trending</span>
              </li>
            </ul>
          </div>
          {bulkUploadMutation.isSuccess && (
            <div className="text-xs text-blue-200">
              <p>
                Processed: {String((bulkUploadMutation.data as any)?.processed || 0)} | Inserted: {String((bulkUploadMutation.data as any)?.inserted || 0)} | Failed: {String((bulkUploadMutation.data as any)?.failed || 0)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Current {activeTab === 'services' ? 'Services' : activeTab === 'apps' ? 'Apps' : 'Products'} ({filteredProducts.length})
              </CardTitle>
              <CardDescription className="text-blue-200">
                Manage all your {activeTab === 'services' ? 'services' : activeTab === 'apps' ? 'apps' : 'products'} with full control
              </CardDescription>
            </div>
            {filteredProducts.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Clear selection */}
                {selectedIds.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800/50"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Clear ({selectedIds.length})
                  </Button>
                )}

                {/* Delete Selected */}
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Delete ${selectedIds.length} selected ${activeTab === 'services' ? 'services' : activeTab === 'apps' ? 'apps' : 'products'}? This cannot be undone.`)) {
                        const deletePromises = selectedIds.map(id =>
                          fetch(`/api/admin/products/${id}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: 'pickntrust2025' })
                          })
                        );
                        Promise.all(deletePromises)
                          .then(() => {
                            toast({
                              title: 'Deleted',
                              description: `${selectedIds.length} item(s) deleted successfully`,
                            });
                            clearSelection();
                            queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                            const pages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'deals-hub', 'loot-box', 'top-picks', 'global-picks', 'trending'];
                            pages.forEach(page => {
                              queryClient.invalidateQueries({ queryKey: [`/api/products/page/${page}`] });
                              queryClient.invalidateQueries({ queryKey: [`/api/categories/page/${page}`] });
                            });
                          })
                          .catch(() => {
                            toast({
                              title: 'Error',
                              description: 'Failed to delete some selected items',
                              variant: 'destructive',
                            });
                          });
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Delete Selected ({selectedIds.length})
                  </Button>
                )}

                {/* Delete All */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ALL ${activeTab === 'services' ? 'services' : activeTab === 'apps' ? 'apps' : 'products'}? This action cannot be undone.`)) {
                      // Delete all products in current tab
                      const deletePromises = filteredProducts.map(product => 
                        fetch(`/api/admin/products/${product.id}`, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: 'pickntrust2025' })
                        })
                      );
                      
                      Promise.all(deletePromises)
                        .then(() => {
                          toast({
                            title: "Success",
                            description: `All ${activeTab === 'services' ? 'services' : activeTab === 'apps' ? 'apps' : 'products'} deleted successfully`,
                          });
                          clearSelection();
                          queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                          
                          // Invalidate all page-specific queries for real-time updates
                          const pages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'deals-hub', 'loot-box', 'top-picks', 'global-picks', 'trending'];
                          pages.forEach(page => {
                            queryClient.invalidateQueries({ queryKey: [`/api/products/page/${page}`] });
                            queryClient.invalidateQueries({ queryKey: [`/api/categories/page/${page}`] });
                          });
                        })
                        .catch(() => {
                          toast({
                            title: "Error",
                            description: "Failed to delete some items",
                            variant: "destructive",
                          });
                        });
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete All {activeTab === 'services' ? 'Services' : activeTab === 'apps' ? 'Apps' : 'Products'}
                </Button>
              </div>
            )}
          </div>
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
                ) : activeTab === 'apps' ? (
                  <i className="fas fa-robot text-6xl text-green-400 mb-4"></i>
                ) : (
                  <i className="fas fa-box text-6xl text-blue-400 mb-4"></i>
                )}
              </div>
              <p className="text-gray-600 mb-2">
                No {activeTab === 'services' ? 'services' : activeTab === 'apps' ? 'apps' : 'products'} found in this category.
              </p>
              <p className="text-gray-500 text-sm">
                Add your first {activeTab === 'services' ? 'service' : activeTab === 'apps' ? 'app' : 'product'} using the form above.
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
                      : activeTab === 'apps'
                      ? 'bg-green-900/20 border border-green-600/30'
                      : 'bg-gray-800'
                  }`}
                >
                  {/* Select checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 accent-red-600 mr-2"
                      aria-label={`Select ${activeTab === 'services' ? 'service' : activeTab === 'apps' ? 'app' : 'product'}`}
                    />
                  </div>
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
                      {activeTab === 'apps' && (
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">APP</span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-2 line-clamp-1">{product.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400 font-bold">{formatProductPrice(product.price, product.currency)}</span>
                      {product.originalPrice && (
                        <span className="text-gray-500 line-through">{formatProductPrice(product.originalPrice, product.currency)}</span>
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
                        title={`Share ${activeTab === 'services' ? 'service' : activeTab === 'apps' ? 'app' : 'product'}`}
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
                      title={`Edit ${activeTab === 'services' ? 'service' : activeTab === 'apps' ? 'app' : 'product'}`}
                    >
                      <i className="fas fa-edit text-gray-300"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deleteProductMutation.isPending}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title={`Delete ${activeTab === 'services' ? 'service' : activeTab === 'apps' ? 'app' : 'product'}`}
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
