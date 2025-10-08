/**
 * Bot Admin Panel - Manage 8-bot system with method selection
 * Provides interface for controlling all bots and their methods
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, Settings, Activity, Plus, Trash2, Edit } from 'lucide-react';
import UniversalPageLayout from '@/components/UniversalPageLayout';

interface AffiliateTag {
  id: number;
  botName: string;
  networkName: string;
  affiliateTag: string;
  tagType: 'url' | 'parameter' | 'wrapper';
  priority: number;
  isActive: boolean;
  commissionRate: number;
  successRate: number;
  lastUsed?: string;
}

interface BotStatus {
  botName: string;
  displayName: string;
  status: 'active' | 'inactive' | 'error' | 'conflict';
  currentMethod: 'telegram' | 'scraping' | 'api';
  methodsAvailable: string[];
  tableName: string;
  affiliateNetwork: string;
  isEnabled: boolean;
  performance: {
    dealsProcessed: number;
    successRate: number;
    avgResponseTime: number;
  };
  errorCount: number;
  conflictCount: number;
  lastActivity?: number;
  affiliateTags?: AffiliateTag[];
  commissionRateMethod?: 'manual' | 'scraping' | 'api' | 'performance';
}

interface SystemHealth {
  totalBots: number;
  activeBots: number;
  errorBots: number;
  healthPercentage: number;
  isHealthy: boolean;
}

const BotAdmin: React.FC = () => {
  const [bots, setBots] = useState<BotStatus[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [editingTag, setEditingTag] = useState<AffiliateTag | null>(null);
  const [newTag, setNewTag] = useState({
    networkName: '',
    affiliateTag: '',
    tagType: 'parameter' as 'url' | 'parameter' | 'wrapper',
    commissionRate: 0
  });
  const [showAddTag, setShowAddTag] = useState<string | null>(null);
  const [showCommissionSettings, setShowCommissionSettings] = useState<string | null>(null);
  const [uploadingCSV, setUploadingCSV] = useState<string | null>(null);

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/admin/bots/status');
      const data = await response.json();
      
      if (data.success) {
        setBots(data.data.bots);
        setSystemHealth(data.data.overview);
        
        // Fetch affiliate tags for each bot
        await fetchAffiliateTags();
      }
    } catch (error) {
      console.error('Error fetching bot status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Global bot processing toggle state
  const [processingEnabled, setProcessingEnabled] = useState<boolean>(true);
  const [processingLastChangedAt, setProcessingLastChangedAt] = useState<string | undefined>(undefined);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [processingLoading, setProcessingLoading] = useState<boolean>(false);
  const [masterBotStatus, setMasterBotStatus] = useState<{ initialized?: boolean; webhook?: { url?: string; pending_update_count?: number } } | null>(null);

  const fetchProcessingStatus = async () => {
    try {
      const res = await fetch('/api/admin/bot/processing');
      const data = await res.json();
      if (typeof data.enabled === 'boolean') {
        setProcessingEnabled(data.enabled);
        setProcessingLastChangedAt(data.lastChangedAt);
      }
    } catch (err) {
      console.error('Failed to fetch bot processing status:', err);
    }
  };

  const fetchMasterBotStatus = async () => {
    try {
      const res = await fetch('/api/bot/status');
      const data = await res.json();
      setMasterBotStatus(data);
    } catch (err) {
      console.error('Failed to fetch master bot status:', err);
    }
  };

  const toggleProcessing = async (enabled: boolean) => {
    try {
      setProcessingLoading(true);
      const res = await fetch('/api/admin/bot/processing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPassword ? { 'x-admin-password': adminPassword } : {}),
        },
        body: JSON.stringify({ enabled, password: adminPassword || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to update' }));
        alert(`Failed to update processing: ${err.message || res.status}`);
        return;
      }
      const data = await res.json();
      setProcessingEnabled(!!data.enabled);
    } catch (err) {
      console.error('Failed to toggle processing:', err);
    } finally {
      setProcessingLoading(false);
    }
  };

  const fetchAffiliateTags = async () => {
    try {
      const response = await fetch('/api/admin/bots/affiliate-tags');
      if (response.ok) {
        const tags = await response.json();
        setBots(prevBots => 
          prevBots.map(bot => ({
            ...bot,
            affiliateTags: tags.filter((tag: AffiliateTag) => tag.botName === bot.botName)
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch affiliate tags:', error);
    }
  };

  const addAffiliateTag = async (botName: string) => {
    try {
      const response = await fetch('/api/admin/bots/affiliate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName,
          ...newTag
        })
      });
      
      if (response.ok) {
        await fetchAffiliateTags();
        setNewTag({ networkName: '', affiliateTag: '', tagType: 'parameter', commissionRate: 0 });
        setShowAddTag(null);
      }
    } catch (error) {
      console.error('Failed to add affiliate tag:', error);
    }
  };

  const updateAffiliateTag = async (tag: AffiliateTag) => {
    try {
      const response = await fetch(`/api/admin/bots/affiliate-tags/${tag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag)
      });
      
      if (response.ok) {
        await fetchAffiliateTags();
        setEditingTag(null);
      }
    } catch (error) {
      console.error('Failed to update affiliate tag:', error);
    }
  };

  const deleteAffiliateTag = async (tagId: number) => {
    try {
      const response = await fetch(`/api/admin/bots/affiliate-tags/${tagId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchAffiliateTags();
      }
    } catch (error) {
      console.error('Failed to delete affiliate tag:', error);
    }
  };

  const toggleTagActive = async (tag: AffiliateTag) => {
    await updateAffiliateTag({ ...tag, isActive: !tag.isActive });
  };

  const updateCommissionRateMethod = async (botName: string, method: 'manual' | 'scraping' | 'api' | 'performance') => {
    try {
      const response = await fetch(`/api/admin/bots/${botName}/commission-method`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      });
      
      if (response.ok) {
        setBots(prevBots => 
          prevBots.map(bot => 
            bot.botName === botName 
              ? { ...bot, commissionRateMethod: method }
              : bot
          )
        );
      }
    } catch (error) {
      console.error('Failed to update commission rate method:', error);
    }
  };

  const handleCSVUpload = async (botName: string, file: File) => {
    try {
      setUploadingCSV(botName);
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('botName', botName);
      
      const response = await fetch('/api/admin/bots/commission-rates/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Uploaded ${result.count} commission rates for ${botName}`);
        // Refresh bot data to show updated rates
        await fetchBotStatus();
      }
    } catch (error) {
      console.error('Failed to upload CSV:', error);
    } finally {
      setUploadingCSV(null);
    }
  };

  const toggleBot = async (botName: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/bots/${botName}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        fetchBotStatus();
      }
    } catch (error) {
      console.error('Error toggling bot:', error);
    }
  };

  const restartBot = async (botName: string) => {
    try {
      const response = await fetch(`/api/admin/bots/${botName}/restart`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchBotStatus();
      }
    } catch (error) {
      console.error('Error restarting bot:', error);
    }
  };

  const updateBotMethod = async (botName: string, method: string) => {
    try {
      const response = await fetch(`/api/admin/bots/${botName}/method`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      });
      
      if (response.ok) {
        fetchBotStatus();
      }
    } catch (error) {
      console.error('Error updating bot method:', error);
    }
  };

  const enableAPI = async (botName: string) => {
    if (!apiKey) return;
    
    try {
      const response = await fetch(`/api/admin/bots/${botName}/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      
      if (response.ok) {
        setApiKey('');
        fetchBotStatus();
      }
    } catch (error) {
      console.error('Error enabling API:', error);
    }
  };

  const initializeAllBots = async () => {
    try {
      const response = await fetch('/api/admin/bots/initialize', {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchBotStatus();
      }
    } catch (error) {
      console.error('Error initializing bots:', error);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'conflict': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'conflict': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchProcessingStatus();
    fetchMasterBotStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading bot status...</span>
      </div>
    );
  }

  return (
    <UniversalPageLayout pageId="botadmin">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">8-Bot System Admin Panel</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                    // Use proper navigation instead of direct window.location
                    window.location.href = '/';
                  }}
                className="flex items-center gap-2"
              >
                <i className="fas fa-home"></i> Home
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                    // Use proper navigation instead of direct window.location
                    window.location.href = '/admin';
                  }}
                className="flex items-center gap-2"
              >
                🎛️ Admin Panel
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-md">
              <Label htmlFor="processing-toggle" className="text-sm">Master Bot Processing</Label>
              <Switch
                id="processing-toggle"
                checked={processingEnabled}
                disabled={processingLoading}
                onCheckedChange={(checked) => toggleProcessing(checked)}
              />
              <Input
                type="password"
                placeholder="Admin password (prod)"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="h-8 text-xs w-56"
              />
            </div>
            <Button onClick={initializeAllBots} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Initialize All Bots
            </Button>
          </div>
        </div>

        {/* Master Bot Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Master Bot Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-sm">
                <div className="font-semibold">Initialized</div>
                <div>{masterBotStatus?.initialized ? 'Yes' : 'No'}</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">Webhook URL</div>
                <div className="truncate text-blue-700">{masterBotStatus?.webhook?.url || 'N/A'}</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">Pending Updates</div>
                <div>{typeof masterBotStatus?.webhook?.pending_update_count === 'number' ? masterBotStatus?.webhook?.pending_update_count : 'N/A'}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Processing: <span className={processingEnabled ? 'text-green-600' : 'text-red-600'}>{processingEnabled ? 'ON' : 'OFF'}</span>
              {processingLastChangedAt ? (
                <span className="ml-2">(changed {new Date(processingLastChangedAt).toLocaleString()})</span>
              ) : null}
            </div>
          </CardContent>
        </Card>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemHealth.totalBots}</div>
                <div className="text-sm text-gray-600">Total Bots</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemHealth.activeBots}</div>
                <div className="text-sm text-gray-600">Active Bots</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{systemHealth.errorBots}</div>
                <div className="text-sm text-gray-600">Error Bots</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemHealth.healthPercentage}%</div>
                <div className="text-sm text-gray-600">Health Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bot Management Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <Card key={bot.botName} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(bot.status)}
                  <span className="text-lg">{bot.displayName}</span>
                </div>
                <Badge className={getStatusColor(bot.status)}>
                  {bot.status.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bot Info */}
              <div className="text-sm space-y-1">
                <div><strong>Network:</strong> {bot.affiliateNetwork}</div>
                <div><strong>Table:</strong> {bot.tableName}</div>
                <div><strong>Method:</strong> {bot.currentMethod}</div>
                <div><strong>Available:</strong> {bot.methodsAvailable.join(', ')}</div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-slate-800 text-white p-3 rounded-lg border">
                <div className="text-sm font-medium mb-2 text-slate-200">Performance Metrics</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-green-300">Deals: <span className="font-semibold">{bot.performance.dealsProcessed}</span></div>
                  <div className="text-blue-300">Success: <span className="font-semibold">{bot.performance.successRate}%</span></div>
                  <div className="text-red-300">Errors: <span className="font-semibold">{bot.errorCount}</span></div>
                  <div className="text-yellow-300">Conflicts: <span className="font-semibold">{bot.conflictCount}</span></div>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <Label htmlFor={`enable-${bot.botName}`}>Enabled</Label>
                  <Switch
                    id={`enable-${bot.botName}`}
                    checked={bot.isEnabled}
                    onCheckedChange={(checked) => toggleBot(bot.botName, checked)}
                  />
                </div>

                {/* Method Selection */}
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={bot.currentMethod}
                    onValueChange={(value) => updateBotMethod(bot.botName, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bot.methodsAvailable.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Affiliate Tags Management */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Affiliate Tags</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddTag(bot.botName)}
                      className="h-6 px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Tag
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {bot.affiliateTags?.map((tag) => (
                      <div key={tag.id} className="bg-slate-800 text-white p-3 rounded border border-slate-600">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-100">{tag.networkName}</div>
                            <div className="text-xs text-slate-300 truncate" title={tag.affiliateTag}>
                              {tag.affiliateTag.length > 35 ? tag.affiliateTag.substring(0, 35) + '...' : tag.affiliateTag}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant={tag.isActive ? 'default' : 'secondary'} 
                                className="text-xs bg-green-600 hover:bg-green-700 text-white"
                                title={`Commission Rate: ${tag.commissionRate}% - This is how much you earn from each sale through this affiliate network`}
                              >
                                <i className="fas fa-dollar-sign"></i> {tag.commissionRate}% Commission
                              </Badge>
                              <Badge 
                                variant={tag.tagType === 'wrapper' ? 'destructive' : 'outline'} 
                                className={`text-xs ${
                                  tag.tagType === 'wrapper' ? 'bg-purple-600 text-white' : 
                                  tag.tagType === 'parameter' ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
                                }`}
                                title={`Tag Type: ${tag.tagType} - ${tag.tagType === 'wrapper' ? 'Wraps URLs in affiliate links' : tag.tagType === 'parameter' ? 'Adds affiliate parameters to URLs' : 'Direct URL replacement'}`}
                              >
                                {tag.tagType}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={tag.isActive}
                              onCheckedChange={() => toggleTagActive(tag)}
                              className="scale-75"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingTag(tag)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteAffiliateTag(tag.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!bot.affiliateTags || bot.affiliateTags.length === 0) && (
                      <div className="text-xs text-gray-500 text-center py-2">
                        No affiliate tags configured
                      </div>
                    )}
                  </div>
                  
                  {/* Add New Tag Form */}
                  {showAddTag === bot.botName && (
                    <div className="bg-slate-700 text-white p-4 rounded border border-slate-500 space-y-3">
                      <div className="text-sm font-medium text-slate-100"><i className="fas fa-dollar-sign"></i> Add New Affiliate Tag</div>
                      <div className="text-xs text-slate-300">Commission rates: Amazon ~4%, CueLinks ~6.5%, EarnKaro ~4%, INRDeals ~3.5%</div>
                      <Input
                        placeholder="Network Name (e.g., CueLinks, Amazon Associates)"
                        value={newTag.networkName}
                        onChange={(e) => setNewTag({...newTag, networkName: e.target.value})}
                        className="h-9 text-sm bg-slate-600 border-slate-500 text-white placeholder-slate-300"
                      />
                      <Input
                        placeholder="Affiliate Tag/URL (e.g., tag=your-id or https://link.com/?url={{URL}})"
                        value={newTag.affiliateTag}
                        onChange={(e) => setNewTag({...newTag, affiliateTag: e.target.value})}
                        className="h-9 text-sm bg-slate-600 border-slate-500 text-white placeholder-slate-300"
                      />
                      <div className="flex gap-2">
                        <Select
                          value={newTag.tagType}
                          onValueChange={(value: 'url' | 'parameter' | 'wrapper') => setNewTag({...newTag, tagType: value})}
                        >
                          <SelectTrigger className="h-9 text-sm bg-slate-600 border-slate-500 text-white">
                            <SelectValue placeholder="Select tag type" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-500">
                            <SelectItem value="parameter" className="text-white hover:bg-slate-600">Parameter (adds ?tag=id)</SelectItem>
                            <SelectItem value="wrapper" className="text-white hover:bg-slate-600">Wrapper (wraps URL)</SelectItem>
                            <SelectItem value="url" className="text-white hover:bg-slate-600">Direct URL</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Commission % (e.g., 4.0 for 4%)"
                          value={newTag.commissionRate}
                          onChange={(e) => setNewTag({...newTag, commissionRate: parseFloat(e.target.value) || 0})}
                          className="h-9 text-sm bg-slate-600 border-slate-500 text-white placeholder-slate-300"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => addAffiliateTag(bot.botName)}
                          disabled={!newTag.networkName || !newTag.affiliateTag}
                          className="h-8 text-sm bg-green-600 hover:bg-green-700 text-white"
                        >
                          <i className="fas fa-dollar-sign"></i> Add Affiliate Tag
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddTag(null);
                            setNewTag({ networkName: '', affiliateTag: '', tagType: 'parameter', commissionRate: 0 });
                          }}
                          className="h-8 text-sm border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Commission Rate Method */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label><i className="fas fa-dollar-sign"></i> Commission Rate Method</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCommissionSettings(bot.botName)}
                      className="h-6 px-2"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Settings
                    </Button>
                  </div>
                  
                  <Select
                    value={bot.commissionRateMethod || 'manual'}
                    onValueChange={(value: 'manual' | 'scraping' | 'api' | 'performance') => 
                      updateCommissionRateMethod(bot.botName, value)
                    }
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual"><i className="fas fa-chart-bar"></i> Manual/CSV Upload</SelectItem>
                      <SelectItem value="scraping"><i className="fas fa-robot"></i> Auto-Scraping</SelectItem>
                      <SelectItem value="api">🔌 API Integration</SelectItem>
                      <SelectItem value="performance"><i className="fas fa-chart-line"></i> Performance-Based</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="text-xs text-gray-500">
                    {bot.commissionRateMethod === 'manual' && '<i className="fas fa-chart-bar"></i> Upload CSV or manually set rates'}
                    {bot.commissionRateMethod === 'scraping' && '<i className="fas fa-robot"></i> Daily scraping of public commission pages'}
                    {bot.commissionRateMethod === 'api' && '🔌 Real-time API rate lookup (requires setup)'}
                    {bot.commissionRateMethod === 'performance' && '<i className="fas fa-chart-line"></i> ML-based optimization using actual performance'}
                    {!bot.commissionRateMethod && '<i className="fas fa-chart-bar"></i> Upload CSV or manually set rates'}
                  </div>
                  
                  {/* Commission Settings Panel */}
                  {showCommissionSettings === bot.botName && (
                    <div className="bg-slate-700 text-white p-4 rounded border border-slate-500 space-y-3">
                      <div className="text-sm font-medium text-slate-100"><i className="fas fa-dollar-sign"></i> Commission Rate Settings</div>
                      
                      {(bot.commissionRateMethod === 'manual' || !bot.commissionRateMethod) && (
                        <div className="space-y-2">
                          <div className="text-xs text-slate-300">Upload CSV with columns: Network, Category, Rate</div>
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCSVUpload(bot.botName, file);
                            }}
                            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-600 file:text-white hover:file:bg-slate-500"
                          />
                          {uploadingCSV === bot.botName && (
                            <div className="text-xs text-blue-300">📤 Uploading commission rates...</div>
                          )}
                        </div>
                      )}
                      
                      {bot.commissionRateMethod === 'scraping' && (
                        <div className="space-y-2">
                          <div className="text-xs text-slate-300">Scraping frequency: Daily at 2 AM</div>
                          <div className="text-xs text-slate-300">Target sites: Amazon, CueLinks, EarnKaro</div>
                          <div className="text-xs text-green-300"><i className="fas fa-check-circle"></i> Last scrape: 6 hours ago (102 rates updated)</div>
                        </div>
                      )}
                      
                      {bot.commissionRateMethod === 'api' && (
                        <div className="space-y-2">
                          <div className="text-xs text-slate-300">API integration requires affiliate network API keys</div>
                          <div className="text-xs text-orange-300"><i className="fas fa-exclamation-triangle"></i> Setup required - contact affiliate networks for API access</div>
                        </div>
                      )}
                      
                      {bot.commissionRateMethod === 'performance' && (
                        <div className="space-y-2">
                          <div className="text-xs text-slate-300">ML optimization based on actual earnings data</div>
                          <div className="text-xs text-blue-300"><i className="fas fa-chart-bar"></i> Learning from {bot.performance.dealsProcessed} processed deals</div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCommissionSettings(null)}
                          className="h-7 text-xs border-slate-500 text-slate-300 hover:bg-slate-600 hover:text-white"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* API Configuration */}
                {selectedBot === bot.botName && (
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Enter API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={() => enableAPI(bot.botName)}
                        disabled={!apiKey}
                      >
                        Enable
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restartBot(bot.botName)}
                    className="flex-1"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Restart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedBot(
                      selectedBot === bot.botName ? null : bot.botName
                    )}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>8-Bot System Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Simple Bots (Fixed Affiliate)</h3>
              <ul className="text-sm space-y-1">
                <li>• <strong>Prime Picks:</strong> Amazon Associates</li>
                <li>• <strong>Cue Picks:</strong> CueLinks</li>
                <li>• <strong>Value Picks:</strong> EarnKaro</li>
                <li>• <strong>DealsHub:</strong> INRDeals</li>
                <li>• <strong>Lootbox:</strong> Deodap</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Smart Bots (Multi-Affiliate)</h3>
              <ul className="text-sm space-y-1">
                <li>• <strong>Click Picks:</strong> CPC Optimization</li>
                <li>• <strong>Global Picks:</strong> International</li>
                <li>• <strong>Travel Picks:</strong> Travel Partners</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-1">Method Selection</h4>
            <p className="text-sm text-blue-700">
              <strong>Telegram:</strong> Monitor Telegram channels (Primary) • 
              <strong>Scraping:</strong> Web scraping fallback • 
              <strong>API:</strong> Direct API integration (when available)
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </UniversalPageLayout>
  );
};

export default BotAdmin;