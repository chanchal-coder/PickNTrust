import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Upload, Wand2, Eye, Link, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TravelAddFormProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onSubmit: (data: any) => void;
}

interface FormData {
  // Basic fields
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  sectionType: 'featured' | 'standard' | 'destinations' | 'special' | 'cities';
  
  // Category-specific fields
  [key: string]: any;
}

const categoryFields = {
  flights: {
    fields: [
      { name: 'airline', label: 'Airline', type: 'text', placeholder: 'e.g., Air India, IndiGo' },
      { name: 'departure', label: 'Departure City', type: 'text', placeholder: 'e.g., Mumbai, Delhi' },
      { name: 'arrival', label: 'Arrival City', type: 'text', placeholder: 'e.g., Bangalore, Chennai' },
      { name: 'departureTime', label: 'Departure Time', type: 'time' },
      { name: 'arrivalTime', label: 'Arrival Time', type: 'time' },
      { name: 'duration', label: 'Flight Duration', type: 'text', placeholder: 'e.g., 2h 30m' },
      { name: 'flightClass', label: 'Class', type: 'select', options: ['Economy', 'Premium Economy', 'Business', 'First Class'] },
      { name: 'stops', label: 'Stops', type: 'select', options: ['Non-stop', '1 Stop', '2+ Stops'] },
      { name: 'routeType', label: 'Route Type', type: 'select', options: ['domestic', 'international'] },
      { name: 'brandBadge', label: 'Brand Badge (Optional)', type: 'text', placeholder: 'e.g., Premium Partner, Verified Airline' }
    ],
    sections: [
      { value: 'featured', label: 'Airlines & Brand Promotions' },
      { value: 'standard', label: 'Flight Search Results' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ]
  },
  hotels: {
    fields: [
      { name: 'location', label: 'Location/City', type: 'text', placeholder: 'e.g., Goa, Mumbai' },
      { name: 'hotelType', label: 'Hotel Type', type: 'select', options: ['Luxury', 'Business', 'Budget', 'Resort', 'Boutique'] },
      { name: 'roomType', label: 'Room Type', type: 'text', placeholder: 'e.g., Deluxe Room, Suite' },
      { name: 'amenities', label: 'Amenities', type: 'textarea', placeholder: 'e.g., WiFi, Pool, Spa, Gym (comma separated)' },
      { name: 'rating', label: 'Star Rating', type: 'select', options: ['1', '2', '3', '4', '5'] },
      { name: 'cancellation', label: 'Cancellation Policy', type: 'text', placeholder: 'e.g., Free cancellation till 24hrs' },
      { name: 'brandBadge', label: 'Brand Badge (Optional)', type: 'text', placeholder: 'e.g., Premium Partner, Verified Hotel' }
    ],
    sections: [
      { value: 'featured', label: 'Featured Hotels & Premium Stays' },
      { value: 'standard', label: 'Quick Browse Hotels' },
      { value: 'destinations', label: 'Browse by Destination' }
    ]
  },
  tours: {
    fields: [
      { name: 'duration', label: 'Tour Duration', type: 'text', placeholder: 'e.g., 5 Days 4 Nights' },
      { name: 'destinations', label: 'Destinations Covered', type: 'textarea', placeholder: 'e.g., Delhi, Agra, Jaipur' },
      { name: 'inclusions', label: 'Inclusions', type: 'textarea', placeholder: 'e.g., Accommodation, Meals, Transport' },
      { name: 'tourType', label: 'Tour Type', type: 'select', options: ['Cultural', 'Adventure', 'Wildlife', 'Spiritual', 'Beach', 'Hill Station'] },
      { name: 'groupSize', label: 'Group Size', type: 'text', placeholder: 'e.g., 2-15 people' },
      { name: 'difficulty', label: 'Difficulty Level', type: 'select', options: ['Easy', 'Moderate', 'Challenging'] }
    ],
    sections: [
      { value: 'featured', label: 'Featured Tour Packages & Premium Experiences' },
      { value: 'standard', label: 'Quick Browse Packages' },
      { value: 'destinations', label: 'Browse by Destination' }
    ]
  },
  cruises: {
    fields: [
      { name: 'cruiseLine', label: 'Cruise Line', type: 'text', placeholder: 'e.g., Royal Caribbean, MSC' },
      { name: 'route', label: 'Cruise Route', type: 'text', placeholder: 'e.g., Mediterranean, Caribbean' },
      { name: 'duration', label: 'Cruise Duration', type: 'text', placeholder: 'e.g., 7 nights' },
      { name: 'cabinType', label: 'Cabin Type', type: 'select', options: ['Interior', 'Ocean View', 'Balcony', 'Suite'] },
      { name: 'ports', label: 'Ports of Call', type: 'textarea', placeholder: 'e.g., Barcelona, Rome, Naples' },
      { name: 'amenities', label: 'Ship Amenities', type: 'textarea', placeholder: 'e.g., Pool, Spa, Casino, Theater' }
    ],
    sections: [
      { value: 'featured', label: 'Our Featured Cruise Lines' },
      { value: 'standard', label: 'Most-booked Cruise Destinations' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ]
  },
  bus: {
    fields: [
      { name: 'operator', label: 'Bus Operator', type: 'text', placeholder: 'e.g., Volvo, RedBus' },
      { name: 'departure', label: 'Departure City', type: 'text', placeholder: 'e.g., Mumbai, Delhi' },
      { name: 'arrival', label: 'Arrival City', type: 'text', placeholder: 'e.g., Pune, Goa' },
      { name: 'departureTime', label: 'Departure Time', type: 'time' },
      { name: 'arrivalTime', label: 'Arrival Time', type: 'time' },
      { name: 'duration', label: 'Journey Duration', type: 'text', placeholder: 'e.g., 8h 30m' },
      { name: 'busType', label: 'Bus Type', type: 'select', options: ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'Volvo'] },
      { name: 'amenities', label: 'Amenities', type: 'textarea', placeholder: 'e.g., WiFi, Charging Point, Blanket' }
    ],
    sections: [
      { value: 'featured', label: 'Bus Operators & Brand Promotions' },
      { value: 'standard', label: 'Bus Search Results' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ]
  },
  train: {
    fields: [
      { name: 'trainOperator', label: 'Train Operator', type: 'text', placeholder: 'e.g., Indian Railways, Rajdhani' },
      { name: 'departure', label: 'Departure Station', type: 'text', placeholder: 'e.g., Mumbai Central, New Delhi' },
      { name: 'arrival', label: 'Arrival Station', type: 'text', placeholder: 'e.g., Chennai Central, Bangalore' },
      { name: 'departureTime', label: 'Departure Time', type: 'time' },
      { name: 'arrivalTime', label: 'Arrival Time', type: 'time' },
      { name: 'duration', label: 'Journey Duration', type: 'text', placeholder: 'e.g., 16h 00m' },
      { name: 'trainType', label: 'Train Class', type: 'select', options: ['AC 1-Tier', 'AC 2-Tier', 'AC 3-Tier', 'Sleeper', 'General'] },
      { name: 'trainNumber', label: 'Train Number', type: 'text', placeholder: 'e.g., 12951' }
    ],
    sections: [
      { value: 'featured', label: 'Train Operators & Brand Promotions' },
      { value: 'standard', label: 'Train Search Results' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ]
  },
  packages: {
    fields: [
      { name: 'duration', label: 'Package Duration', type: 'text', placeholder: 'e.g., 5 Days 4 Nights' },
      { name: 'destinations', label: 'Destinations Covered', type: 'textarea', placeholder: 'e.g., Goa, Mumbai, Pune' },
      { name: 'inclusions', label: 'Package Inclusions', type: 'textarea', placeholder: 'e.g., Flights, Hotels, Meals, Transport' },
      { name: 'location', label: 'Primary Location', type: 'text', placeholder: 'e.g., Goa, Kerala, Dubai' },
      { name: 'packageType', label: 'Package Type', type: 'select', options: ['Honeymoon', 'Family', 'Adventure', 'Business', 'Group', 'Solo', 'Luxury'] },
      { name: 'groupSize', label: 'Group Size', type: 'text', placeholder: 'e.g., 2-6 people' },
      { name: 'validTill', label: 'Valid Till', type: 'date' },
      { name: 'routeType', label: 'Route Type', type: 'select', options: ['domestic', 'international'] },
      { name: 'flightPrice', label: 'Flight Add-on Price (Optional)', type: 'text', placeholder: 'e.g., 8000 (amount only, no currency symbol)' },
      { name: 'flightRoute', label: 'Flight Route (Optional)', type: 'text', placeholder: 'e.g., Delhi-Kochi-Delhi, Mumbai-Goa-Mumbai' },
      { name: 'flightDetails', label: 'Flight Details (Optional)', type: 'text', placeholder: 'e.g., Economy class, 2 nights, IndiGo' },
      { name: 'brandBadge', label: 'Brand Badge (Optional)', type: 'text', placeholder: 'e.g., Premium Partner, Verified Package' }
    ],
    sections: [
      { value: 'featured', label: 'Best Selling Destinations' },
      { value: 'standard', label: 'International Destinations' },
      { value: 'destinations', label: 'Visa Free Destinations' },
      { value: 'special', label: 'Last Minute Deals' },
      { value: 'cities', label: 'Destination Packages' }
    ]
  },
  'car-rental': {
    fields: [
      { name: 'carType', label: 'Car Type', type: 'select', options: ['Economy', 'Compact', 'SUV', 'Luxury', 'Premium'] },
      { name: 'location', label: 'Pickup Location', type: 'text', placeholder: 'e.g., Mumbai Airport, Delhi' },
      { name: 'duration', label: 'Rental Duration', type: 'text', placeholder: 'e.g., 3 days, 1 week' },
      { name: 'features', label: 'Car Features', type: 'textarea', placeholder: 'e.g., GPS, AC, Automatic' },
      { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
      { name: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic'] }
    ],
    sections: [
      { value: 'featured', label: 'Car Rental Operators & Brand Promotions' },
      { value: 'standard', label: 'Car Rental Search Results' },
      { value: 'destinations', label: 'Browse by Destinations' }
    ]
  }
};

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CNY', 'SGD', 'AED', 'THB', 'MYR'];

const colorPalette = [
  // Basic Colors
  { color: '#000000', name: 'Black' },
  { color: '#ffffff', name: 'White' },
  { color: '#6b7280', name: 'Gray' },
  { color: '#374151', name: 'Dark Gray' },
  { color: '#9ca3af', name: 'Light Gray' },
  
  // Reds
  { color: '#ef4444', name: 'Red' },
  { color: '#dc2626', name: 'Dark Red' },
  { color: '#fca5a5', name: 'Light Red' },
  { color: '#7f1d1d', name: 'Maroon' },
  { color: '#fee2e2', name: 'Pink White' },
  
  // Oranges
  { color: '#f97316', name: 'Orange' },
  { color: '#ea580c', name: 'Dark Orange' },
  { color: '#fdba74', name: 'Light Orange' },
  { color: '#c2410c', name: 'Burnt Orange' },
  { color: '#fed7aa', name: 'Peach' },
  
  // Yellows
  { color: '#eab308', name: 'Yellow' },
  { color: '#ca8a04', name: 'Dark Yellow' },
  { color: '#fde047', name: 'Bright Yellow' },
  { color: '#a16207', name: 'Amber' },
  { color: '#fef3c7', name: 'Light Yellow' },
  
  // Greens
  { color: '#22c55e', name: 'Green' },
  { color: '#059669', name: 'Emerald' },
  { color: '#16a34a', name: 'Dark Green' },
  { color: '#84cc16', name: 'Lime' },
  { color: '#dcfce7', name: 'Light Green' },
  { color: '#065f46', name: 'Forest Green' },
  { color: '#10b981', name: 'Teal Green' },
  
  // Blues
  { color: '#3b82f6', name: 'Blue' },
  { color: '#1d4ed8', name: 'Dark Blue' },
  { color: '#60a5fa', name: 'Light Blue' },
  { color: '#0ea5e9', name: 'Sky Blue' },
  { color: '#06b6d4', name: 'Cyan' },
  { color: '#1e40af', name: 'Navy Blue' },
  { color: '#dbeafe', name: 'Pale Blue' },
  
  // Purples
  { color: '#8b5cf6', name: 'Purple' },
  { color: '#7c3aed', name: 'Dark Purple' },
  { color: '#a78bfa', name: 'Light Purple' },
  { color: '#6366f1', name: 'Indigo' },
  { color: '#8b5a2b', name: 'Brown' },
  { color: '#5b21b6', name: 'Deep Purple' },
  
  // Pinks
  { color: '#ec4899', name: 'Pink' },
  { color: '#db2777', name: 'Dark Pink' },
  { color: '#f472b6', name: 'Light Pink' },
  { color: '#be185d', name: 'Rose' },
  { color: '#fce7f3', name: 'Pale Pink' },
  
  // Additional Colors
  { color: '#14b8a6', name: 'Teal' },
  { color: '#f59e0b', name: 'Amber Orange' },
  { color: '#84cc16', name: 'Lime Green' },
  { color: '#06b6d4', name: 'Light Cyan' },
  { color: '#8b5a2b', name: 'Saddle Brown' },
  { color: '#92400e', name: 'Dark Brown' },
  { color: '#451a03', name: 'Coffee Brown' },
  { color: '#78716c', name: 'Stone' },
  { color: '#57534e', name: 'Dark Stone' }
];

const cardBackgroundGradients = [
  { gradient: 'from-blue-400 to-blue-500', name: 'Blue Gradient', preview: 'linear-gradient(to right, #60a5fa, #3b82f6)' },
  { gradient: 'from-red-400 to-red-500', name: 'Red Gradient', preview: 'linear-gradient(to right, #f87171, #ef4444)' },
  { gradient: 'from-purple-400 to-purple-500', name: 'Purple Gradient', preview: 'linear-gradient(to right, #a78bfa, #8b5cf6)' },
  { gradient: 'from-orange-400 to-orange-500', name: 'Orange Gradient', preview: 'linear-gradient(to right, #fb923c, #f97316)' },
  { gradient: 'from-green-400 to-green-500', name: 'Green Gradient', preview: 'linear-gradient(to right, #4ade80, #22c55e)' },
  { gradient: 'from-pink-400 to-pink-500', name: 'Pink Gradient', preview: 'linear-gradient(to right, #f472b6, #ec4899)' },
  { gradient: 'from-yellow-400 to-yellow-500', name: 'Yellow Gradient', preview: 'linear-gradient(to right, #facc15, #eab308)' },
  { gradient: 'from-indigo-400 to-indigo-500', name: 'Indigo Gradient', preview: 'linear-gradient(to right, #818cf8, #6366f1)' },
  { gradient: 'from-teal-400 to-teal-500', name: 'Teal Gradient', preview: 'linear-gradient(to right, #2dd4bf, #14b8a6)' },
  { gradient: 'from-cyan-400 to-cyan-500', name: 'Cyan Gradient', preview: 'linear-gradient(to right, #22d3ee, #06b6d4)' },
  { gradient: 'from-emerald-400 to-emerald-500', name: 'Emerald Gradient', preview: 'linear-gradient(to right, #34d399, #10b981)' },
  { gradient: 'from-rose-400 to-rose-500', name: 'Rose Gradient', preview: 'linear-gradient(to right, #fb7185, #f43f5e)' }
];

export default function TravelAddForm({ isOpen, onClose, category, onSubmit }: TravelAddFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    currency: 'INR',
    imageUrl: '',
    affiliateUrl: '',
    sectionType: 'featured'
  });
  
  const [fieldColors, setFieldColors] = useState<{[key: string]: string}>({});
  const [fieldStyles, setFieldStyles] = useState<{[key: string]: {bold?: boolean, italic?: boolean, underline?: boolean, strikethrough?: boolean}}>({});
  const [cardBackgroundColor, setCardBackgroundColor] = useState('from-orange-400 to-orange-500');
  const [showPreview, setShowPreview] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [textColor, setTextColor] = useState('#374151');
  
  // URL extraction states
  const [extractUrl, setExtractUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showUrlExtraction, setShowUrlExtraction] = useState(false);
  const [extractionMode, setExtractionMode] = useState<'manual' | 'url'>('manual');

  const currentCategory = categoryFields[category as keyof typeof categoryFields];

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // URL extraction function - extracts travel data from booking URLs
  const extractDataFromUrl = async (url: string) => {
    setIsExtracting(true);
    try {
      // Create a comprehensive extraction endpoint
      const response = await fetch('/api/extract-travel-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url, 
          category,
          extractionType: 'comprehensive' // Extract all possible fields
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract data from URL');
      }

      const extractedData = await response.json();
      
      // Auto-populate form with extracted data
      if (extractedData.success) {
        const data = extractedData.data;
        
        // Update form data with all extracted fields
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          price: data.price || prev.price,
          originalPrice: data.originalPrice || prev.originalPrice,
          currency: data.currency || prev.currency,
          imageUrl: data.imageUrl || prev.imageUrl,
          affiliateUrl: url, // Use the original URL as affiliate URL
          
          // Category-specific fields
          ...data.categoryFields // All extracted category-specific data
        }));
        
        // Set extracted styling if available
        if (data.styling) {
          if (data.styling.cardBackground) setCardBackgroundColor(data.styling.cardBackground);
          if (data.styling.fieldColors) setFieldColors(data.styling.fieldColors);
          if (data.styling.fieldStyles) setFieldStyles(data.styling.fieldStyles);
        }
        
        toast({
          title: "Data Extracted Successfully!",
          description: `Extracted ${Object.keys(data.categoryFields || {}).length + 6} fields from the URL.`,
        });
        
        setExtractionMode('url');
      } else {
        throw new Error(extractedData.error || 'Failed to extract data');
      }
    } catch (error) {
      console.error('URL extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Could not extract data from this URL. Please fill the form manually.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUrlExtraction = () => {
    if (!extractUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid travel booking URL.",
        variant: "destructive",
      });
      return;
    }
    extractDataFromUrl(extractUrl.trim());
  };

  const handleFieldColorChange = (fieldName: string, color: string) => {
    setFieldColors(prev => ({ ...prev, [fieldName]: color }));
  };

  const handleFieldStyleChange = (fieldName: string, styleType: string, value: boolean) => {
    setFieldStyles(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [styleType]: value
      }
    }));
  };

  const ColorPicker = ({ fieldName, label }: { fieldName: string; label: string }) => {
    const currentColor = fieldColors[fieldName] || '#000000';
    const currentStyles = fieldStyles[fieldName] || {};
    
    return (
      <div className="mt-2">
        <Label className="text-xs text-gray-600">{label} Styling</Label>
        <div className="space-y-2">
          {/* Text Style Options */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleFieldStyleChange(fieldName, 'bold', !currentStyles.bold)}
              className={`px-2 py-1 text-xs border rounded font-bold transition-all ${
                currentStyles.bold 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => handleFieldStyleChange(fieldName, 'italic', !currentStyles.italic)}
              className={`px-2 py-1 text-xs border rounded italic transition-all ${
                currentStyles.italic 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => handleFieldStyleChange(fieldName, 'underline', !currentStyles.underline)}
              className={`px-2 py-1 text-xs border rounded underline transition-all ${
                currentStyles.underline 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
              title="Underline"
            >
              U
            </button>
            <button
              type="button"
              onClick={() => handleFieldStyleChange(fieldName, 'strikethrough', !currentStyles.strikethrough)}
              className={`px-2 py-1 text-xs border rounded line-through transition-all ${
                currentStyles.strikethrough 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
              title="Strikethrough"
            >
              S
            </button>
          </div>
          
          {/* Color Palette */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Color:</p>
            <div className="flex flex-wrap gap-1">
              {colorPalette.map((colorOption) => (
                <button
                  key={colorOption.color}
                  type="button"
                  onClick={() => handleFieldColorChange(fieldName, colorOption.color)}
                  className={`w-6 h-6 rounded-full border transition-all hover:scale-110 ${
                    currentColor === colorOption.color 
                      ? 'border-gray-800 shadow-md border-2' 
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>
          
          {/* Custom Color Input */}
          <div className="flex gap-1">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => handleFieldColorChange(fieldName, e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              value={currentColor}
              onChange={(e) => handleFieldColorChange(fieldName, e.target.value)}
              placeholder="#000000"
              className="text-xs h-8"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, imageUrl: result }));
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async () => {
    // Placeholder for AI image generation
    const placeholderImages = {
      flights: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=400&fit=crop',
      hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop',
      tours: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop',
      cruises: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop',
      bus: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop',
      train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&h=400&fit=crop',
      packages: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop',
      'car-rental': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=400&fit=crop'
    };
    
    const generatedUrl = placeholderImages[category as keyof typeof placeholderImages] || placeholderImages.flights;
    setFormData(prev => ({ ...prev, imageUrl: generatedUrl }));
    setImagePreview(generatedUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      category,
      fieldColors,
      fieldStyles,
      cardBackgroundColor,
      id: `${category}-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    onSubmit(submitData);
    onClose();
    // Reset form
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      currency: 'INR',
      imageUrl: '',
      affiliateUrl: '',
      sectionType: 'featured'
    });
    setFieldColors({});
    setFieldStyles({});
    setCardBackgroundColor('from-orange-400 to-orange-500');
    setImagePreview('');
  };

  if (!currentCategory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="capitalize">Add {category} Content</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="ml-auto"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            {/* URL Extraction Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Link className="w-5 h-5 text-blue-600" />
                  Smart Data Extraction
                </h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={extractionMode === 'manual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExtractionMode('manual')}
                  >
                    Manual
                  </Button>
                  <Button
                    type="button"
                    variant={extractionMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExtractionMode('url')}
                  >
                    URL Extract
                  </Button>
                </div>
              </div>
              
              {extractionMode === 'url' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Paste a travel booking URL (MakeMyTrip, Booking.com, Agoda, etc.) to automatically extract all travel details.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Paste ${category} booking URL here...`}
                      value={extractUrl}
                      onChange={(e) => setExtractUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleUrlExtraction}
                      disabled={isExtracting || !extractUrl.trim()}
                      className="px-6"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Extract Data
                        </>
                      )}
                    </Button>
                  </div>
                  {extractionMode === 'url' && formData.name && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Data extracted successfully! Review and modify fields below if needed.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div>
                   <Label htmlFor="name">Name</Label>
                   <Input
                     id="name"
                     value={formData.name}
                     onChange={(e) => handleInputChange('name', e.target.value)}
                     placeholder={`Enter ${category} name`}
                   />
                  <ColorPicker fieldName="name" label="Name" />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={`Describe this ${category}`}
                    rows={3}
                  />
                  <ColorPicker fieldName="description" label="Description" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="originalPrice">Original Price</Label>
                    <Input
                      id="originalPrice"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(curr => (
                        <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Tax and GST Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxesAmount">Taxes & Fees (Optional)</Label>
                    <Input
                      id="taxesAmount"
                      value={formData.taxesAmount || ''}
                      onChange={(e) => handleInputChange('taxesAmount', e.target.value)}
                      placeholder="695 (amount only)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstAmount">GST Amount (Optional)</Label>
                    <Input
                      id="gstAmount"
                      value={formData.gstAmount || ''}
                      onChange={(e) => handleInputChange('gstAmount', e.target.value)}
                      placeholder="150 (amount only)"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="affiliateUrl">Affiliate/Booking URL</Label>
                  <Input
                    id="affiliateUrl"
                    value={formData.affiliateUrl}
                    onChange={(e) => handleInputChange('affiliateUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              {/* Category-Specific Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{category} Details</h3>
                {currentCategory.fields.map(field => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'select' ? (
                      <Select value={formData[field.name] || ''} onValueChange={(value) => handleInputChange(field.name, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        rows={2}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                    {(field.type === 'text' || field.type === 'textarea') && (
                      <ColorPicker fieldName={field.name} label={field.label} />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Section Selection & Customization */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Display Settings</h3>
                
                <div>
                   <Label htmlFor="sectionType">Section to Display</Label>
                  <Select value={formData.sectionType} onValueChange={(value) => handleInputChange('sectionType', value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategory.sections.map(section => (
                        <SelectItem key={section.value} value={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="customSectionTitle">Custom Section Title (Optional)</Label>
                  <Input
                    id="customSectionTitle"
                    value={formData.customSectionTitle || ''}
                    onChange={(e) => handleInputChange('customSectionTitle', e.target.value)}
                    placeholder="Override default section title"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default: {currentCategory.sections.find(s => s.value === formData.sectionType)?.label}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="customSectionDescription">Custom Section Description (Optional)</Label>
                  <Textarea
                    id="customSectionDescription"
                    value={formData.customSectionDescription || ''}
                    onChange={(e) => handleInputChange('customSectionDescription', e.target.value)}
                    placeholder="Override default section description"
                    rows={2}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default description
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="cardBackgroundColor">Card Background Color</Label>
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500">Choose a gradient background for your card:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {cardBackgroundGradients.map((gradientOption) => (
                        <button
                          key={gradientOption.gradient}
                          type="button"
                          onClick={() => setCardBackgroundColor(gradientOption.gradient)}
                          className={`h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                            cardBackgroundColor === gradientOption.gradient 
                              ? 'border-gray-800 shadow-lg' 
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                          style={{ background: gradientOption.preview }}
                          title={gradientOption.name}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-gray-600">
                      Selected: <span className="font-medium">{cardBackgroundGradients.find(g => g.gradient === cardBackgroundColor)?.name || 'Orange Gradient'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Image Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Image</h3>
                
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => document.getElementById('imageUpload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button type="button" variant="outline" onClick={generateImage}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto Generate
                  </Button>
                </div>
                
                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      handleInputChange('imageUrl', e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://..."
                  />
                </div>
                
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded border" />
                  </div>
                )}
              </div>
              
              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Add {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
          
          {/* Preview Section */}
          {showPreview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {formData.imageUrl && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={formData.imageUrl}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>
                    {formData.name || 'Sample Name'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {formData.description || 'Sample description text'}
                  </p>
                  {formData.price && (
                    <div className="flex items-center justify-between">
                      <div>
                        {formData.originalPrice && (
                          <span className="text-gray-500 line-through mr-2">
                            {formData.currency} {formData.originalPrice}
                          </span>
                        )}
                        <span className="text-2xl font-bold text-blue-600">
                          {formData.currency} {formData.price}
                        </span>
                      </div>
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg">
                        Book Now
                      </button>
                    </div>
                  )}
                  <div className="mt-3 text-sm text-gray-500">
                    Section: {currentCategory.sections.find(s => s.value === formData.sectionType)?.label}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}