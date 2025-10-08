import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAdminPassword } from '@/config/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Trash2, Edit, Plus, Save, X, Eye, EyeOff, Rss, Globe, 
  CheckCircle, AlertCircle, Loader2, ExternalLink, Clock, TestTube
} from 'lucide-react';

const rssFeedSchema = z.object({
  name: z.string().min(1, 'RSS feed name is required'),
  url: z.string().url('Valid URL is required'),
  description: z.string().optional().default(''),
  category: z.string().min(1, 'Category is required'),
  updateFrequency: z.number().min(5, 'Update frequency must be at least 5 minutes').default(60),
  isActive: z.boolean().optional().default(true),
  autoImport: z.boolean().optional().default(true),
  contentFilter: z.string().optional().default(''),
  affiliateReplace: z.boolean().optional().default(false),
});

type RSSFeedForm = z.infer<typeof rssFeedSchema>;

interface RSSFeed {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  updateFrequency: number;
  lastFetched: string | null;
  isActive: boolean;
  autoImport: boolean;
  contentFilter: string;
  affiliateReplace: boolean;
  createdAt: string;
  updatedAt: string;
}

// Browse categories from DB for unified taxonomy
const useBrowseCategories = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/categories/browse'],
    queryFn: async () => {
      const res = await fetch('/api/categories/browse');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.categories || [];
      return list.map((c: any) => ({ id: c.id || c.slug || c.name, name: c.name || c.title || c.slug }));
    },
  });
  return { categories: data || [], isLoading, error };
};

const updateFrequencyOptions = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 360, label: '6 hours' },
  { value: 720, label: '12 hours' },
  { value: 1440, label: '24 hours' },
];

export default function RSSFeedsManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RSSFeed | null>(null);
  const [testingUrl, setTestingUrl] = useState('');
  const { toast } = useToast();

  const form = useForm<RSSFeedForm>({
    resolver: zodResolver(rssFeedSchema),
    defaultValues: {
      name: '',
      url: '',
      description: '',
      category: '',
      updateFrequency: 60,
      isActive: true,
      autoImport: true,
      contentFilter: '',
      affiliateReplace: false,
    },
  });

  // Fetch browse categories for dropdown
  const { categories: browseCategories, isLoading: categoriesLoading } = useBrowseCategories();

  // Fetch RSS feeds
  const { data: rssFeeds, isLoading } = useQuery({
    queryKey: ['/api/admin/rss-feeds'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/rss-feeds?password=${encodeURIComponent(getAdminPassword())}`);
      if (!response.ok) {
        throw new Error('Failed to fetch RSS feeds');
      }
      const data = await response.json();
      return data.rssFeeds || [];
    },
  });

  const queryClient = useQueryClient();

  // Create RSS feed mutation
  const createMutation = useMutation({
    mutationFn: async (data: RSSFeedForm) => {
      const response = await fetch('/api/admin/rss-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create RSS feed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'RSS feed created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rss-feeds'] });
      form.reset();
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update RSS feed mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RSSFeedForm> }) => {
      const response = await fetch(`/api/admin/rss-feeds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update RSS feed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'RSS feed updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rss-feeds'] });
      setEditingFeed(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete RSS feed mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/rss-feeds/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete RSS feed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'RSS feed deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rss-feeds'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle RSS feed status mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/rss-feeds/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle RSS feed status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'RSS feed status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rss-feeds'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Test RSS feed mutation
  const testMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch('/api/admin/rss-feeds/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to test RSS feed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'RSS Feed Test Successful',
        description: data.message || 'RSS feed URL is valid',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'RSS Feed Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: RSSFeedForm) => {
    if (editingFeed) {
      updateMutation.mutate({ id: editingFeed.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (feed: RSSFeed) => {
    setEditingFeed(feed);
    form.reset({
      name: feed.name,
      url: feed.url,
      description: feed.description,
      category: feed.category,
      updateFrequency: feed.updateFrequency,
      isActive: feed.isActive,
      autoImport: feed.autoImport,
      contentFilter: feed.contentFilter,
      affiliateReplace: feed.affiliateReplace,
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingFeed(null);
    setShowAddForm(false);
    form.reset();
  };

  const formatLastFetched = (lastFetched: string | null) => {
    if (!lastFetched) return 'Never';
    return new Date(lastFetched).toLocaleString();
  };

  const getStatusBadge = (feed: RSSFeed) => {
    if (!feed.isActive) {
      return <Badge variant="secondary" className="gap-1"><EyeOff className="w-3 h-3" />Inactive</Badge>;
    }
    return <Badge variant="default" className="gap-1"><Eye className="w-3 h-3" />Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading RSS feeds...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Rss className="w-6 h-6" />
            RSS Feeds Management
          </h2>
          <p className="text-muted-foreground">
            Manage external RSS feeds for content aggregation and import
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add RSS Feed
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingFeed ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingFeed ? 'Edit RSS Feed' : 'Add New RSS Feed'}
            </CardTitle>
            <CardDescription>
              {editingFeed ? 'Update RSS feed settings' : 'Add a new RSS feed source for content aggregation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Feed Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="e.g., TechCrunch Deals"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={form.watch('category')}
                    onValueChange={(value) => form.setValue('category', value)}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {browseCategories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">RSS Feed URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    {...form.register('url')}
                    placeholder="https://example.com/feed.xml"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const url = form.getValues('url');
                      if (url) {
                        testMutation.mutate(url);
                      }
                    }}
                    disabled={testMutation.isPending}
                    className="gap-2"
                  >
                    {testMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Test
                  </Button>
                </div>
                {form.formState.errors.url && (
                  <p className="text-sm text-red-500">{form.formState.errors.url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Brief description of this RSS feed source"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="updateFrequency">Update Frequency</Label>
                  <Select
                    value={form.watch('updateFrequency')?.toString()}
                    onValueChange={(value) => form.setValue('updateFrequency', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {updateFrequencyOptions.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value.toString()}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentFilter">Content Filter (JSON)</Label>
                  <Input
                    id="contentFilter"
                    {...form.register('contentFilter')}
                    placeholder='{"keywords": ["deal", "discount"]}'
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoImport"
                    checked={form.watch('autoImport')}
                    onCheckedChange={(checked) => form.setValue('autoImport', checked)}
                  />
                  <Label htmlFor="autoImport">Auto Import</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="affiliateReplace"
                    checked={form.watch('affiliateReplace')}
                    onCheckedChange={(checked) => form.setValue('affiliateReplace', checked)}
                  />
                  <Label htmlFor="affiliateReplace">Replace Affiliate Links</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingFeed ? 'Update Feed' : 'Create Feed'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* RSS Feeds List */}
      <div className="grid gap-4">
        {rssFeeds?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Rss className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No RSS feeds configured</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first RSS feed to start aggregating content from external sources.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add RSS Feed
              </Button>
            </CardContent>
          </Card>
        ) : (
          rssFeeds?.map((feed: RSSFeed) => (
            <Card key={feed.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{feed.name}</h3>
                      {getStatusBadge(feed)}
                      <Badge variant="outline">{feed.category}</Badge>
                      {feed.autoImport && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Auto Import
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <a 
                          href={feed.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary underline"
                        >
                          {feed.url}
                        </a>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      
                      {feed.description && (
                        <p>{feed.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Updates every {feed.updateFrequency} minutes
                        </div>
                        <div>
                          Last fetched: {formatLastFetched(feed.lastFetched)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMutation.mutate(feed.id)}
                      disabled={toggleMutation.isPending}
                      className="gap-2"
                    >
                      {feed.isActive ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Enable
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(feed)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this RSS feed?')) {
                          deleteMutation.mutate(feed.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}