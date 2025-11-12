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
import { useToast } from '@/hooks/use-toast';
import { 
  Trash2, Edit, Plus, Save, X, Eye, EyeOff, Globe, Shield, 
  CheckCircle, AlertCircle, Loader2, Code, Copy, ExternalLink
} from 'lucide-react';

// Allow either rawHtml OR name+content. Provider/purpose optional.
const metaTagSchema = z.object({
  rawHtml: z.string().optional(),
  name: z.string().optional(),
  content: z.string().optional(),
  provider: z.string().optional(),
  purpose: z.string().optional(),
  isActive: z.boolean().optional().default(true),
}).refine((data) => {
  const raw = (data.rawHtml || '').trim();
  const hasRaw = raw.length > 0;
  const hasStructured = Boolean((data.name || '').trim()) && Boolean((data.content || '').trim());
  return hasRaw || hasStructured;
}, { message: 'Provide raw HTML tag or name and content.' });

type MetaTagForm = z.infer<typeof metaTagSchema>;

interface MetaTag {
  id: number;
  name: string;
  content: string;
  provider: string;
  purpose: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rawHtml?: string;
}

const commonProviders = [
  { value: 'Google', label: 'Google Search Console' },
  { value: 'Facebook', label: 'Facebook Domain Verification' },
  { value: 'Bing', label: 'Bing Webmaster Tools' },
  { value: 'Pinterest', label: 'Pinterest Domain Verification' },
  { value: 'Yandex', label: 'Yandex Webmaster' },
  { value: 'Baidu', label: 'Baidu Webmaster Tools' },
  { value: 'Other', label: 'Other Provider' },
];

const commonMetaNames = [
  { value: 'google-site-verification', label: 'google-site-verification' },
  { value: 'facebook-domain-verification', label: 'facebook-domain-verification' },
  { value: 'msvalidate.01', label: 'msvalidate.01 (Bing)' },
  { value: 'p:domain_verify', label: 'p:domain_verify (Pinterest)' },
  { value: 'yandex-verification', label: 'yandex-verification' },
  { value: 'baidu-site-verification', label: 'baidu-site-verification' },
];

export default function MetaTagsManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTag, setEditingTag] = useState<MetaTag | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const form = useForm<MetaTagForm>({
    resolver: zodResolver(metaTagSchema),
    defaultValues: {
      rawHtml: '',
      name: '',
      content: '',
      provider: '',
      purpose: '',
      isActive: true,
    },
  });

  // Fetch meta tags
  const { data: metaTags, isLoading } = useQuery({
    queryKey: ['/api/admin/meta-tags'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/meta-tags?password=${encodeURIComponent(getAdminPassword())}`);
      if (!response.ok) {
        throw new Error('Failed to fetch meta tags');
      }
      const data = await response.json();
      return data.metaTags || [];
    },
  });

  const queryClient = useQueryClient();

  // Create meta tag mutation
  const createMutation = useMutation({
    mutationFn: async (data: MetaTagForm) => {
      const response = await fetch('/api/admin/meta-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create meta tag');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Meta tag created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/meta-tags'] });
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

  // Update meta tag mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MetaTagForm> }) => {
      const response = await fetch(`/api/admin/meta-tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update meta tag');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Meta tag updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/meta-tags'] });
      setEditingTag(null);
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

  // Delete meta tag mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/meta-tags/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete meta tag');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Meta tag deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/meta-tags'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle active status mutation
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/meta-tags/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: getAdminPassword() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle meta tag status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Meta tag status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/meta-tags'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: MetaTagForm) => {
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (tag: MetaTag) => {
    setEditingTag(tag);
    form.reset({
      rawHtml: tag.rawHtml || '',
      name: tag.name,
      content: tag.content,
      provider: tag.provider,
      purpose: tag.purpose,
      isActive: tag.isActive,
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setShowAddForm(false);
    form.reset();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Meta tag copied to clipboard',
    });
  };

  const generateMetaTagHTML = (tag: MetaTag) => {
    if (tag.rawHtml && tag.rawHtml.trim().length > 0) {
      return tag.rawHtml.trim();
    }
    return `<meta name="${tag.name}" content="${tag.content}" />`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meta Tags Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage website ownership verification meta tags for search engines and social platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            size="sm"
          >
            <Code className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meta Tag
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">About Meta Tags</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Meta tags for website ownership verification do not affect affiliate links. They are used by search engines 
                and social platforms to verify that you own the domain. These tags are added to the HTML head section.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {showPreview && metaTags && metaTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              HTML Preview
            </CardTitle>
            <CardDescription>
              Copy these meta tags to your website's HTML head section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
                <code>
{metaTags
  .filter((tag: MetaTag) => tag.isActive)
  .map((tag: MetaTag) => generateMetaTagHTML(tag))
  .join('\n')}
                </code>
              </pre>
            </div>
            <Button
              onClick={() => copyToClipboard(
                metaTags
                  .filter((tag: MetaTag) => tag.isActive)
                  .map((tag: MetaTag) => generateMetaTagHTML(tag))
                  .join('\n')
              )}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All Active Tags
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTag ? 'Edit Meta Tag' : 'Add New Meta Tag'}</CardTitle>
            <CardDescription>
              Add meta tags for website ownership verification. Paste the exact tag HTML or fill the fields.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="rawHtml">Raw HTML Tag (optional)</Label>
                  <Textarea
                    {...form.register('rawHtml')}
                    placeholder='Paste the exact meta tag HTML, e.g., <meta name="google-site-verification" content="TOKEN">'
                    className="font-mono"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">If provided, other fields become optional. Only meta tags are allowed.</p>
                </div>
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={form.watch('provider')}
                    onValueChange={(value) => form.setValue('provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonProviders.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* provider optional when rawHtml present */}
                </div>

                <div>
                  <Label htmlFor="name">Meta Tag Name</Label>
                  <Select
                    value={(() => {
                      const currentName = form.watch('name');
                      return currentName && commonMetaNames.some(meta => meta.value === currentName) ? currentName : undefined;
                    })()}
                    onValueChange={(value) => {
                      if (value) {
                        form.setValue('name', value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select common meta name" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonMetaNames.map((meta) => (
                        <SelectItem key={meta.value} value={meta.value}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    {...form.register('name')}
                    placeholder="Or enter custom meta name (e.g., verify-admitad)"
                    className="mt-2"
                  />
                  {/* name optional when rawHtml present */}
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content/Value</Label>
                <Input
                  {...form.register('content')}
                  placeholder="Enter the verification code or content"
                />
                {/* content optional when rawHtml present */}
              </div>

              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Input
                  {...form.register('purpose')}
                  placeholder="e.g., Site Verification, Domain Verification"
                />
                {/* purpose optional when rawHtml present */}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...form.register('isActive')}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active (include in website)</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingTag ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingTag ? 'Update Meta Tag' : 'Create Meta Tag'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Meta Tags List */}
      <div className="grid gap-4">
        {metaTags && metaTags.length > 0 ? (
          metaTags.map((tag: MetaTag) => (
            <Card key={tag.id} className={`${!tag.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={tag.isActive ? 'default' : 'secondary'}>
                        {tag.provider}
                      </Badge>
                      <Badge variant="outline">{tag.purpose}</Badge>
                      {tag.isActive ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tag.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">
                      {tag.content}
                    </p>
                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                      {generateMetaTagHTML(tag)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => copyToClipboard(generateMetaTagHTML(tag))}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => toggleMutation.mutate(tag.id)}
                      variant="outline"
                      size="sm"
                      disabled={toggleMutation.isPending}
                    >
                      {tag.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => startEdit(tag)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteMutation.mutate(tag.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Meta Tags Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add meta tags to verify your website ownership with search engines and social platforms.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Meta Tag
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}