import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Move, 
  Image, 
  Type, 
  Video, 
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Instagram,
  Eye,
  Save,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface Section {
  id: string;
  type: 'hero' | 'text' | 'image' | 'video' | 'gallery' | 'testimonial' | 'cta';
  content: any;
  order: number;
}

interface VisualCMSEditorProps {
  pageId: number;
  sections: Section[];
  onSave: (sections: Section[]) => void;
}

const sectionTemplates = {
  hero: {
    title: 'Hero Section',
    icon: Type,
    defaultContent: {
      title: 'Welcome to Our Site',
      subtitle: 'Your trusted companion for everything',
      backgroundImage: '',
      ctaText: 'Get Started',
      ctaLink: '#'
    }
  },
  text: {
    title: 'Text Block',
    icon: Type,
    defaultContent: {
      content: '<p>Enter your text content here...</p>'
    }
  },
  image: {
    title: 'Image Block',
    icon: Image,
    defaultContent: {
      src: '',
      alt: '',
      caption: ''
    }
  },
  video: {
    title: 'Video Block',
    icon: Video,
    defaultContent: {
      src: '',
      title: '',
      description: ''
    }
  },
  gallery: {
    title: 'Image Gallery',
    icon: Image,
    defaultContent: {
      images: []
    }
  },
  testimonial: {
    title: 'Testimonial',
    icon: Type,
    defaultContent: {
      quote: 'This is an amazing service!',
      author: 'Happy Customer',
      rating: 5
    }
  },
  cta: {
    title: 'Call to Action',
    icon: Type,
    defaultContent: {
      title: 'Ready to Get Started?',
      description: 'Join thousands of satisfied customers',
      buttonText: 'Sign Up Now',
      buttonLink: '#'
    }
  }
};

export default function VisualCMSEditor({ pageId, sections: initialSections, onSave }: VisualCMSEditorProps) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [history, setHistory] = useState<Section[][]>([initialSections]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const editorRef = useRef<HTMLDivElement>(null);

  // Rich text editor toolbar
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  // Add new section
  const addSection = (type: keyof typeof sectionTemplates) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      content: sectionTemplates[type].defaultContent,
      order: sections.length
    };
    
    const newSections = [...sections, newSection];
    setSections(newSections);
    saveToHistory(newSections);
    setShowTemplates(false);
    
    toast({
      title: 'Section Added',
      description: `${sectionTemplates[type].title} has been added to your page.`
    });
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    const newSections = sections.filter(s => s.id !== sectionId);
    setSections(newSections);
    saveToHistory(newSections);
    
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  // Update section content
  const updateSection = (sectionId: string, newContent: any) => {
    const newSections = sections.map(s => 
      s.id === sectionId ? { ...s, content: newContent } : s
    );
    setSections(newSections);
    saveToHistory(newSections);
  };

  // Drag and drop functionality
  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    
    if (!draggedSection) return;
    
    const draggedIndex = sections.findIndex(s => s.id === draggedSection);
    const targetIndex = sections.findIndex(s => s.id === targetSectionId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);
    
    // Update order
    newSections.forEach((section, index) => {
      section.order = index;
    });
    
    setSections(newSections);
    saveToHistory(newSections);
    setDraggedSection(null);
  };

  // History management
  const saveToHistory = (newSections: Section[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSections);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setSections(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setSections(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  // Share section
  const shareSection = (section: Section, platform: string) => {
    const sectionContent = JSON.stringify(section.content);
    const shareText = `Check out this amazing content from PickNTrust!`;
    const shareUrl = window.location.href;
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        shareLink = `https://web.whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C`;
        break;
      case 'instagram':
        navigator.clipboard.writeText(shareText + '\n\n' + shareUrl);
        window.open('https://www.instagram.com/', '_blank');
        toast({
          title: 'Instagram Ready!',
          description: 'Content copied to clipboard. Paste to create your post!'
        });
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  // Render section editor
  const renderSectionEditor = (section: Section) => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <Input
              value={section.content.title || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, title: e.target.value })}
              placeholder="Hero title"
              className="text-2xl font-bold"
            />
            <Input
              value={section.content.subtitle || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, subtitle: e.target.value })}
              placeholder="Hero subtitle"
            />
            <Input
              value={section.content.backgroundImage || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, backgroundImage: e.target.value })}
              placeholder="Background image URL"
            />
            <div className="flex gap-2">
              <Input
                value={section.content.ctaText || ''}
                onChange={(e) => updateSection(section.id, { ...section.content, ctaText: e.target.value })}
                placeholder="Button text"
                className="flex-1"
              />
              <Input
                value={section.content.ctaLink || ''}
                onChange={(e) => updateSection(section.id, { ...section.content, ctaLink: e.target.value })}
                placeholder="Button link"
                className="flex-1"
              />
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-4">
            {/* Rich Text Editor Toolbar */}
            <div className="flex gap-1 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <Button size="sm" variant="outline" onClick={() => formatText('bold')}>
                <Bold className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => formatText('italic')}>
                <Italic className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => formatText('underline')}>
                <Underline className="w-4 h-4" />
              </Button>
              <div className="w-px bg-gray-300 mx-1" />
              <Button size="sm" variant="outline" onClick={() => formatText('justifyLeft')}>
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => formatText('justifyCenter')}>
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => formatText('justifyRight')}>
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div
              ref={editorRef}
              contentEditable
              className="min-h-32 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              dangerouslySetInnerHTML={{ __html: section.content.content || '' }}
              onInput={(e) => {
                const content = e.currentTarget.innerHTML;
                updateSection(section.id, { ...section.content, content });
              }}
            />
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-4">
            <Input
              value={section.content.src || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, src: e.target.value })}
              placeholder="Image URL"
            />
            <Input
              value={section.content.alt || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, alt: e.target.value })}
              placeholder="Alt text"
            />
            <Input
              value={section.content.caption || ''}
              onChange={(e) => updateSection(section.id, { ...section.content, caption: e.target.value })}
              placeholder="Caption (optional)"
            />
            {section.content.src && (
              <img 
                src={section.content.src} 
                alt={section.content.alt}
                className="max-w-full h-auto rounded-lg"
              />
            )}
          </div>
        );
      
      default:
        return (
          <Textarea
            value={JSON.stringify(section.content, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateSection(section.id, parsed);
              } catch (error) {
                // Invalid JSON, ignore
              }
            }}
            className="font-mono text-sm"
          />
        );
    }
  };

  // Render section preview
  const renderSectionPreview = (section: Section) => {
    switch (section.type) {
      case 'hero':
        return (
          <div 
            className="relative min-h-64 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg flex items-center justify-center text-center"
            style={{
              backgroundImage: section.content.backgroundImage ? `url(${section.content.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div>
              <h1 className="text-4xl font-bold mb-4">{section.content.title}</h1>
              <p className="text-xl mb-8">{section.content.subtitle}</p>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                {section.content.ctaText}
              </Button>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div 
            className="prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: section.content.content }}
          />
        );
      
      case 'image':
        return (
          <div className="text-center">
            {section.content.src && (
              <img 
                src={section.content.src} 
                alt={section.content.alt}
                className="max-w-full h-auto rounded-lg mx-auto"
              />
            )}
            {section.content.caption && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {section.content.caption}
              </p>
            )}
          </div>
        );
      
      default:
        return (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <pre className="text-sm">{JSON.stringify(section.content, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-screen">
      {/* Editor Panel */}
      <div className="flex flex-col">
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex gap-2">
            <Button 
              onClick={undo} 
              disabled={historyIndex <= 0}
              size="sm"
              variant="outline"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button 
              onClick={redo} 
              disabled={historyIndex >= history.length - 1}
              size="sm"
              variant="outline"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowTemplates(true)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
            <Button 
              onClick={() => onSave(sections)}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Page
            </Button>
          </div>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sections.map((section) => (
            <Card 
              key={section.id}
              className={`cursor-pointer transition-all ${
                selectedSection === section.id ? 'ring-2 ring-blue-500' : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section.id)}
              onClick={() => setSelectedSection(section.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-gray-400" />
                    <Badge variant="outline">
                      {sectionTemplates[section.type]?.title || section.type}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1">
                    {/* Share Buttons */}
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareSection(section, 'facebook');
                        }}
                      >
                        <Facebook className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareSection(section, 'twitter');
                        }}
                      >
                        <Twitter className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareSection(section, 'whatsapp');
                        }}
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSection(section.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {selectedSection === section.id && renderSectionEditor(section)}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Choose Section Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(sectionTemplates).map(([key, template]) => {
                  const IconComponent = template.icon;
                  return (
                    <Button
                      key={key}
                      variant="outline"
                      className="h-20 flex-col gap-2"
                      onClick={() => addSection(key as keyof typeof sectionTemplates)}
                    >
                      <IconComponent className="w-6 h-6" />
                      <span className="text-sm">{template.title}</span>
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowTemplates(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Panel */}
      <div className="border-l bg-white dark:bg-gray-900">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <h3 className="font-semibold">Live Preview</h3>
          </div>
        </div>
        
        <div className="p-4 space-y-6 overflow-y-auto h-full">
          {sections.map((section) => (
            <div key={section.id} className="border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-lg">
              {renderSectionPreview(section)}
            </div>
          ))}
          
          {sections.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
              <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sections yet. Add your first section to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}