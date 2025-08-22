import { useState } from "react";
import { Palette, ChevronDown } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const [showPalette, setShowPalette] = useState(false);
  const [showAdvancedPicker, setShowAdvancedPicker] = useState(false);
  
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

  // Advanced Color Picker - Basic Colors (as shown in your image)
  const basicColors = [
    // Row 1 - Reds, Cyans, Blues
    ['#FFB3BA', '#FF7979', '#8B4A47', '#C0392B', '#A93226', '#00CEC9', '#00B894', '#3498DB', '#2980B9', '#1ABC9C', '#16A085', '#2C3E50'],
    // Row 2 - Yellows, Oranges, Purples  
    ['#FFEB9C', '#F1C40F', '#F39C12', '#E67E22', '#D35400', '#9B59B6', '#8E44AD', '#3742FA', '#2F3542', '#A4B0BE', '#57606F', '#2F3542'],
    // Row 3 - Greens, Pinks
    ['#90EE90', '#2ECC71', '#27AE60', '#16A085', '#138D75', '#F8BBD9', '#E91E63', '#AD1457', '#880E4F', '#6C5CE7', '#A29BFE', '#74B9FF'],
    // Row 4 - Mixed colors
    ['#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6', '#E74C3C', '#E67E22', '#F1C40F', '#95A5A6', '#34495E', '#2C3E50', '#FFFFFF', '#000000']
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
              <div 
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                onClick={() => {
                  setShowPalette(false);
                  setShowAdvancedPicker(true);
                }}
              >
                <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">More Colors...</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Advanced Color Picker Modal */}
      {showAdvancedPicker && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-50" 
            onClick={() => setShowAdvancedPicker(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Edit colours</h3>
              </div>

              {/* Color Picker Area */}
              <div className="p-6">
                <div className="flex gap-6 mb-6">
                  {/* Color Gradient */}
                  <div className="relative">
                    <div 
                      className="w-80 h-64 rounded-lg bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 to-purple-500 cursor-crosshair"
                      style={{
                        background: `linear-gradient(to right, 
                          #ff0000 0%, #ffff00 16.66%, #00ff00 33.33%, 
                          #00ffff 50%, #0000ff 66.66%, #ff00ff 83.33%, #ff0000 100%),
                          linear-gradient(to top, #000000 0%, transparent 50%, #ffffff 100%)`
                      }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        // Simple color calculation based on position
                        const hue = (x / rect.width) * 360;
                        const saturation = 100;
                        const lightness = 100 - (y / rect.height) * 100;
                        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                        onColorChange(color);
                      }}
                    >
                      <div className="absolute top-2 left-2 w-3 h-3 bg-white border-2 border-black rounded-full"></div>
                    </div>
                  </div>

                  {/* Brightness Slider */}
                  <div className="w-6 h-64 bg-gradient-to-t from-black to-white rounded cursor-pointer">
                    <div className="absolute w-8 h-3 bg-white border border-black rounded -ml-1 mt-32"></div>
                  </div>

                  {/* Controls */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <input 
                        type="text" 
                        value={selectedColor}
                        onChange={(e) => onColorChange(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        placeholder="#000000"
                      />
                    </div>
                    
                    <div>
                      <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                        <option>RGB</option>
                        <option>HSL</option>
                        <option>HEX</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Red</span>
                        <input type="range" min="0" max="255" className="flex-1 mx-3" />
                        <span className="text-sm w-8">0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Green</span>
                        <input type="range" min="0" max="255" className="flex-1 mx-3" />
                        <span className="text-sm w-8">0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Blue</span>
                        <input type="range" min="0" max="255" className="flex-1 mx-3" />
                        <span className="text-sm w-8">0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Colors Section */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Basic colours</h4>
                  <div className="space-y-2">
                    {basicColors.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex gap-2">
                        {row.map((color, colorIndex) => (
                          <div
                            key={colorIndex}
                            className="w-8 h-8 rounded cursor-pointer border border-gray-600 hover:border-gray-400 transition-colors"
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              onColorChange(color);
                              setShowAdvancedPicker(false);
                            }}
                            title={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customised Colors Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium">Customised colours</h4>
                    <div className="w-6 h-6 border-2 border-dashed border-gray-500 rounded cursor-pointer flex items-center justify-center">
                      <span className="text-gray-400 text-lg">+</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {Array(24).fill(null).map((_, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 border-2 border-dashed border-gray-600 rounded cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between p-4 border-t border-gray-700">
                <button 
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-medium transition-colors"
                  onClick={() => setShowAdvancedPicker(false)}
                >
                  OK
                </button>
                <button 
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
                  onClick={() => setShowAdvancedPicker(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}