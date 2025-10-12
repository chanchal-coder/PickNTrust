import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ScrollNavigation from "@/components/scroll-navigation";
import AmazonProductCard from "@/components/amazon-product-card";
import { BundleProductCard } from "@/components/BundleProductCard";
import UniversalPageLayout from '@/components/UniversalPageLayout';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
      return response.json();
    },
    enabled: !!searchTerm,
  });

  return (
    <UniversalPageLayout pageId="search">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Search Products</h1>
              
              <div className="mb-8">
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
                />
              </div>
      
              {isLoading && (
                <div className="text-center py-8">
                  <div className="text-gray-600 dark:text-gray-300">Searching...</div>
                </div>
              )}
      
              {searchResults && searchResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map((product: any) => {
                    // Check if product is part of a bundle (multiple products)
                    const isBundle = product.totalInGroup && Number(product.totalInGroup) > 1;
                    
                    if (isBundle) {
                      return (
                        <BundleProductCard 
                          key={product.id} 
                          product={product} 
                          source="search" 
                        />
                      );
              } else {
                return (
                  <AmazonProductCard 
                    key={product.id} 
                    product={{
                      id: product.id,
                      name: product.name,
                      description: product.description || '',
                      price: product.price,
                      originalPrice: product.originalPrice || product.original_price,
                      currency: product.currency || 'INR',
                      imageUrl: product.imageUrl || product.image_url,
                      affiliateUrl: product.affiliateUrl || product.affiliate_url,
                      category: product.category,
                      rating: product.rating,
                      reviewCount: product.reviewCount,
                      discount: product.discount,
                      isNew: product.isNew,
                      isFeatured: product.isFeatured,
                      affiliate_network: product.affiliate_network || product.networkBadge,
                      networkBadge: product.networkBadge || 'Search Result',
                      affiliateNetwork: product.affiliateNetworkName || 'Search Network',
                      sourceType: 'search',
                      source: 'search',
                      displayPages: ['search'],
                      // Service-specific pricing fields normalization
                      priceDescription: product.priceDescription || product.price_description || '',
                      monthlyPrice: product.monthlyPrice || product.monthly_price || 0,
                      yearlyPrice: product.yearlyPrice || product.yearly_price || 0,
                      pricingType: product.pricingType || product.pricing_type,
                      isFree: product.isFree || product.is_free || false,
                      isService: product.isService || product.is_service || false,
                      isAIApp: product.isAIApp || product.is_ai_app || false
                    }}
                  />
                );
              }
            })}
          </div>
        )}

        {searchTerm && searchResults && searchResults.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-300">No products found for "{searchTerm}"</div>
          </div>
        )}
        </div>
        <ScrollNavigation />
      </div>
    </UniversalPageLayout>
  );
}