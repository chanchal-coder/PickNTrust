import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Monitor, Tablet, Smartphone, Plus, Save, Trash2, Eye, EyeOff,
  ExternalLink, X, Home, Type, Image, Square, Link2, Palette,
  Settings, Code, RefreshCw
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

interface TrueVisualEditorProps {
  onClose?: () => void;
}

export default function TrueVisualEditor({ onClose }: TrueVisualEditorProps) {
  const [currentDevice, setCurrentDevice] = useState<keyof typeof DEVICE_SIZES>('desktop');
  const [currentPage, setCurrentPage] = useState('/');
  const [isEditMode, setIsEditMode] = useState(true);
  const [showElementPanel, setShowElementPanel] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [editingContent, setEditingContent] = useState('');
  const [elementStyles, setElementStyles] = useState({
    color: '#000000',
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontFamily: 'Inter',
    fontWeight: 'normal',
    padding: '8px',
    margin: '8px',
    borderRadius: '0px'
  });
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Available pages
  const [pages] = useState([
    { id: 'home', name: 'Homepage', url: '/', icon: Home },
    { id: 'privacy', name: 'Privacy Policy', url: '/privacy', icon: Settings },
    { id: 'terms', name: 'Terms of Service', url: '/terms', icon: Settings },
    { id: 'about', name: 'About Us', url: '/about', icon: Settings }
  ]);

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
    },
    onError: () => {
      toast({
        title: 'Save Failed',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Setup iframe click handling
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isEditMode) return;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Inject edit mode CSS
        const style = iframeDoc.createElement('style');
        style.textContent = `
          .editable-element {
            outline: 2px dashed #3b82f6 !important;
            cursor: pointer !important;
            position: relative !important;
          }
          .editable-element:hover {
            outline: 2px solid #3b82f6 !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
          .edit-overlay {
            position: absolute;
            top: -25px;
            left: 0;
            background: #3b82f6;
            color: white;
            padding: 2px 6px;
            font-size: 11px;
            border-radius: 3px;
            z-index: 10000;
            pointer-events: none;
          }
        `;
        iframeDoc.head.appendChild(style);

        // Make elements editable
        const editableSelectors = [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'a', 'button',
          '.product-name', '.product-price', '.category-name', '.blog-title',
          '.hero-title', '.hero-subtitle', '.section-title'
        ];

        editableSelectors.forEach(selector => {
          const elements = iframeDoc.querySelectorAll(selector);
          elements.forEach((element, index) => {
            if (element.textContent?.trim()) {
              element.classList.add('editable-element');
              element.setAttribute('data-element-type', getElementType(element));
              element.setAttribute('data-element-id', `${selector.replace(/[^a-zA-Z]/g, '')}-${index}`);
              
              // Add overlay
              const overlay = iframeDoc.createElement('div');
              overlay.className = 'edit-overlay';
              overlay.textContent = getElementType(element).toUpperCase();
              element.style.position = 'relative';
              element.appendChild(overlay);

              // Add click handler
              element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleElementClick(element);
              });
            }
          });
        });

      } catch (error) {
        console.warn('Could not access iframe content for editing:', error);
      }
    };

    iframe.addEventListener('load', handleIframeLoad);
    return () => iframe.removeEventListener('load', handleIframeLoad);
  }, [currentPage, isEditMode]);

  // Get element type
  const getElementType = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'button') return 'button';
    if (tagName === 'a') return 'link';
    if (tagName === 'img') return 'image';
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) return 'heading';
    return 'text';
  };

  // Handle element click
  const handleElementClick = (element: Element) => {
    const elementData = {
      id: element.getAttribute('data-element-id'),
      type: element.getAttribute('data-element-type'),
      content: element.textContent || '',
      tagName: element.tagName.toLowerCase(),
      selector: element.getAttribute('data-element-id'),
      href: element.getAttribute('href'),
      src: element.getAttribute('src'),
      alt: element.getAttribute('alt')
    };

    setSelectedElement(elementData);
    setEditingContent(elementData.content);
    
    // Extract current styles
    const computedStyles = window.getComputedStyle(element);
    setElementStyles({
      color: rgbToHex(computedStyles.color) || '#000000',
      backgroundColor: rgbToHex(computedStyles.backgroundColor) || 'transparent',
      fontSize: computedStyles.fontSize || '16px',
      fontFamily: computedStyles.fontFamily.split(',')[0].replace(/['"]/g, '') || 'Inter',
      fontWeight: computedStyles.fontWeight || 'normal',
      padding: computedStyles.padding || '8px',
      margin: computedStyles.margin || '8px',
      borderRadius: computedStyles.borderRadius || '0px'
    });
    
    setShowElementPanel(true);
  };

  // RGB to Hex converter
  const rgbToHex = (rgb: string) => {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return 'transparent';
    const result = rgb.match(/\d+/g);
    if (!result) return '';
    return '#' + result.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
  };

  // Create new page
  const createNewPage = () => {
    const name = prompt('Enter page name:');
    const url = prompt('Enter page URL (e.g., /new-page):');
    
    if (name && url) {
      saveChangesMutation.mutate({
        type: 'create_page',
        name,
        url,
        timestamp: new Date().toISOString()
      });
      
      setCurrentPage(url);
      toast({
        title: 'Page Created',
        description: `${name} page has been created.`,
      });
    }
  };

  // Add new element to page
  const addElementToPage = (elementType: string) => {
    const element = {
      type: elementType,
      content: elementType === 'text' ? 'New Text Element' :
               elementType === 'button' ? 'Click Me' :
               elementType === 'heading' ? 'New Heading' :
               elementType === 'link' ? 'New Link' : 'New Element',
      styles: elementStyles,
      page: currentPage
    };

    saveChangesMutation.mutate({
      type: 'add_element',
      element,
      page: currentPage,
      timestamp: new Date().toISOString()
    });

    toast({
      title: 'Element Added',
      description: `${elementType} element has been added to the page.`,
    });
  };

  // Save element changes
  const saveElementChanges = () => {
    if (!selectedElement) return;

    const changes = {
      type: 'update_element',
      elementId: selectedElement.id,
      content: editingContent,
      styles: elementStyles,
      page: currentPage,
      timestamp: new Date().toISOString()
    };

    saveChangesMutation.mutate(changes);
    setShowElementPanel(false);
    setSelectedElement(null);

    // Apply changes to iframe element
    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (iframeDoc) {
        const element = iframeDoc.querySelector(`[data-element-id="${selectedElement.id}"]`);
        if (element) {
          element.textContent = editingContent;
          Object.assign(element.style, elementStyles);
        }
      }
    } catch (error) {
      console.warn('Could not apply changes to iframe:', error);
    }
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

    // Remove from iframe
    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
      if (iframeDoc) {
        const element = iframeDoc.querySelector(`[data-element-id="${selectedElement.id}"]`);
        if (element) {
          element.remove();
        }
      }
    } catch (error) {
      console.warn('Could not remove element from iframe:', error);
    }

    setShowElementPanel(false);
    setSelectedElement(null);
    
    toast({
      title: 'Element Deleted',
      description: 'The element has been removed.',
    });
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
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

        {/* Pages */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Pages</h3>
            <Button variant="outline" size="sm" onClick={createNewPage}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="space-y-1">
            {pages.map(page => {
              const IconComponent = page.icon;
              return (
                <Button
                  key={page.id}
                  variant={currentPage === page.url ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page.url)}
                  className="w-full justify-start text-xs"
                >
                  <IconComponent className="w-3 h-3 mr-2" />
                  {page.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Add Elements */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold mb-3">Add Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => addElementToPage('text')}>
              <Type className="w-3 h-3 mr-1" />
              Text
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElementToPage('button')}>
              <Square className="w-3 h-3 mr-1" />
              Button
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElementToPage('image')}>
              <Image className="w-3 h-3 mr-1" />
              Image
            </Button>
            <Button variant="outline" size="sm" onClick={() => addElementToPage('link')}>
              <Link2 className="w-3 h-3 mr-1" />
              Link
            </Button>
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="text-xs text-gray-400 space-y-2">
            <div>Page: {currentPage}</div>
            <div>Device: {DEVICE_SIZES[currentDevice].label}</div>
            <div className={`flex items-center gap-1 ${isEditMode ? 'text-green-400' : 'text-yellow-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isEditMode ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              {isEditMode ? 'Edit Mode' : 'Preview Mode'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Page: {currentPage} / Device: {DEVICE_SIZES[currentDevice].label}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {isEditMode ? 'Preview' : 'Edit'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(currentPage, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Open Site
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-600 p-4 overflow-auto">
          <div 
            className="mx-auto bg-white shadow-lg"
            style={{
              width: DEVICE_SIZES[currentDevice].width,
              height: DEVICE_SIZES[currentDevice].height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <iframe
              ref={iframeRef}
              src={currentPage}
              className="w-full h-full border-0"
              title="Website Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Element Editor */}
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
              <Textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="bg-gray-700 border-gray-600"
                rows={3}
              />
            </div>

            {/* Link URL (for links) */}
            {selectedElement.type === 'link' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Link URL</Label>
                <Input
                  value={selectedElement.href || ''}
                  onChange={(e) => setSelectedElement({...selectedElement, href: e.target.value})}
                  className="bg-gray-700 border-gray-600"
                  placeholder="https://example.com"
                />
              </div>
            )}

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
                      value={elementStyles.color}
                      onChange={(e) => setElementStyles({...elementStyles, color: e.target.value})}
                      className="w-full h-8 rounded border border-gray-600 cursor-pointer"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Background</Label>
                    <input
                      type="color"
                      value={elementStyles.backgroundColor === 'transparent' ? '#ffffff' : elementStyles.backgroundColor}
                      onChange={(e) => setElementStyles({...elementStyles, backgroundColor: e.target.value})}
                      className="w-full h-8 rounded border border-gray-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Font */}
                <div>
                  <Label className="text-xs text-gray-400 mb-1 block">Font Family</Label>
                  <Select 
                    value={elementStyles.fontFamily}
                    onValueChange={(value) => setElementStyles({...elementStyles, fontFamily: value})}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Font Size</Label>
                    <Select 
                      value={elementStyles.fontSize}
                      onValueChange={(value) => setElementStyles({...elementStyles, fontSize: value})}
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
                  <div>
                    <Label className="text-xs text-gray-400 mb-1 block">Font Weight</Label>
                    <Select 
                      value={elementStyles.fontWeight}
                      onValueChange={(value) => setElementStyles({...elementStyles, fontWeight: value})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semi Bold</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <Button 
                onClick={saveElementChanges} 
                className="w-full"
                disabled={saveChangesMutation.isPending}
              >
                {saveChangesMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="destructive" onClick={deleteElement} className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Element
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}