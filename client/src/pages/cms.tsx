import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/header';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  FileText,
  Image,
  Layout,
  Settings,
  Eye,
  Globe,
  Calendar,
  User,
  ArrowLeft
} from 'lucide-react';

// Schema for CMS Page
const cmsPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.boolean().default(false),
});

// Schema for CMS Section
const cmsSectionSchema = z.object({
  pageId: z.number(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['text', 'image', 'video', 'gallery']),
  order: z.number().default(0),
});

// Schema for CMS Media
const cmsMediaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  filename: z.string().min(1, 'Filename is required'),
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['image', 'video', 'document']),
  alt: z.string().optional(),
});

type CmsPageForm = z.infer<typeof cmsPageSchema>;
type CmsSectionForm = z.infer<typeof cmsSectionSchema>;
type CmsMediaForm = z.infer<typeof cmsMediaSchema>;

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState('pages');
  const [editingPage, setEditingPage] = useState<any>(null);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [showNewPageForm, setShowNewPageForm] = useState(false);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [showNewMediaForm, setShowNewMediaForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch CMS data
  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ['/api/cms/pages'],
  });

  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/cms/sections'],
  });

  const { data: media = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['/api/cms/media'],
  });

  // Page form
  const pageForm = useForm<CmsPageForm>({
    resolver: zodResolver(cmsPageSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      isPublished: false,
    },
  });

  // Section form
  const sectionForm = useForm<CmsSectionForm>({
    resolver: zodResolver(cmsSectionSchema),
    defaultValues: {
      pageId: 0,
      title: '',
      content: '',
      type: 'text',
      order: 0,
    },
  });

  // Media form
  const mediaForm = useForm<CmsMediaForm>({
    resolver: zodResolver(cmsMediaSchema),
    defaultValues: {
      title: '',
      filename: '',
      url: '',
      type: 'image',
      alt: '',
    },
  });

  // Create page mutation
  const createPageMutation = useMutation({
    mutationFn: async (data: CmsPageForm) => {
      return await apiRequest('/api/cms/pages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
      setShowNewPageForm(false);
      pageForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create page',
        variant: 'destructive',
      });
    },
  });

  // Update page mutation
  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CmsPageForm }) => {
      return await apiRequest(`/api/cms/pages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
      setEditingPage(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update page',
        variant: 'destructive',
      });
    },
  });

  // Delete page mutation
  const deletePageMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/cms/pages/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Page deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/pages'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive',
      });
    },
  });

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle page form submission
  const onPageSubmit = (data: CmsPageForm) => {
    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, data });
    } else {
      createPageMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 header-spacing">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Content Management System</h1>
            <p className="text-gray-400 mt-2">Manage your website content, pages, and media</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
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

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pages</h2>
              <Button 
                onClick={() => setShowNewPageForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Page
              </Button>
            </div>

            {/* New/Edit Page Form */}
            {(showNewPageForm || editingPage) && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>
                    {editingPage ? 'Edit Page' : 'Create New Page'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={pageForm.handleSubmit(onPageSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          {...pageForm.register('title')}
                          onChange={(e) => {
                            pageForm.setValue('title', e.target.value);
                            pageForm.setValue('slug', generateSlug(e.target.value));
                          }}
                          className="bg-gray-700 border-gray-600"
                        />
                        {pageForm.formState.errors.title && (
                          <p className="text-red-400 text-sm mt-1">
                            {pageForm.formState.errors.title.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          {...pageForm.register('slug')}
                          className="bg-gray-700 border-gray-600"
                        />
                        {pageForm.formState.errors.slug && (
                          <p className="text-red-400 text-sm mt-1">
                            {pageForm.formState.errors.slug.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        {...pageForm.register('content')}
                        rows={10}
                        className="bg-gray-700 border-gray-600"
                      />
                      {pageForm.formState.errors.content && (
                        <p className="text-red-400 text-sm mt-1">
                          {pageForm.formState.errors.content.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input
                          id="metaTitle"
                          {...pageForm.register('metaTitle')}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Input
                          id="metaDescription"
                          {...pageForm.register('metaDescription')}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublished"
                        {...pageForm.register('isPublished')}
                        className="rounded border-gray-600 bg-gray-700"
                      />
                      <Label htmlFor="isPublished">Published</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={createPageMutation.isPending || updatePageMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {editingPage ? 'Update Page' : 'Create Page'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewPageForm(false);
                          setEditingPage(null);
                          pageForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Pages List */}
            <div className="space-y-4">
              {pagesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading pages...</p>
                </div>
              ) : pages.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No pages created yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Create your first page to get started
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pages.map((page: any) => (
                    <Card key={page.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{page.title}</h3>
                              <Badge variant={page.isPublished ? "success" : "secondary"}>
                                {page.isPublished ? 'Published' : 'Draft'}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">
                              Slug: /{page.slug}
                            </p>
                            <p className="text-gray-300 text-sm line-clamp-2">
                              {page.content.substring(0, 150)}...
                            </p>
                            <p className="text-gray-500 text-xs mt-2">
                              Created: {new Date(page.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPage(page);
                                pageForm.reset({
                                  title: page.title,
                                  slug: page.slug,
                                  content: page.content,
                                  metaTitle: page.metaTitle || '',
                                  metaDescription: page.metaDescription || '',
                                  isPublished: page.isPublished,
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this page?')) {
                                  deletePageMutation.mutate(page.id);
                                }
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Sections</h2>
              <Button 
                onClick={() => setShowNewSectionForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Section
              </Button>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <Layout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Sections functionality coming soon</p>
                <p className="text-sm text-gray-500 mt-1">
                  Manage page sections and layouts
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Media</h2>
              <Button 
                onClick={() => setShowNewMediaForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload Media
              </Button>
            </div>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Media management coming soon</p>
                <p className="text-sm text-gray-500 mt-1">
                  Upload and manage images, videos, and documents
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}