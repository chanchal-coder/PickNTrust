import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStaticBanners } from './StaticPageBanner';

interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  isActive: boolean;
  display_order: number;
  page: string;
  gradient?: string;
  icon?: string;
}

interface StaticBannerAdminProps {
  onSave?: (config: any) => void;
}

export default function StaticBannerAdmin({ onSave }: StaticBannerAdminProps) {
  const [bannerConfig, setBannerConfig] = useState<any>({});
  const [selectedPage, setSelectedPage] = useState('travel-picks');
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const pages = [
    'travel-picks', 'prime-picks', 'value-picks', 'click-picks', 
    'cue-picks', 'global-picks', 'deals-hub', 'loot-box', 
    'services', 'apps', 'videos'
  ];

  const gradientOptions = [
    'from-blue-600 via-sky-600 to-cyan-600',
    'from-purple-600 via-pink-600 to-rose-600',
    'from-green-600 via-emerald-600 to-teal-600',
    'from-red-600 via-orange-600 to-yellow-500',
    'from-indigo-500 to-purple-600',
    'from-cyan-600 via-blue-600 to-indigo-600',
    'from-green-500 to-emerald-600'
  ];

  const iconOptions = [
    'fas fa-plane', 'fas fa-bed', 'fas fa-suitcase', 'fas fa-crown',
    'fas fa-gem', 'fas fa-mouse-pointer', 'fas fa-bullseye', 'fas fa-globe',
    'fas fa-tags', 'fas fa-box-open', 'fas fa-cogs', 'fas fa-robot',
    'fas fa-play-circle', 'fas fa-star', 'fas fa-heart', 'fas fa-fire'
  ];

  // Load initial banner config
  useEffect(() => {
    const config = getStaticBanners();
    setBannerConfig(config);
  }, []);

  const handleSaveBanner = (banner: Banner) => {
    const updatedConfig = { ...bannerConfig };
    
    if (!updatedConfig[banner.page]) {
      updatedConfig[banner.page] = [];
    }

    if (isAddingNew) {
      // Add new banner
      const newId = Math.max(...Object.values(updatedConfig).flat().map((b: any) => b.id), 0) + 1;
      banner.id = newId;
      updatedConfig[banner.page].push(banner);
    } else {
      // Update existing banner
      const pageIndex = updatedConfig[banner.page].findIndex((b: Banner) => b.id === banner.id);
      if (pageIndex !== -1) {
        updatedConfig[banner.page][pageIndex] = banner;
      }
    }

    setBannerConfig(updatedConfig);
    setEditingBanner(null);
    setIsAddingNew(false);
    
    // Save to file (this would be handled by backend)
    handleSaveConfig(updatedConfig);
  };

  const handleDeleteBanner = (bannerId: number, page: string) => {
    const updatedConfig = { ...bannerConfig };
    updatedConfig[page] = updatedConfig[page].filter((b: Banner) => b.id !== bannerId);
    setBannerConfig(updatedConfig);
    handleSaveConfig(updatedConfig);
  };

  const handleSaveConfig = async (config: any) => {
    setSaveStatus('saving');
    
    try {
      // In a real implementation, this would make a POST request to save the JSON file
      const response = await fetch('/api/admin/banners/static-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config, password: 'pickntrust2025' }),
      });

      if (response.ok) {
        setSaveStatus('saved');
        if (onSave) onSave(config);
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        let msg = 'Failed to save config';
        try {
          const err = await response.json();
          msg = (err && (err.error || err.message)) || msg;
        } catch {}
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Error saving banner config:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const BannerForm = ({ banner, onSave, onCancel }: { 
    banner: Banner | null, 
    onSave: (banner: Banner) => void, 
    onCancel: () => void 
  }) => {
    const [formData, setFormData] = useState<Banner>(banner || {
      id: 0,
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      buttonText: '',
      isActive: true,
      display_order: 1,
      page: selectedPage,
      gradient: gradientOptions[0],
      icon: iconOptions[0]
    });

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{isAddingNew ? 'Add New Banner' : 'Edit Banner'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Banner title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Button Text</label>
              <Input
                value={formData.buttonText || ''}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                placeholder="Button text"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <Textarea
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Banner subtitle"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link URL</label>
              <Input
                value={formData.linkUrl || ''}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="/page-url"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Gradient</label>
              <select
                value={formData.gradient || ''}
                onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                {gradientOptions.map(gradient => (
                  <option key={gradient} value={gradient}>
                    {gradient.split(' ')[0].replace('from-', '').replace('-600', '')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <select
                value={formData.icon || ''}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                {iconOptions.map(icon => (
                  <option key={icon} value={icon}>
                    {icon.replace('fas fa-', '')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                min="1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <label className="text-sm font-medium">Active</label>
          </div>

          <div className="flex space-x-2">
            <Button onClick={() => onSave(formData)}>Save Banner</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Static Banner Management</h1>
        <div className="flex items-center space-x-2">
          {saveStatus === 'saving' && <Badge variant="secondary">Saving...</Badge>}
          {saveStatus === 'saved' && <Badge variant="default">Saved!</Badge>}
          {saveStatus === 'error' && <Badge variant="destructive">Error saving</Badge>}
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 How This Works:</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>No API Calls:</strong> Banners are loaded from a static JSON file</li>
          <li>• <strong>Admin Control:</strong> Edit banners through this interface</li>
          <li>• <strong>Instant Updates:</strong> Changes are saved to the config file</li>
          <li>• <strong>Crash-Proof:</strong> Website never crashes due to banner failures</li>
          <li>• <strong>Same Features:</strong> All current functionality maintained</li>
        </ul>
      </div>

      {(editingBanner || isAddingNew) && (
        <BannerForm
          banner={editingBanner}
          onSave={handleSaveBanner}
          onCancel={() => {
            setEditingBanner(null);
            setIsAddingNew(false);
          }}
        />
      )}

      <Tabs value={selectedPage} onValueChange={setSelectedPage}>
        <TabsList className="grid grid-cols-6 lg:grid-cols-11 mb-6">
          {pages.map(page => (
            <TabsTrigger key={page} value={page} className="text-xs">
              {page.split('-')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {pages.map(page => (
          <TabsContent key={page} value={page}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold capitalize">
                {page.replace('-', ' ')} Banners ({bannerConfig[page]?.length || 0})
              </h2>
              <Button
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingBanner(null);
                }}
              >
                Add New Banner
              </Button>
            </div>

            <div className="grid gap-4">
              {(bannerConfig[page] || []).map((banner: Banner) => (
                <Card key={banner.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{banner.title}</h3>
                          {banner.icon && <i className={banner.icon}></i>}
                          <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">Order: {banner.display_order}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {banner.subtitle}
                        </p>
                        <div className="flex space-x-4 text-xs text-gray-500">
                          <span>Button: {banner.buttonText || 'None'}</span>
                          <span>Link: {banner.linkUrl || 'None'}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBanner(banner);
                            setIsAddingNew(false);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBanner(banner.id, page)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}