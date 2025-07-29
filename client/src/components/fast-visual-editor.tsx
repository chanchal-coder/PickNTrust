import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Monitor, Tablet, Smartphone, Plus, Save, Trash2, Edit3, Type, 
  Image, Link, Square, Palette, Settings, X, Home, FileText,
  ShoppingBag, Users, ExternalLink, Code, Eye, EyeOff
} from 'lucide-react';

const DEVICE_SIZES = {
  desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', height: '812px', icon: Smartphone, label: 'Mobile' }
};

const FONT_FAMILIES = [
  'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
  'Courier New', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat'
];

interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'link' | 'section';
  content: string;
  styles: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    border?: string;
  };
  attributes?: {
    href?: string;
    alt?: string;
    src?: string;
  };
}

interface FastVisualEditorProps {
  onClose?: () => void;
}

export default function FastVisualEditor({ onClose }: FastVisualEditorProps) {
  const [currentDevice, setCurrentDevice] = useState<keyof typeof DEVICE_SIZES>('desktop');
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [showElementPanel, setShowElementPanel] = useState(false);
  const [showPageManager, setShowPageManager] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [currentPage, setCurrentPage] = useState('/');
  const [pages, setPages] = useState([
    { id: 'home', name: 'Homepage', url: '/', isActive: true },
    { id: 'privacy', name: 'Privacy Policy', url: '/privacy', isActive: false },
    { id: 'terms', name: 'Terms of Service', url: '/terms', isActive: false },
    { id: 'about', name: 'About Us', url: '/about', isActive: false }
  ]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fast data loading
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured'],
    staleTime: 5 * 60 * 1000,
  });

  // Save changes mutation
  const saveChangesMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/website-changes', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Changes Saved',
        description: 'Your website changes have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
    },
    onError: () => {
      toast({
        title: 'Save Failed',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Create new page
  const createPage = () => {
    const name = prompt('Enter page name:');
    const url = prompt('Enter page URL (e.g., /new-page):');
    
    if (name && url) {
      const newPage = {
        id: `page-${Date.now()}`,
        name,
        url,
        isActive: false
      };
      setPages(prev => [...prev, newPage]);
      setCurrentPage(url);
      toast({
        title: 'Page Created',
        description: `${name} page has been created successfully.`,
      });
    }
  };

  // Navigate to page
  const navigateToPage = (url: string) => {
    setCurrentPage(url);
    setPages(prev => prev.map(p => ({ ...p, isActive: p.url === url })));
  };

  // Add new element
  const addElement = (type: EditableElement['type']) => {
    const newElement: EditableElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? 'New Text Element' : 
               type === 'button' ? 'Click Me' :
               type === 'link' ? 'New Link' : 
               type === 'image' ? 'Image' : 'New Section',
      styles: {
        color: '#000000',
        backgroundColor: type === 'button' ? '#3b82f6' : 'transparent',
        fontSize: '16px',
        fontFamily: 'Inter',
        fontWeight: 'normal',
        padding: '8px 16px',
        margin: '8px',
        borderRadius: type === 'button' ? '6px' : '0px',
        border: 'none'
      },
      attributes: type === 'link' ? { href: '#' } : 
                 type === 'image' ? { src: '', alt: 'Image' } : {}
    };
    
    setSelectedElement(newElement);
    setShowElementPanel(true);
  };

  // Save element
  const saveElement = () => {
    if (!selectedElement) return;
    
    saveChangesMutation.mutate({
      type: 'add_element',
      element: selectedElement,
      page: currentPage,
      timestamp: new Date().toISOString()
    });
    
    setShowElementPanel(false);
    setSelectedElement(null);
  };

  // Delete element
  const deleteElement = () => {
    if (!selectedElement) return;
    
    saveChangesMutation.mutate({
      type: 'delete_element',
      elementId: selectedElement.id,
      page: currentPage,
      timestamp: new Date().toISOString()
    });
    
    setShowElementPanel(false);
    setSelectedElement(null);
    
    toast({
      title: 'Element Deleted',
      description: 'The element has been removed from the page.',
    });
  };

  // Update element property
  const updateElement = (property: string, value: any) => {
    if (!selectedElement) return;
    
    if (property.startsWith('styles.')) {
      const styleProp = property.replace('styles.', '');
      setSelectedElement({
        ...selectedElement,
        styles: { ...selectedElement.styles, [styleProp]: value }
      });
    } else if (property.startsWith('attributes.')) {
      const attrProp = property.replace('attributes.', '');
      setSelectedElement({
        ...selectedElement,
        attributes: { ...selectedElement.attributes, [attrProp]: value }
      });
    } else {
      setSelectedElement({
        ...selectedElement,
        [property]: value
      });
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Left Sidebar - Tools & Pages */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Visual Editor</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Device Selector */}
          <div className="flex gap-1 bg-gray-700 rounded-lg p-1">
            {Object.entries(DEVICE_SIZES).map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <Button
                  key={key}
                  variant={currentDevice === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentDevice(key as keyof typeof DEVICE_SIZES)}
                  className="flex-1"
                >
                  <IconComponent className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Pages Manager */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Pages</h3>
            <Button variant="outline" size="sm" onClick={createPage}>
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {pages.map(page => (
              <Button
                key={page.id}
                variant={page.isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => navigateToPage(page.url)}
                className="w-full justify-start text-xs"
              >
                <Home className="w-3 h-3 mr-2" />
                {page.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Element Tools */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Add Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => addElement('text')}>
              <Type className="w-3 h-3 mr-1" />
              Text
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElement('button')}>
              <Square className="w-3 h-3 mr-1" />
              Button
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElement('image')}>
              <Image className="w-3 h-3 mr-1" />
              Image
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElement('link')}>
              <Link className="w-3 h-3 mr-1" />
              Link
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 flex-1">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigateToPage('/')}>
              <ShoppingBag className="w-3 h-3 mr-2" />
              Manage Products
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigateToPage('/')}>
              <FileText className="w-3 h-3 mr-2" />
              Manage Blog
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {
              toast({
                title: 'Analytics',
                description: `${(products as any[]).length} products, ${(categories as any[]).length} categories`
              });
            }}>
              <Users className="w-3 h-3 mr-2" />
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Page: {currentPage}</span>
            <span className="text-sm text-gray-400">Device: {DEVICE_SIZES[currentDevice].label}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditMode(!isEditMode)}>
              {isEditMode ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {isEditMode ? 'Preview' : 'Edit'}
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              Open Site
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-600 p-4 overflow-auto">
          <div 
            className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
              width: DEVICE_SIZES[currentDevice].width,
              height: DEVICE_SIZES[currentDevice].height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <div className="h-full p-8 text-black">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Pick N Trust</h1>
                <p className="text-gray-600">Your trusted shopping companion</p>
              </div>
              
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-4">Welcome to Visual Editor</h2>
                  <p className="text-gray-600 mb-6">Click "Add Elements" to start building your page</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Products</h3>
                    <p className="text-sm text-gray-600">{(products as any[]).length} featured products</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Categories</h3>
                    <p className="text-sm text-gray-600">{(categories as any[]).length} categories</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Element Editor */}
      {showElementPanel && selectedElement && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Edit Element</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowElementPanel(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Content */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Content</Label>
              {selectedElement.type === 'text' || selectedElement.type === 'button' ? (
                <Textarea
                  value={selectedElement.content}
                  onChange={(e) => updateElement('content', e.target.value)}
                  className="bg-gray-700 border-gray-600"
                  rows={3}
                />
              ) : selectedElement.type === 'image' ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Image URL"
                    value={selectedElement.attributes?.src || ''}
                    onChange={(e) => updateElement('attributes.src', e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                  <Input
                    placeholder="Alt text"
                    value={selectedElement.attributes?.alt || ''}
                    onChange={(e) => updateElement('attributes.alt', e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              ) : selectedElement.type === 'link' ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Link text"
                    value={selectedElement.content}
                    onChange={(e) => updateElement('content', e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                  <Input
                    placeholder="Link URL"
                    value={selectedElement.attributes?.href || ''}
                    onChange={(e) => updateElement('attributes.href', e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              ) : null}
            </div>

            {/* Styling */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Styling</Label>
              <div className="space-y-4">
                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Text Color</Label>
                    <input
                      type="color"
                      value={selectedElement.styles.color || '#000000'}
                      onChange={(e) => updateElement('styles.color', e.target.value)}
                      className="w-full h-8 rounded border border-gray-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Background</Label>
                    <input
                      type="color"
                      value={selectedElement.styles.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElement('styles.backgroundColor', e.target.value)}
                      className="w-full h-8 rounded border border-gray-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Font */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Font Family</Label>
                    <Select 
                      value={selectedElement.styles.fontFamily || 'Inter'}
                      onValueChange={(value) => updateElement('styles.fontFamily', value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Font Size</Label>
                    <Select 
                      value={selectedElement.styles.fontSize || '16px'}
                      onValueChange={(value) => updateElement('styles.fontSize', value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12px">12px</SelectItem>
                        <SelectItem value="14px">14px</SelectItem>
                        <SelectItem value="16px">16px</SelectItem>
                        <SelectItem value="18px">18px</SelectItem>
                        <SelectItem value="20px">20px</SelectItem>
                        <SelectItem value="24px">24px</SelectItem>
                        <SelectItem value="32px">32px</SelectItem>
                        <SelectItem value="48px">48px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400 mb-1 block">Font Weight</Label>
                  <Select 
                    value={selectedElement.styles.fontWeight || 'normal'}
                    onValueChange={(value) => updateElement('styles.fontWeight', value)}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">Thin</SelectItem>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semi Bold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="900">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Spacing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Padding</Label>
                    <Input
                      placeholder="8px 16px"
                      value={selectedElement.styles.padding || ''}
                      onChange={(e) => updateElement('styles.padding', e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Margin</Label>
                    <Input
                      placeholder="8px"
                      value={selectedElement.styles.margin || ''}
                      onChange={(e) => updateElement('styles.margin', e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400 mb-1 block">Border Radius</Label>
                  <Input
                    placeholder="6px"
                    value={selectedElement.styles.borderRadius || ''}
                    onChange={(e) => updateElement('styles.borderRadius', e.target.value)}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <Button 
                onClick={saveElement} 
                className="w-full"
                disabled={saveChangesMutation.isPending}
              >
                {saveChangesMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Element
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={deleteElement} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Element
              </Button>
              <Button variant="outline" onClick={() => setShowElementPanel(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}