import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GenderSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (gender: string) => void;
  categoryName: string;
}

export function GenderSelectionPopup({ isOpen, onClose, onSelect, categoryName }: GenderSelectionPopupProps) {
  const genderOptions = [
    { 
      value: 'Men', 
      icon: 'fas fa-male', 
      color: 'bg-blue-500 hover:bg-blue-600',
      description: `Men's ${categoryName}`
    },
    { 
      value: 'Women', 
      icon: 'fas fa-female', 
      color: 'bg-pink-500 hover:bg-pink-600',
      description: `Women's ${categoryName}`
    },
    { 
      value: 'Kids', 
      icon: 'fas fa-child', 
      color: 'bg-green-500 hover:bg-green-600',
      description: `Kids' ${categoryName}`
    },
    { 
      value: 'Common', 
      icon: 'fas fa-globe', 
      color: 'bg-purple-500 hover:bg-purple-600',
      description: `Common ${categoryName}`
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Choose Category for {categoryName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          {genderOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
              className={`${option.color} text-white h-16 text-lg font-medium transition-all duration-200 transform hover:scale-105`}
            >
              <i className={`${option.icon} text-2xl mr-3`}></i>
              <div className="text-center">
                <div className="font-bold">{option.value}</div>
                <div className="text-sm opacity-90">{option.description}</div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="flex justify-center pt-2">
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-32"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}