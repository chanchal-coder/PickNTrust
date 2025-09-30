import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface TravelDealFormData {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  discount: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
  sectionType: string;
  routeType: string;
  departure: string;
  arrival: string;
  duration: string;
  airline: string;
  flightClass: string;
  hotelType: string;
  busType: string;
  trainClass: string;
  packageType: string;
  tourType: string;
  cruiseType: string;
  carType: string;
  displayOrder: number;
}

const initialFormData: TravelDealFormData = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  discount: '',
  currency: 'INR',
  imageUrl: '',
  affiliateUrl: '',
  category: 'flights',
  sectionType: 'featured',
  routeType: 'domestic',
  departure: '',
  arrival: '',
  duration: '',
  airline: '',
  flightClass: '',
  hotelType: '',
  busType: '',
  trainClass: '',
  packageType: '',
  tourType: '',
  cruiseType: '',
  carType: '',
  displayOrder: 0
};

const AdminTravelForm = () => {
  const [formData, setFormData] = useState<TravelDealFormData>(initialFormData);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDealMutation = useMutation({
    mutationFn: async (dealData: TravelDealFormData) => {
      const response = await fetch('/api/admin/travel-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create deal');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Travel deal created successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['travel-deals'] });
      setFormData(initialFormData);
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDealMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof TravelDealFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate discount percentage based on price and original price
  const calculateDiscount = (price: string, originalPrice: string): string => {
    if (!price || !originalPrice) return '';
    
    // Remove currency symbols and commas, extract numbers
    const priceNum = parseFloat(price.replace(/[^\d.]/g, ''));
    const originalPriceNum = parseFloat(originalPrice.replace(/[^\d.]/g, ''));
    
    if (isNaN(priceNum) || isNaN(originalPriceNum) || originalPriceNum <= 0) return '';
    
    const discountPercent = ((originalPriceNum - priceNum) / originalPriceNum) * 100;
    return discountPercent > 0 ? Math.round(discountPercent).toString() : '';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-50"
      >
        + Add Travel Deal
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Add New Travel Deal
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deal Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  placeholder="e.g., IndiGo Airlines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price *
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => {
                    const updatedFormData = { ...formData, price: e.target.value };
                    // Auto-calculate discount when price changes
                    const calculatedDiscount = calculateDiscount(e.target.value, formData.originalPrice);
                    if (calculatedDiscount) {
                      updatedFormData.discount = calculatedDiscount;
                    }
                    setFormData(updatedFormData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  placeholder="e.g., From ₹3,500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Original Price
                </label>
                <input
                  type="text"
                  value={formData.originalPrice}
                  onChange={(e) => {
                    const updatedFormData = { ...formData, originalPrice: e.target.value };
                    // Auto-calculate discount when original price changes
                    const calculatedDiscount = calculateDiscount(formData.price, e.target.value);
                    if (calculatedDiscount) {
                      updatedFormData.discount = calculatedDiscount;
                    }
                    setFormData(updatedFormData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., ₹4,500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Discount (%) <span className="text-xs text-green-600">Auto-calculated</span>
                </label>
                <input
                  type="text"
                  value={formData.discount}
                  onChange={(e) => handleInputChange('discount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-600"
                  placeholder="Auto-calculated"
                  readOnly
                />
                <p className="text-xs text-green-600 mt-1">Automatically calculated from prices</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="flights">Flights</option>
                  <option value="hotels">Hotels</option>
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                  <option value="packages">Packages</option>
                  <option value="tours">Tours</option>
                  <option value="cruises">Cruises</option>
                  <option value="car-rental">Car Rental</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section Type *
                </label>
                <select
                  value={formData.sectionType}
                  onChange={(e) => handleInputChange('sectionType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="featured">Featured</option>
                  <option value="standard">Standard</option>
                  <option value="destinations">Destinations</option>
                  <option value="special">Special</option>
                  <option value="cities">Cities</option>
                  <option value="trending">Trending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Route Type
                </label>
                <select
                  value={formData.routeType}
                  onChange={(e) => handleInputChange('routeType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="domestic">Domestic</option>
                  <option value="international">International</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Brief description of the travel deal"
              />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Affiliate URL *
                </label>
                <input
                  type="url"
                  value={formData.affiliateUrl}
                  onChange={(e) => handleInputChange('affiliateUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  placeholder="https://booking-site.com"
                />
              </div>
            </div>

            {/* Category-specific fields */}
            {formData.category === 'flights' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Airline
                  </label>
                  <input
                    type="text"
                    value={formData.airline}
                    onChange={(e) => handleInputChange('airline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., IndiGo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Flight Class
                  </label>
                  <input
                    type="text"
                    value={formData.flightClass}
                    onChange={(e) => handleInputChange('flightClass', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., Economy"
                  />
                </div>
              </div>
            )}

            {formData.category === 'hotels' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hotel Type
                </label>
                <input
                  type="text"
                  value={formData.hotelType}
                  onChange={(e) => handleInputChange('hotelType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., luxury, budget, 5-star"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createDealMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createDealMutation.isPending ? 'Creating...' : 'Create Deal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminTravelForm;