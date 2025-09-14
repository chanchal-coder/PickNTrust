import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GenderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gender: string) => void;
  category: string;
}

export default function GenderSelectionModal({ isOpen, onClose, onSelect, category }: GenderSelectionModalProps) {
  if (!isOpen) return null;

  const getGenderOptions = () => {
    // For baby categories, show boys/girls/common
    if (category.toLowerCase().includes('baby') || category.toLowerCase().includes('kids') || category.toLowerCase().includes('children')) {
      return [
        { value: 'boys', label: "Baby Boy", icon: '<i className="fas fa-child"></i>', color: 'from-blue-500 to-blue-600' },
        { value: 'girls', label: "Baby Girl", icon: '<i className="fas fa-child"></i>', color: 'from-pink-500 to-pink-600' },
        { value: 'common', label: "Common", icon: '<i className="fas fa-globe"></i>', color: 'from-purple-500 to-purple-600' }
      ];
    }
    
    // For other categories, show men/women/kids/common
    return [
      { value: 'men', label: "Men's", icon: '<i className="fas fa-male"></i>', color: 'from-blue-500 to-blue-600' },
      { value: 'women', label: "Women's", icon: '<i className="fas fa-female"></i>', color: 'from-pink-500 to-pink-600' },
      { value: 'kids', label: "Kid's", icon: '<i className="fas fa-baby"></i>', color: 'from-green-500 to-green-600' },
      { value: 'common', label: "Common", icon: '<i className="fas fa-globe"></i>', color: 'from-purple-500 to-purple-600' }
    ];
  };

  const genderOptions = getGenderOptions();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Choose {category} Category
          </CardTitle>
          <CardDescription className="text-slate-300">
            Select the target audience for this category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {genderOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`w-full h-16 text-lg font-semibold bg-gradient-to-r ${option.color} hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl text-white border-0`}
            >
              <span className="text-2xl mr-3">{option.icon}</span>
              {/* For baby categories, show only the label. For others, show label + category */}
              {category.toLowerCase().includes('baby') || category.toLowerCase().includes('kids') || category.toLowerCase().includes('children') 
                ? option.label 
                : `${option.label} ${category}`
              }
            </Button>
          ))}
          
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full mt-6 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
