import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Share2, 
  Move, 
  Image, 
  Type, 
  Video, 
  Quote,
  List,
  Grid,
  Eye,
  Save,
  Undo,
  Redo,
  Copy,
  Link,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Settings
} from 'lucide-react';

// Section types for drag-and-drop
export interface CMSSection {
  id: string;
  type: 'text' | 'image' | 'video' | 'gallery' | 'quote' | 'list' | 'grid' | 'custom';
  title: string;
  content: any;
  styles: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    padding?: string;
    alignment?: 'left' | 'center' | 'right';
    borderRadius?: string;
    boxShadow?: string;
  };
  order: number;
  visible: boolean;
}

// Pre-built section templates
const SECTION_TEMPLATES = {
  text: {
    title: 'Text Section',
    content: {
      text: '<p>Click to edit this text section. You can add <strong>bold</strong>, <em>italic</em>, and <u>underlined</u> text.</p>',
      heading: 'Your Heading Here'
    },
    styles: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontSize: '16px',
      padding: '20px',
      alignment: 'left' as const
    }
  },
  image: {
    title: 'Image Section',
    content: {
      url: 'https://via.placeholder.com/800x400/007bff/ffffff?text=Your+Image+Here',
      alt: 'Placeholder image',
      caption: 'Add your image caption here'
    },
    styles: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      alignment: 'center' as const,
      borderRadius: '8px'
    }
  },
  video: {
    title: 'Video Section',
    content: {
      url: '',
      title: 'Video Title',
      description: 'Add your video description here'
    },
    styles: {
      backgroundColor: '#000000',
      textColor: '#ffffff',
      padding: '20px',
      alignment: 'center' as const,
      borderRadius: '12px'
    }
  },
  gallery: {
    title: 'Image Gallery',
    content: {
      images: [
        { url: 'https://via.placeholder.com/300x200/007bff/ffffff?text=Image+1', alt: 'Image 1' },
        { url: 'https://via.placeholder.com/300x200/28a745/ffffff?text=Image+2', alt: 'Image 2' },
        { url: 'https://via.placeholder.com/300x200/dc3545/ffffff?text=Image+3', alt: 'Image 3' }
      ]
    },
    styles: {
      backgroundColor: '#f8f9fa',
      padding: '30px',
      borderRadius: '8px'
    }
  },
  quote: {
    title: 'Quote Section',
    content: {
      text: 'This is an inspiring quote that captures attention and adds personality to your content.',
      author: 'Famous Person',
      source: 'Source Publication'
    },
    styles: {
      backgroundColor: '#e3f2fd',
      textColor: '#1565c0',
      fontSize: '18px',
      padding: '30px',
      alignment: 'center' as const,
      borderRadius: '12px'
    }
  }
};

interface VisualCMSEditorProps {
  pageId: number;
  initialSections?: CMSSection[];
  onSave?: (sections: CMSSection[]) => void;
  onClose?: () => void;
}

export default function VisualCMSEditor({ 
  pageId, 
  initialSections = [], 
  onSave, 
  onClose 
}: VisualCMSEditorProps) {
  const [sections, setSections] = useState<CMSSection[]>(initialSections);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [undoStack, setUndoStack] = useState<CMSSection[][]>([]);
  const [redoStack, setRedoStack] = useState<CMSSection[][]>([]);
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  // Save current state for undo functionality
  const saveState = () => {
    setUndoStack(prev => [...prev, [...sections]]);
    setRedoStack([]);
  };

  // Add new section
  const addSection = (type: keyof typeof SECTION_TEMPLATES) => {
    saveState();
    const template = SECTION_TEMPLATES[type];
    const newSection: CMSSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: template.title,
      content: template.content,
      styles: template.styles,
      order: sections.length,
      visible: true
    };
    
    setSections(prev => [...prev, newSection]);
    setSelectedSection(newSection.id);
    
    toast({
      title: 'Section Added',
      description: `${template.title} has been added to your page.`
    });
  };

  // Delete section
  const deleteSection = (sectionId: string) => {
    saveState();
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setSelectedSection(null);
    
    toast({
      title: 'Section Deleted',
      description: 'The section has been removed from your page.'
    });
  };

  // Update section content
  const updateSection = (sectionId: string, updates: Partial<CMSSection>) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedSection || draggedSection === targetId) return;
    
    saveState();
    
    const draggedIndex = sections.findIndex(s => s.id === draggedSection);
    const targetIndex = sections.findIndex(s => s.id === targetId);
    
    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);
    
    // Update order
    newSections.forEach((section, index) => {
      section.order = index;
    });
    
    setSections(newSections);
    setDraggedSection(null);
    
    toast({
      title: 'Section Moved',
      description: 'Section order has been updated.'
    });
  };

  // Undo/Redo functionality
  const undo = () => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, [...sections]]);
    setSections(previousState);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, [...sections]]);
    setSections(nextState);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Copy section
  const copySection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    saveState();
    const copiedSection: CMSSection = {
      ...section,
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${section.title} (Copy)`,
      order: sections.length
    };
    
    setSections(prev => [...prev, copiedSection]);
    
    toast({
      title: 'Section Copied',
      description: 'A copy of the section has been added.'
    });
  };

  // Share section
  const shareSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const shareData = {
      title: section.title,
      text: `Check out this section: ${section.title}`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Page link has been copied to clipboard.'
      });
    }
  };

  // Save changes
  const handleSave = () => {
    onSave?.(sections);
    
    toast({
      title: 'Changes Saved',
      description: 'Your page has been updated successfully.'
    });
  };

  // Render section content based on type
  const renderSectionContent = (section: CMSSection) => {
    const { type, content, styles } = section;
    
    const commonStyles = {
      backgroundColor: styles.backgroundColor || '#ffffff',
      color: styles.textColor || '#333333',
      fontSize: styles.fontSize || '16px',
      padding: styles.padding || '20px',
      textAlign: styles.alignment || 'left',
      borderRadius: styles.borderRadius || '0px',
      boxShadow: styles.boxShadow || 'none'
    } as React.CSSProperties;

    switch (type) {
      case 'text':
        return (
          <div style={commonStyles}>
            <h3 className="text-xl font-bold mb-4">{content.heading}</h3>
            <div dangerouslySetInnerHTML={{ __html: content.text }} />
          </div>
        );
        
      case 'image':
        return (
          <div style={commonStyles}>
            <img 
              src={content.url} 
              alt={content.alt}
              className="w-full h-auto rounded-lg"
            />
            {content.caption && (
              <p className="text-sm text-gray-600 mt-2 italic">{content.caption}</p>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div style={commonStyles}>
            <h4 className="text-lg font-semibold mb-2">{content.title}</h4>
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <Video className="w-16 h-16 text-gray-400" />
            </div>
            <p className="mt-2">{content.description}</p>
          </div>
        );
        
      case 'gallery':
        return (
          <div style={commonStyles}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {content.images.map((img: any, idx: number) => (
                <img 
                  key={idx}
                  src={img.url} 
                  alt={img.alt}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        );
        
      case 'quote':
        return (
          <div style={commonStyles}>
            <Quote className="w-8 h-8 text-blue-500 mb-4" />
            <blockquote className="text-xl italic mb-4">
              "{content.text}"
            </blockquote>
            <cite className="text-sm font-medium">
              — {content.author}
              {content.source && `, ${content.source}`}
            </cite>
          </div>
        );
        
      default:
        return (
          <div style={commonStyles}>
            <p>Unknown section type: {type}</p>
          </div>
        );
    }
  };

  // Render section editor panel
  const renderSectionEditor = () => {
    if (!selectedSection) return null;
    
    const section = sections.find(s => s.id === selectedSection);
    if (!section) return null;
    
    return (
      <Card className="w-80 h-full overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Edit Section</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSection(null)}
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Section Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Section Title</label>
            <Input
              value={section.title}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
            />
          </div>
          
          {/* Content Editor */}
          {section.type === 'text' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Heading</label>
                <Input
                  value={section.content.heading}
                  onChange={(e) => updateSection(section.id, {
                    content: { ...section.content, heading: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <Textarea
                  rows={6}
                  value={section.content.text.replace(/<[^>]*>/g, '')}
                  onChange={(e) => updateSection(section.id, {
                    content: { ...section.content, text: `<p>${e.target.value}</p>` }
                  })}
                />
              </div>
            </>
          )}
          
          {section.type === 'image' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <Input
                  value={section.content.url}
                  onChange={(e) => updateSection(section.id, {
                    content: { ...section.content, url: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Caption</label>
                <Input
                  value={section.content.caption}
                  onChange={(e) => updateSection(section.id, {
                    content: { ...section.content, caption: e.target.value }
                  })}
                />
              </div>
            </>
          )}
          
          {/* Style Editor */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Styling</h4>
            
            {/* Background Color */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Background Color</label>
              <input
                type="color"
                value={section.styles.backgroundColor || '#ffffff'}
                onChange={(e) => updateSection(section.id, {
                  styles: { ...section.styles, backgroundColor: e.target.value }
                })}
                className="w-full h-10 rounded border"
              />
            </div>
            
            {/* Text Color */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Text Color</label>
              <input
                type="color"
                value={section.styles.textColor || '#333333'}
                onChange={(e) => updateSection(section.id, {
                  styles: { ...section.styles, textColor: e.target.value }
                })}
                className="w-full h-10 rounded border"
              />
            </div>
            
            {/* Font Size */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Font Size</label>
              <Input
                value={section.styles.fontSize || '16px'}
                onChange={(e) => updateSection(section.id, {
                  styles: { ...section.styles, fontSize: e.target.value }
                })}
                placeholder="16px"
              />
            </div>
            
            {/* Padding */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Padding</label>
              <Input
                value={section.styles.padding || '20px'}
                onChange={(e) => updateSection(section.id, {
                  styles: { ...section.styles, padding: e.target.value }
                })}
                placeholder="20px"
              />
            </div>
          </div>
          
          {/* Section Actions */}
          <div className="border-t pt-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copySection(section.id)}
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Section
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareSection(section.id)}
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Section
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteSection(section.id)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Section
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Section Library */}
      <div className="w-64 bg-white border-r overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold mb-4">Add Sections</h3>
          
          <div className="space-y-2">
            {Object.entries(SECTION_TEMPLATES).map(([type, template]) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => addSection(type as keyof typeof SECTION_TEMPLATES)}
                className="w-full justify-start"
              >
                {type === 'text' && <Type className="w-4 h-4 mr-2" />}
                {type === 'image' && <Image className="w-4 h-4 mr-2" />}
                {type === 'video' && <Video className="w-4 h-4 mr-2" />}
                {type === 'gallery' && <Grid className="w-4 h-4 mr-2" />}
                {type === 'quote' && <Quote className="w-4 h-4 mr-2" />}
                {template.title}
              </Button>
            ))}
          </div>
          
          {/* Section List */}
          <div className="mt-8">
            <h4 className="font-medium mb-3">Page Sections</h4>
            <div className="space-y-1">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`p-2 rounded cursor-pointer text-sm ${
                    selectedSection === section.id 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{section.title}</span>
                    <Badge variant={section.visible ? 'default' : 'secondary'}>
                      {section.visible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={undoStack.length === 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={redoStack.length === 0}
            >
              <Redo className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300" />
            
            <Button
              variant={isPreviewMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewMode ? 'Edit Mode' : 'Preview'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto">
          <div 
            ref={editorRef}
            className="max-w-4xl mx-auto p-6"
          >
            {sections.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Plus className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Building Your Page
                </h3>
                <p className="text-gray-600 mb-4">
                  Add sections from the sidebar to start creating your content.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`relative group ${
                      selectedSection === section.id && !isPreviewMode
                        ? 'ring-2 ring-blue-500' 
                        : ''
                    }`}
                    draggable={!isPreviewMode}
                    onDragStart={(e) => handleDragStart(e, section.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, section.id)}
                    onClick={() => !isPreviewMode && setSelectedSection(section.id)}
                  >
                    {/* Section Controls */}
                    {!isPreviewMode && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center space-x-1 bg-white rounded shadow-lg p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSection(section.id);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              copySection(section.id);
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareSection(section.id);
                            }}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSection(section.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {!isPreviewMode && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="secondary" className="text-xs">
                          <Move className="w-3 h-3 mr-1" />
                          {section.type}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Section Content */}
                    <div className="relative">
                      {renderSectionContent(section)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Section Editor */}
      {!isPreviewMode && selectedSection && renderSectionEditor()}
    </div>
  );
}