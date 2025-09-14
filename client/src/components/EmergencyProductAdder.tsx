/**
 * Emergency Product Addition System
 * Failsafe manual product addition when Telegram bot fails
 * Admin-only component for critical situations
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface EmergencyProductData {
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
  rating: string;
  reviewCount: number;
  discount?: number;
  targetPage: string;
}

interface EmergencyProductAdderProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function EmergencyProductAdder({ isVisible, onClose }: EmergencyProductAdderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<EmergencyProductData>({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    currency: 'INR',
    imageUrl: '',
    affiliateUrl: '',
    category: 'Electronics & Gadgets',
    rating: '4.0',
    reviewCount: 100,
    discount: 0,
    targetPage: 'prime-picks'
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Categories for dropdown
  const categories = [
    'Electronics & Gadgets',
    'Fashion & Clothing',
    'Home & Kitchen',
    'Health & Beauty',
    'Sports & Fitness',
    'Books & Media',
    'Toys & Games',
    'Automotive'
  ];

  // Target pages for dropdown
  const targetPages = [
    'prime-picks',
    'value-picks',
    'click-picks',
    'cue-picks',
    'top-picks',
    'global-picks',
    'loot-box'
  ];

  // Currencies for dropdown
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

  // Emergency product addition mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: EmergencyProductData) => {
      const response = await fetch('/api/emergency/add-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          source: 'emergency-manual',
          isNew: 1,
          isFeatured: 1,
          displayPages: JSON.stringify([productData.targetPage]),
          createdAt: Math.floor(Date.now() / 1000)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add product');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '<i className="fas fa-exclamation-circle"></i> Emergency Product Added!',
        description: `Product "${formData.name}" added successfully to ${formData.targetPage}`,
        duration: 5000,
      });
      
      // Invalidate queries to refresh product lists
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/page/${formData.targetPage}`] });
      
      // Reset form
      resetForm();
      
      // Close modal
      onClose();
    },
    onError: (error) => {
      toast({
        title: '<i className="fas fa-times-circle"></i> Emergency Addition Failed',
        description: `Error: ${error.message}`,
        variant: 'destructive',
        duration: 5000,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.affiliateUrl) {
      toast({
        title: '<i className="fas fa-exclamation-triangle"></i> Missing Required Fields',
        description: 'Please fill in Name, Price, and Affiliate URL',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await addProductMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Emergency product addition failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      currency: 'INR',
      imageUrl: '',
      affiliateUrl: '',
      category: 'Electronics & Gadgets',
      rating: '4.0',
      reviewCount: 100,
      discount: 0,
      targetPage: 'prime-picks'
    });
  };

  const handleInputChange = (field: keyof EmergencyProductData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDiscount = () => {
    if (formData.price && formData.originalPrice) {
      const price = parseFloat(formData.price);
      const originalPrice = parseFloat(formData.originalPrice);
      if (originalPrice > price) {
        const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        handleInputChange('discount', discount);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <i className="fas fa-exclamation-circle"></i> Emergency Product Addition
              </h2>
              <p className="text-red-100 mt-1">
                Manual failsafe when Telegram bot is down
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 text-2xl font-bold"
              disabled={isProcessing}
            >
              ×
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter product description"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="999"
                required
              />
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Original Price
              </label>
              <input
                type="number"
                value={formData.originalPrice}
                onChange={(e) => {
                  handleInputChange('originalPrice', e.target.value);
                  setTimeout(calculateDiscount, 100);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="1499"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount %
              </label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="25"
                min="0"
                max="99"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Target Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Page
              </label>
              <select
                value={formData.targetPage}
                onChange={(e) => handleInputChange('targetPage', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {targetPages.map(page => (
                  <option key={page} value={page}>{page.charAt(0).toUpperCase() + page.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              <input
                type="number"
                value={formData.rating}
                onChange={(e) => handleInputChange('rating', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="4.5"
                min="1"
                max="5"
                step="0.1"
              />
            </div>

            {/* Review Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Count
              </label>
              <input
                type="number"
                value={formData.reviewCount}
                onChange={(e) => handleInputChange('reviewCount', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="1000"
                min="0"
              />
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Affiliate URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Affiliate URL *
              </label>
              <input
                type="url"
                value={formData.affiliateUrl}
                onChange={(e) => handleInputChange('affiliateUrl', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://amazon.in/dp/PRODUCT123"
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={isProcessing}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isProcessing || !formData.name || !formData.price || !formData.affiliateUrl}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <i className="fas fa-exclamation-circle"></i> Emergency Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}