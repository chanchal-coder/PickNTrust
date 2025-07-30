import { useState } from "react";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [showPalette, setShowPalette] = useState(false);
  
  const colorPalette = [
    // First row - basic colors
    '#000000', '#374151', '#6B7280', '#DC2626', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
    // Second row - variations  
    '#FFFFFF', '#9CA3AF', '#D1D5DB', '#FCA5A5', '#FDE047', '#FEF3C7', '#BBF7D0', '#A7F3D0', '#7DD3FC', '#93C5FD', '#C4B5FD', '#F9A8D4',
    // Third row - empty placeholders for custom colors
    ...Array(12).fill('#F3F4F6')
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 border-2 border-gray-300 rounded cursor-pointer flex items-center justify-center"
          style={{ backgroundColor: selectedColor }}
          onClick={() => setShowPalette(!showPalette)}
        >
          {selectedColor === '#F3F4F6' && <div className="w-6 h-6 bg-gray-200 rounded"></div>}
        </div>
        <div 
          className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 cursor-pointer flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform"
          onClick={() => setShowPalette(!showPalette)}
          title="Open color palette"
        >
          <Palette className="w-4 h-4 text-white drop-shadow" />
        </div>
      </div>
      
      {showPalette && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPalette(false)}
          />
          <div className="absolute top-12 left-0 z-50 bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-600">
            <div className="grid grid-cols-12 gap-1 mb-3">
              {colorPalette.map((color, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded cursor-pointer border-2 ${
                    selectedColor === color ? 'border-white shadow-lg scale-110' : 'border-gray-600 hover:border-gray-400'
                  } hover:scale-110 transition-all duration-200`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onColorChange(color);
                    setShowPalette(false);
                  }}
                  title={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="text-center text-white text-sm font-medium">Colours</div>
          </div>
        </>
      )}
    </div>
  );
}