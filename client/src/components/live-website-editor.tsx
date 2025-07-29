import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Image,
  Type,
  Video,
  Layout,
  Palette,
  Settings,
  Layers,
  RefreshCw,
  ExternalLink,
  Zap,
  Code,
  Database,
  Users,
  ShoppingBag,
  FileText,
  Star,
  Tag,
  Menu,
  X
} from 'lucide-react';

// Device viewport sizes
const DEVICE_SIZES = {
  desktop: { width: '100%', height: '100%', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', height: '812px', icon: Smartphone, label: 'Mobile' }
};

interface LiveWebsiteEditorProps {
  onClose?: () => void;
}

interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'link' | 'section' | 'product' | 'blog';
  content: any;
  selector: string;
  page: string;
}

interface PageStructure {
  id: string;
  name: string;
  url: string;
  sections: string[];
  isEditable: boolean;
}

export default function LiveWebsiteEditor({ onClose }: LiveWebsiteEditorProps) {
  const [currentDevice, setCurrentDevice] = useState<keyof typeof DEVICE_SIZES>('desktop');
  const [currentUrl, setCurrentUrl] = useState('/');
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [showElementPanel, setShowElementPanel] = useState(false);
  const [showPageManager, setShowPageManager] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [showCode, setShowCode] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch website data
  const { data: pages = [] } = useQuery({
    queryKey: ['/api/cms/pages'],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured'],
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['/api/blog'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Page structure for navigation
  const [pageStructure] = useState<PageStructure[]>([
    { id: 'home', name: 'Homepage', url: '/', sections: ['hero', 'categories', 'products', 'blog', 'newsletter'], isEditable: true },
    { id: 'categories', name: 'Categories', url: '/categories', sections: ['header', 'category-grid', 'footer'], isEditable: true },
    { id: 'about', name: 'About Us', url: '/about', sections: ['content'], isEditable: true },
    { id: 'contact', name: 'Contact', url: '/contact', sections: ['form', 'info'], isEditable: true },
  ]);

  // Save changes mutation
  const saveChangesMutation = useMutation({
    mutationFn: async (changes: any) => {
      return await apiRequest('/api/admin/website-changes', {
        method: 'POST',
        body: JSON.stringify(changes)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Changes Saved',
        description: 'Your website changes have been applied successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Navigate to different page
  const navigateToPage = (url: string) => {
    setCurrentUrl(url);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    if (!iframeRef.current || !isEditMode) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;

      // Add edit mode styles
      const style = iframeDoc.createElement('style');
      style.textContent = `
        .editor-highlight {
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 2px !important;
          cursor: pointer !important;
          position: relative !important;
        }
        .editor-highlight:hover {
          outline: 2px solid #3b82f6 !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
        .editor-selected {
          outline: 2px solid #10b981 !important;
          background-color: rgba(16, 185, 129, 0.1) !important;
        }
      `;
      iframeDoc.head.appendChild(style);

      // Make elements editable
      const editableSelectors = [
        'h1, h2, h3, h4, h5, h6',
        'p',
        '.editable-text',
        '.product-name',
        '.product-description',
        '.blog-title',
        '.blog-excerpt',
        'button:not(.admin-button)',
        '.hero-title',
        '.hero-subtitle',
        '.section-title'
      ];

      editableSelectors.forEach(selector => {
        const elements = iframeDoc.querySelectorAll(selector);
        elements.forEach((element: Element) => {
          element.classList.add('editor-highlight');
          element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Remove previous selection
            iframeDoc.querySelectorAll('.editor-selected').forEach(el => {
              el.classList.remove('editor-selected');
            });
            
            // Add selection to clicked element
            element.classList.add('editor-selected');
            
            // Set selected element
            setSelectedElement({
              id: element.id || `element_${Date.now()}`,
              type: getElementType(element),
              content: element.textContent || '',
              selector: selector,
              page: currentUrl
            });
            
            setEditingText(element.textContent || '');
            setShowElementPanel(true);
          });
        });
      });

      // Make images editable
      const images = iframeDoc.querySelectorAll('img');
      images.forEach((img: Element) => {
        img.classList.add('editor-highlight');
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          setSelectedElement({
            id: img.id || `img_${Date.now()}`,
            type: 'image',
            content: (img as HTMLImageElement).src,
            selector: 'img',
            page: currentUrl
          });
          
          setShowElementPanel(true);
        });
      });

    } catch (error) {
      console.log('Cannot access iframe content due to CORS policy');
    }
  };

  // Get element type
  const getElementType = (element: Element): EditableElement['type'] => {
    const tagName = element.tagName.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(tagName)) return 'text';
    if (tagName === 'img') return 'image';
    if (tagName === 'a') return 'link';
    if (element.classList.contains('product')) return 'product';
    if (element.classList.contains('blog')) return 'blog';
    return 'section';
  };

  // Save element changes
  const saveElementChanges = () => {
    if (!selectedElement) return;

    const changes = {
      elementId: selectedElement.id,
      type: selectedElement.type,
      content: editingText,
      selector: selectedElement.selector,
      page: selectedElement.page,
      timestamp: new Date().toISOString()
    };

    saveChangesMutation.mutate(changes);
    setShowElementPanel(false);
    setSelectedElement(null);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-semibold text-white">Live Website Editor</h1>
          </div>
          
          {/* Device Selector */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
            {Object.entries(DEVICE_SIZES).map(([key, device]) => {
              const Icon = device.icon;
              return (
                <Button
                  key={key}
                  variant={currentDevice === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentDevice(key as keyof typeof DEVICE_SIZES)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {device.label}
                </Button>
              );
            })}
          </div>

          {/* Edit Mode Toggle */}
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2"
          >
            {isEditMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isEditMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Page Manager */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPageManager(!showPageManager)}
          >
            <Layout className="w-4 h-4 mr-2" />
            Pages
          </Button>

          {/* Code View */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
          >
            <Code className="w-4 h-4 mr-2" />
            Code
          </Button>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => iframeRef.current?.contentWindow?.location.reload()}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Close */}
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Page Manager */}
        {showPageManager && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Site Structure</h3>
              
              <div className="space-y-2">
                {pageStructure.map((page) => (
                  <div
                    key={page.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentUrl === page.url 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => navigateToPage(page.url)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{page.name}</span>
                      {page.isEditable && <Edit3 className="w-3 h-3" />}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{page.url}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {page.sections.map((section) => (
                        <Badge key={section} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Page
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Manage Products
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Manage Blog
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    User Analytics
                  </Button>
                </div>
              </div>

              {/* Website Stats */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Live Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Products:</span>
                    <span className="text-white">{products.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Blog Posts:</span>
                    <span className="text-white">{blogPosts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Categories:</span>
                    <span className="text-white">{categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pages:</span>
                    <span className="text-white">{pages.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* URL Bar */}
          <div className="bg-gray-700 border-b border-gray-600 p-3 flex items-center space-x-3">
            <Globe className="w-4 h-4 text-gray-400" />
            <Input
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && navigateToPage(currentUrl)}
              className="flex-1 bg-gray-600 border-gray-500 text-white"
              placeholder="Enter URL to navigate..."
            />
            <Button
              size="sm"
              onClick={() => navigateToPage(currentUrl)}
            >
              Go
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(currentUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Website Preview */}
          <div className="flex-1 bg-gray-600 p-4 overflow-auto">
            <div 
              className="mx-auto bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{
                width: DEVICE_SIZES[currentDevice].width,
                height: DEVICE_SIZES[currentDevice].height,
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            >
              {showCode ? (
                <div className="h-full p-4 bg-gray-900 text-green-400 font-mono text-sm overflow-auto">
                  <div className="mb-4">
                    <span className="text-blue-400">&lt;!</span>
                    <span className="text-gray-400">-- Live Website Code View --</span>
                    <span className="text-blue-400">&gt;</span>
                  </div>
                  <div className="space-y-2">
                    <div><span className="text-purple-400">&lt;html&gt;</span></div>
                    <div className="ml-4"><span className="text-purple-400">&lt;head&gt;</span></div>
                    <div className="ml-8"><span className="text-blue-400">&lt;title&gt;</span>PickNTrust - Your Trusted Shopping Companion<span className="text-blue-400">&lt;/title&gt;</span></div>
                    <div className="ml-4"><span className="text-purple-400">&lt;/head&gt;</span></div>
                    <div className="ml-4"><span className="text-purple-400">&lt;body&gt;</span></div>
                    <div className="ml-8 text-gray-400">// Current Page: {currentUrl}</div>
                    <div className="ml-8 text-gray-400">// Edit Mode: {isEditMode ? 'ON' : 'OFF'}</div>
                    <div className="ml-8 text-gray-400">// Device: {DEVICE_SIZES[currentDevice].label}</div>
                    <div className="ml-4"><span className="text-purple-400">&lt;/body&gt;</span></div>
                    <div><span className="text-purple-400">&lt;/html&gt;</span></div>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full h-full border-0"
                  onLoad={handleIframeLoad}
                  title="Website Preview"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Element Editor */}
        {showElementPanel && selectedElement && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Edit Element</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowElementPanel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Element Info */}
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Element Type</div>
                  <Badge variant="secondary">{selectedElement.type}</Badge>
                  <div className="text-sm text-gray-400 mt-2 mb-1">Page</div>
                  <div className="text-sm text-white">{selectedElement.page}</div>
                </div>

                {/* Content Editor */}
                {selectedElement.type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Text Content
                    </label>
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={4}
                      className="bg-gray-600 border-gray-500 text-white"
                      placeholder="Enter text content..."
                    />
                  </div>
                )}

                {selectedElement.type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Image URL
                    </label>
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="bg-gray-600 border-gray-500 text-white"
                      placeholder="Enter image URL..."
                    />
                  </div>
                )}

                {/* Style Controls */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Styling</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Text Color</label>
                      <input
                        type="color"
                        className="w-full h-8 rounded border border-gray-500"
                        defaultValue="#ffffff"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Background Color</label>
                      <input
                        type="color"
                        className="w-full h-8 rounded border border-gray-500"
                        defaultValue="#000000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Font Size</label>
                      <Select defaultValue="16px">
                        <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12px">12px</SelectItem>
                          <SelectItem value="14px">14px</SelectItem>
                          <SelectItem value="16px">16px</SelectItem>
                          <SelectItem value="18px">18px</SelectItem>
                          <SelectItem value="24px">24px</SelectItem>
                          <SelectItem value="32px">32px</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={saveElementChanges}
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
                        Save Changes
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowElementPanel(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4 text-gray-400">
          <span>Device: {DEVICE_SIZES[currentDevice].label}</span>
          <span>Page: {currentUrl}</span>
          <span className={`flex items-center gap-1 ${isEditMode ? 'text-green-400' : 'text-yellow-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isEditMode ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            {isEditMode ? 'Edit Mode' : 'Preview Mode'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-400">
          <span>Last saved: Never</span>
          <Button variant="ghost" size="sm" className="text-blue-400">
            Auto-save: ON
          </Button>
        </div>
      </div>
    </div>
  );
}