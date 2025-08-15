import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GenderSwitchTabsProps {
  currentGender: string;
  onGenderChange: (gender: string) => void;
  categoryName: string;
}

export function GenderSwitchTabs({ currentGender, onGenderChange, categoryName }: GenderSwitchTabsProps) {
  // Check if this is a baby category
  const isBabyCategory = categoryName.toLowerCase().includes('baby') || categoryName.toLowerCase().includes('kids');
  
  if (isBabyCategory) {
    return (
      <div className="flex justify-center mb-6">
        <Tabs value={currentGender} onValueChange={onGenderChange} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger 
              value="boys" 
              className="text-sm font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <i className="fas fa-male mr-2"></i>
              Baby Boy
            </TabsTrigger>
            <TabsTrigger 
              value="girls"
              className="text-sm font-medium data-[state=active]:bg-pink-500 data-[state=active]:text-white"
            >
              <i className="fas fa-female mr-2"></i>
              Baby Girl
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-6">
      <Tabs value={currentGender} onValueChange={onGenderChange} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger 
            value="men" 
            className="text-sm font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <i className="fas fa-male mr-2"></i>
            Men
          </TabsTrigger>
          <TabsTrigger 
            value="women"
            className="text-sm font-medium data-[state=active]:bg-pink-500 data-[state=active]:text-white"
          >
            <i className="fas fa-female mr-2"></i>
            Women
          </TabsTrigger>
          <TabsTrigger 
            value="kids"
            className="text-sm font-medium data-[state=active]:bg-green-500 data-[state=active]:text-white"
          >
            <i className="fas fa-child mr-2"></i>
            Kids
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
