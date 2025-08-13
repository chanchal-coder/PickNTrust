import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GenderSwitchTabsProps {
  currentGender: string;
  onGenderChange: (gender: string) => void;
  categoryName: string;
}

export function GenderSwitchTabs({ currentGender, onGenderChange, categoryName }: GenderSwitchTabsProps) {
  return (
    <div className="flex justify-center mb-6">
      <Tabs value={currentGender} onValueChange={onGenderChange} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger 
            value="Men" 
            className="text-sm font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white"
          >
            <i className="fas fa-male mr-2"></i>
            Men
          </TabsTrigger>
          <TabsTrigger 
            value="Women"
            className="text-sm font-medium data-[state=active]:bg-pink-500 data-[state=active]:text-white"
          >
            <i className="fas fa-female mr-2"></i>
            Women
          </TabsTrigger>
          <TabsTrigger 
            value="Kids"
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