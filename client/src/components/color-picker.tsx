import { useState } from "react";
import { Palette, ChevronDown } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [showPalette, setShowPalette] = useState(false);
  
  // Theme Colors - as shown in your image
  const themeColors = [
    ['#000000', '#4A5568', '#3182CE', '#F6AD55', '#9CA3AF', '#F6E05E', '#63B3ED', '#68D391'],
    ['#9CA3AF', '#E2E8F0', '#EBF8FF', '#FFF5F5', '#FFFAF0', '#F7FAFC', '#EDF2F7', '#F0FFF4'],
    ['#718096', '#A0AEC0', '#BEE3F8', '#FED7D7', '#FFEAA7', '#E2E8F0', '#FBD38D', '#C6F6D5'],
    ['#4A5568', '#2D3748', '#2B6CB0', '#E53E3E', '#D69E2E', '#38A169', '#3182CE', '#805AD5'],
    ['#718096', '#000000', '#1A202C', '#2C5282', '#C53030', '#B7791F', '#2F855A', '#553C9A'],
    ['#9CA3AF', '#000000', '#2A4365', '#2B6CB0', '#9B2C2C', '#975A16', '#276749', '#44337A']
  ];
  
  // Standard Colors - bright and vibrant
  const standardColors = [
    '#C53030', '#E53E3E', '#F6E05E', '#F6E05E', '#68D391', '#38A169', 
    '#63B3ED', '#3182CE', '#2B6CB0', '#805AD5'
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div 
          className="w-10 h-10 border-2 border-gray-300 dark:border-gray-600 rounded cursor-pointer flex items-center justify-center shadow-sm"
          style={{ backgroundColor: selectedColor }}
          onClick={() => setShowPalette(!showPalette)}
        >
          {!selectedColor && <div className="w-6 h-6 bg-gray-200 rounded"></div>}
        </div>
        <div 
          className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          onClick={() => setShowPalette(!showPalette)}
        >
          <ChevronDown className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        </div>
      </div>
      
      {showPalette && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPalette(false)}
          />
          <div className="absolute top-12 left-0 z-50 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-[320px]">
            
            {/* Automatic Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-black rounded"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Automatic</span>
              </div>
            </div>

            {/* Theme Colors Section */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme Colors</h4>
              <div className="space-y-1">
                {themeColors.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1">
                    {row.map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className={`w-6 h-6 cursor-pointer border border-gray-300 dark:border-gray-600 ${
                          selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-gray-400'
                        } transition-all duration-150`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          onColorChange(color);
                          setShowPalette(false);
                        }}
                        title={`Select color ${color}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Standard Colors Section */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Standard Colors</h4>
              <div className="flex gap-1 flex-wrap">
                {standardColors.map((color, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 cursor-pointer border border-gray-300 dark:border-gray-600 ${
                      selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-gray-400'
                    } transition-all duration-150`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onColorChange(color);
                      setShowPalette(false);
                    }}
                    title={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* More Colors Section */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">More Colors...</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}