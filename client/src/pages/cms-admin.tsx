import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Edit, Trash2, Plus, Eye, FileText, Image, Layout, Upload } from 'lucide-react';
import type { CmsPage, CmsSection, CmsMedia } from '@shared/schema';

export default function CMSAdmin() {
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null);
  const [showPageForm, setShowPageForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [editingSection, setEditingSection] = useState<CmsSection | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest('/api/admin/auth', {
          method: 'POST',
          body: { password: 'pickntrust2025' }
        });
        if (response.success) {
          setIsAuthenticated(true);
          setAdminPassword('pickntrust2025');
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Queries
  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ['/api/cms/pages'],
    enabled: isAuthenticated
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/cms/pages', selectedPage?.id, 'sections'],
    queryFn: () => apiRequest(`/api/cms/pages/${selectedPage?.id}/sections`),
    enabled: !!selectedPage && isAuthenticated
  });

  const { data: media = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['/api/cms/media'],
    enabled: isAuthenticated
  });

  // Mutations
  const createPageMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/cms/pages', {
      method: 'POST',
      body: { ...data, password: adminPassword }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
      setShowPageForm(false);
      toast({ title: 'Page created successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to create page', variant: 'destructive' });
    }
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest(`/api/cms/pages/${id}`, {
      method: 'PUT',
      body: { ...data, password: adminPassword }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
      setEditingPage(null);
      toast({ title: 'Page updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to update page', variant: 'destructive' });
    }
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/cms/pages/${id}`, {
      method: 'DELETE',
      body: { password: adminPassword }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
      setSelectedPage(null);
      toast({ title: 'Page deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to delete page', variant: 'destructive' });
    }
  });

  const createSectionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/cms/sections', {
      method: 'POST',
      body: { ...data, password: adminPassword, pageId: selectedPage?.id }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages', selectedPage?.id, 'sections'] });
      setShowSectionForm(false);
      toast({ title: 'Section created successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to create section', variant: 'destructive' });
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest(`/api/cms/sections/${id}`, {
      method: 'PUT',
      body: { ...data, password: adminPassword }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages', selectedPage?.id, 'sections'] });
      setEditingSection(null);
      toast({ title: 'Section updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to update section', variant: 'destructive' });
    }
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/cms/sections/${id}`, {
      method: 'DELETE',
      body: { password: adminPassword }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages', selectedPage?.id, 'sections'] });
      toast({ title: 'Section deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to delete section', variant: 'destructive' });
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">CMS Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Admin Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <Button 
                onClick={async () => {
                  try {
                    const response = await apiRequest('/api/admin/auth', {
                      method: 'POST',
                      body: { password: adminPassword }
                    });
                    if (response.success) {
                      setIsAuthenticated(true);
                      toast({ title: 'Authentication successful!' });
                    }
                  } catch (error) {
                    toast({ title: 'Invalid password', variant: 'destructive' });
                  }
                }}
                className="w-full"
              >
                Access CMS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Content Management System
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your website content, pages, and media
          </p>
        </div>

        <Tabs defaultValue="pages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Pages</h2>
              <Button onClick={() => setShowPageForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Page
              </Button>
            </div>

            <div className="grid gap-4">
              {pagesLoading ? (
                <div>Loading pages...</div>
              ) : pages.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No pages created yet</p>
                  </CardContent>
                </Card>
              ) : (
                pages.map((page: CmsPage) => (
                  <Card key={page.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedPage(page)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{page.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">/{page.slug}</p>
                          <Badge variant={page.isPublished ? 'default' : 'secondary'} className="mt-2">
                            {page.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            setEditingPage(page);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Page</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{page.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePageMutation.mutate(page.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            {selectedPage ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">Sections for "{selectedPage.title}"</h2>
                    <p className="text-gray-600 dark:text-gray-400">/{selectedPage.slug}</p>
                  </div>
                  <Button onClick={() => setShowSectionForm(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Section
                  </Button>
                </div>

                <div className="grid gap-4">
                  {sectionsLoading ? (
                    <div>Loading sections...</div>
                  ) : sections.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No sections created yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    sections.map((section: CmsSection) => (
                      <Card key={section.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold">{section.title}</h3>
                              <Badge variant="outline" className="mt-1">
                                {section.type}
                              </Badge>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">
                                {section.content.slice(0, 100)}...
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => setEditingSection(section)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Section</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{section.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteSectionMutation.mutate(section.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a page from the Pages tab to manage its sections
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Media Library</h2>
              <Button onClick={() => setShowMediaUpload(true)} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Media
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mediaLoading ? (
                <div>Loading media...</div>
              ) : media.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No media uploaded yet</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                media.map((item: CmsMedia) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {item.mimeType.startsWith('image/') ? (
                        <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <FileText className="w-8 h-8 mx-auto text-gray-400" />
                          <p className="text-xs text-gray-500 mt-1">{item.originalName}</p>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {item.originalName}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Page Form Dialog */}
        <Dialog open={showPageForm} onOpenChange={setShowPageForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
            </DialogHeader>
            <PageForm
              onSubmit={(data) => createPageMutation.mutate(data)}
              onCancel={() => setShowPageForm(false)}
              isLoading={createPageMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Page Dialog */}
        <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Page</DialogTitle>
            </DialogHeader>
            {editingPage && (
              <PageForm
                initialData={editingPage}
                onSubmit={(data) => updatePageMutation.mutate({ id: editingPage.id, data })}
                onCancel={() => setEditingPage(null)}
                isLoading={updatePageMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Section Form Dialog */}
        <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
            </DialogHeader>
            <SectionForm
              onSubmit={(data) => createSectionMutation.mutate(data)}
              onCancel={() => setShowSectionForm(false)}
              isLoading={createSectionMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Section Dialog */}
        <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Section</DialogTitle>
            </DialogHeader>
            {editingSection && (
              <SectionForm
                initialData={editingSection}
                onSubmit={(data) => updateSectionMutation.mutate({ id: editingSection.id, data })}
                onCancel={() => setEditingSection(null)}
                isLoading={updateSectionMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Page Form Component
function PageForm({ initialData, onSubmit, onCancel, isLoading }: {
  initialData?: CmsPage;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    metaDescription: initialData?.metaDescription || '',
    isPublished: initialData?.isPublished || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Page title"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug</label>
        <Input
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          placeholder="page-url-slug"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Meta Description</label>
        <Textarea
          value={formData.metaDescription}
          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
          placeholder="SEO meta description"
          rows={3}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublished"
          checked={formData.isPublished}
          onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
        />
        <label htmlFor="isPublished" className="text-sm font-medium">
          Published
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

// Section Form Component
function SectionForm({ initialData, onSubmit, onCancel, isLoading }: {
  initialData?: CmsSection;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    type: initialData?.type || 'text',
    content: initialData?.content || '',
    sortOrder: initialData?.sortOrder || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Section title"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="html">HTML</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="gallery">Gallery</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Content</label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Section content"
          rows={6}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Sort Order</label>
        <Input
          type="number"
          value={formData.sortOrder}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}