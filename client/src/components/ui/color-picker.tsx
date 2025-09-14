import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, Palette, Plus } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({ value, onChange, label, className = "" }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rgbMode, setRgbMode] = useState('RGB');
  const [customColors, setCustomColors] = useState<string[]>([]);

  // Theme Colors (organized in rows as shown in image)
  const themeColors = [
    // Row 1
    ['#000000', '#7F7F7F', '#880015', '#ED1C24', '#FF7F27', '#FFF200', '#22B14C', '#00A2E8', '#3F48CC', '#A349A4'],
    // Row 2  
    ['#FFFFFF', '#C3C3C3', '#B97A57', '#FFAEC9', '#FFC90E', '#EFE4B0', '#B5E61D', '#99D9EA', '#7092BE', '#C8BFE7'],
    // Row 3
    ['#F7F7F7', '#A0A0A0', '#C49C94', '#F7977A', '#F9AD81', '#FDC68A', '#C4DF9B', '#A2D2FF', '#738BD7', '#D8A1D6'],
    // Row 4
    ['#E6E6E6', '#7F7F7F', '#A67C52', '#F15A24', '#F26522', '#F7931E', '#8DC73F', '#39B54A', '#00AEEF', '#652C91'],
    // Row 5
    ['#CCCCCC', '#595959', '#8C6239', '#C1272D', '#E4002B', '#F15A29', '#8CC63F', '#00A651', '#0071BC', '#92278F'],
    // Row 6
    ['#B3B3B3', '#3F3F3F', '#603813', '#9E0B0F', '#DA020E', '#DD4124', '#79B82F', '#00A99D', '#0054A6', '#6B1E99']
  ];

  // Standard Colors (single row as shown in image)
  const standardColors = [
    '#E74C3C', '#F39C12', '#F1C40F', '#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6', '#E67E22', '#95A5A6', '#34495E'
  ];

  // Basic Colors for advanced editor (organized in grid)
  const basicColors = [
    // Row 1
    ['#FFB3BA', '#FF6B6B', '#8B4513', '#CD5C5C', '#DC143C', '#AFEEEE', '#40E0D0', '#4169E1', '#6495ED', '#98FB98'],
    // Row 2
    ['#FFEB9C', '#FFD700', '#DEB887', '#D2691E', '#FF4500', '#DA70D6', '#9370DB', '#4B0082', '#483D8B', '#C0C0C0'],
    // Row 3
    ['#90EE90', '#32CD32', '#228B22', '#006400', '#FFB6C1', '#FF1493', '#DC143C', '#B22222', '#8A2BE2', '#9400D3'],
    // Row 4
    ['#98FB98', '#00FA9A', '#00CED1', '#9932CC', '#FF6347', '#FF8C00', '#FFD700', '#808080', '#696969', '#2F4F4F']
  ];

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgb = hexToRgb(value);
  const [rgbValues, setRgbValues] = useState(rgb);

  const handleRgbChange = (component: 'r' | 'g' | 'b', newValue: number) => {
    const newRgb = { ...rgbValues, [component]: newValue };
    setRgbValues(newRgb);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const addCustomColor = (color: string) => {
    if (!customColors.includes(color) && customColors.length < 24) {
      setCustomColors([...customColors, color]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && <Label className="text-white font-medium mb-2 block">{label}</Label>}
      
      {/* Color Display Button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded border-2 border-gray-600 cursor-pointer"
            style={{ backgroundColor: value }}
            onClick={() => setIsOpen(!isOpen)}
          />
          <button
            type="button"
            className="text-gray-400 text-sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-gray-900 border-gray-600 text-white flex-1"
          placeholder="#3b82f6"
        />
      </div>

      {/* Color Picker Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 z-50 w-80 mt-2 bg-gray-800 border-gray-600">
          <CardContent className="p-4 space-y-4">
            {/* Automatic Option */}
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-white text-sm">Automatic</span>
            </div>

            {/* Theme Colors */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Theme Colors</h4>
              <div className="space-y-1">
                {themeColors.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1">
                    {row.map((color, colorIndex) => (
                      <button
                        key={colorIndex}
                        className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          onChange(color);
                          setIsOpen(false);
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Standard Colors */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Standard Colors</h4>
              <div className="flex gap-1">
                {standardColors.map((color, index) => (
                  <button
                    key={index}
                    className="w-6 h-6 rounded border border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      onChange(color);
                      setIsOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* More Colors Button */}
            <Button
              variant="ghost"
              className="w-full text-blue-400 hover:bg-gray-700 justify-start"
              onClick={() => setShowAdvanced(true)}
            >
              <Palette className="w-4 h-4 mr-2" />
              More Colors...
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Advanced Color Editor Modal */}
      {showAdvanced && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[600px] max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">Edit colours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Gradient and RGB Controls */}
              <div className="flex gap-6">
                {/* Color Gradient */}
                <div className="flex-1">
                  <div 
                    className="w-full h-48 rounded-lg relative cursor-crosshair"
                    style={{
                      background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                    }}
                  >
                    <div 
                      className="absolute w-4 h-4 border-2 border-white rounded-full transform -translate-x-2 -translate-y-2"
                      style={{ left: '10%', top: '20%' }}
                    />
                  </div>
                  
                  {/* Brightness Slider */}
                  <div className="mt-4 flex items-center gap-3">
                    <div 
                      className="w-full h-6 rounded"
                      style={{
                        background: 'linear-gradient(to right, #000000, #ffffff)',
                      }}
                    />
                    <div className="w-4 h-6 bg-white border border-gray-400 rounded" />
                  </div>
                </div>

                {/* RGB Controls */}
                <div className="w-48 space-y-4">
                  <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="#3b82f6"
                  />
                  
                  <Select value={rgbMode} onValueChange={setRgbMode}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="RGB" className="text-white">RGB</SelectItem>
                      <SelectItem value="HSL" className="text-white">HSL</SelectItem>
                      <SelectItem value="HSV" className="text-white">HSV</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* RGB Sliders */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-white text-sm mb-1">
                        <span>Red</span>
                        <span>{rgbValues.r}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={rgbValues.r}
                        onChange={(e) => handleRgbChange('r', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none slider-thumb"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-white text-sm mb-1">
                        <span>Green</span>
                        <span>{rgbValues.g}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={rgbValues.g}
                        onChange={(e) => handleRgbChange('g', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none slider-thumb"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-white text-sm mb-1">
                        <span>Blue</span>
                        <span>{rgbValues.b}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={rgbValues.b}
                        onChange={(e) => handleRgbChange('b', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none slider-thumb"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Colors */}
              <div>
                <h4 className="text-white text-sm font-medium mb-3">Basic colours</h4>
                <div className="space-y-2">
                  {basicColors.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2">
                      {row.map((color, colorIndex) => (
                        <button
                          key={colorIndex}
                          className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            onChange(color);
                            addCustomColor(color);
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Customised Colors */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-white text-sm font-medium">Customised colours</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => addCustomColor(value)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 24 }, (_, index) => (
                    <button
                      key={index}
                      className="w-8 h-8 rounded border-2 border-dashed border-gray-600 hover:border-gray-400 transition-colors"
                      style={{ 
                        backgroundColor: customColors[index] || 'transparent',
                        borderStyle: customColors[index] ? 'solid' : 'dashed'
                      }}
                      onClick={() => {
                        if (customColors[index]) {
                          onChange(customColors[index]);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvanced(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowAdvanced(false);
                    setIsOpen(false);
                    addCustomColor(value);
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  OK
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .slider-thumb::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `
      }} />
    </div>
  );
}
