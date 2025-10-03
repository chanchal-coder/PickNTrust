import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AffiliateNetwork {
  id: number;
  name: string;
  baseUrl: string;
  commissionRate: number;
  priorityScore: number;
  isActive: boolean;
  createdAt: string;
  affiliateTag?: string;
  affiliateTags?: string[];
  trackingParams?: string;
}

interface CommissionUpdate {
  networkId: number;
  commissionRate: number;
  priorityScore: number;
  isActive: boolean;
}

interface CommissionSettings {
  adminPanelEnabled: boolean;
  csvUploadEnabled: boolean;
  googleSheetsEnabled: boolean;
  autoOptimizeEnabled: boolean;
  syncIntervalMinutes: number;
}

export default function CommissionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingNetwork, setEditingNetwork] = useState<number | null>(null);
  const [newNetwork, setNewNetwork] = useState({ 
    name: '', 
    baseUrl: '', 
    commissionRate: 0, 
    priorityScore: 50
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [settings, setSettings] = useState<CommissionSettings>({
    adminPanelEnabled: true,
    csvUploadEnabled: true,
    googleSheetsEnabled: false,
    autoOptimizeEnabled: true,
    syncIntervalMinutes: 5
  });
  
  // View and search state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [newNetworkData, setNewNetworkData] = useState({
    name: '',
    baseUrl: '',
    commissionRate: 0,
    affiliateTag: '',
    trackingParams: ''
  });

  // Fetch commission settings
  const { data: savedSettings } = useQuery({
    queryKey: ['/api/admin/commission-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/commission-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  // Fetch affiliate networks
   const { data: networks = [], isLoading } = useQuery({
     queryKey: ['/api/admin/affiliate-networks'],
     queryFn: async () => {
       const response = await fetch('/api/admin/affiliate-networks');
       if (!response.ok) throw new Error('Failed to fetch networks');
       return response.json();
     }
   });
   
   // Filter networks based on search term
   const filteredNetworks = networks.filter((network: AffiliateNetwork) =>
     network.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     network.baseUrl.toLowerCase().includes(searchTerm.toLowerCase())
   );
   
   // Update local settings when saved settings are loaded
   useEffect(() => {
     if (savedSettings) {
       setSettings(savedSettings);
     }
   }, [savedSettings]);

  // Update commission rate mutation (no password required)
  const updateCommissionMutation = useMutation({
    mutationFn: async (data: CommissionUpdate) => {
      const response = await fetch(`/api/admin/affiliate-networks/${data.networkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update commission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-networks'] });
      setEditingNetwork(null);
      toast({ title: 'Success', description: 'Commission rate updated successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Add new network mutation (no password required)
  const addNetworkMutation = useMutation({
    mutationFn: async (data: typeof newNetwork) => {
      const response = await fetch('/api/admin/affiliate-networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to add network');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-networks'] });
      setNewNetwork({ 
        name: '', 
        baseUrl: '', 
        commissionRate: 0, 
        priorityScore: 50
      });
      setShowAddForm(false);
      toast({ title: 'Success', description: 'Affiliate network added successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

   
   // Delete network mutation
    const deleteNetworkMutation = useMutation({
    mutationFn: async (networkId: number) => {
      const adminPassword = 'pickntrust2025';
      const response = await fetch(`/api/admin/affiliate-networks/${networkId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (!response.ok) throw new Error('Failed to delete network');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-networks'] });
      toast({ title: 'Success', description: 'Affiliate network deleted successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Optimize products mutation (no password required)
  const optimizeProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/optimize-commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error('Failed to optimize products');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Optimization Complete', 
        description: `Optimized ${data.optimizedCount} products for best commission rates!` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // CSV Upload mutation
  const csvUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      const response = await fetch('/api/admin/upload-commission-csv', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload CSV');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-networks'] });
      setUploadFile(null);
      toast({ 
        title: 'CSV Upload Complete', 
        description: `Processed ${data.processedRows} rows, ${data.successCount} successful updates!` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Google Sheets sync mutation
  const googleSheetsMutation = useMutation({
    mutationFn: async (sheetUrl: string) => {
      const response = await fetch('/api/admin/sync-google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl, syncInterval: settings.syncIntervalMinutes })
      });
      if (!response.ok) throw new Error('Failed to sync Google Sheets');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-networks'] });
      toast({ 
        title: 'Google Sheets Sync Complete', 
        description: `Synced ${data.updatedCount} commission rates from Google Sheets!` 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Settings update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: CommissionSettings) => {
      const response = await fetch('/api/admin/commission-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Commission settings updated successfully!' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleUpdateCommission = (networkId: number, updates: Partial<CommissionUpdate>) => {
    if (!settings.adminPanelEnabled) {
      toast({ title: 'Disabled', description: 'Admin panel updates are currently disabled', variant: 'destructive' });
      return;
    }

    const network = networks.find((n: AffiliateNetwork) => n.id === networkId);
    if (!network) return;

    updateCommissionMutation.mutate({
      networkId,
      commissionRate: updates.commissionRate ?? network.commissionRate,
      priorityScore: updates.priorityScore ?? network.priorityScore,
      isActive: updates.isActive ?? network.isActive
    });
  };

  const handleAddNetwork = () => {
    if (!settings.adminPanelEnabled) {
      toast({ title: 'Disabled', description: 'Admin panel updates are currently disabled', variant: 'destructive' });
      return;
    }

    if (!newNetwork.name || !newNetwork.baseUrl) {
      toast({ title: 'Error', description: 'Name and Base URL are required', variant: 'destructive' });
      return;
    }

    addNetworkMutation.mutate(newNetwork);
  };

  const handleOptimizeProducts = () => {
    optimizeProductsMutation.mutate();
  };

  const handleCsvUpload = () => {
    if (!settings.csvUploadEnabled) {
      toast({ title: 'Disabled', description: 'CSV upload is currently disabled', variant: 'destructive' });
      return;
    }

    if (!uploadFile) {
      toast({ title: 'Error', description: 'Please select a CSV file', variant: 'destructive' });
      return;
    }

    csvUploadMutation.mutate(uploadFile);
  };

  const handleGoogleSheetsSync = () => {
    if (!settings.googleSheetsEnabled) {
      toast({ title: 'Disabled', description: 'Google Sheets sync is currently disabled', variant: 'destructive' });
      return;
    }

    if (!googleSheetsUrl) {
      toast({ title: 'Error', description: 'Please enter Google Sheets URL', variant: 'destructive' });
      return;
    }

    googleSheetsMutation.mutate(googleSheetsUrl);
  };

  const handleSettingsUpdate = (newSettings: Partial<CommissionSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    updateSettingsMutation.mutate(updatedSettings);
  };
  
  const handleAddNetworkAction = () => {
    if (!newNetwork.name || !newNetwork.baseUrl) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    addNetworkMutation.mutate({ ...newNetwork, priorityScore: newNetwork.priorityScore || 50 });
  };
  
  const handleCsvUploadAction = () => {
    if (!uploadFile) {
      toast({ title: 'Error', description: 'Please select a CSV file', variant: 'destructive' });
      return;
    }
    csvUploadMutation.mutate(uploadFile);
  };
  
  const handleGoogleSheetsSyncAction = () => {
    if (!googleSheetsUrl) {
      toast({ title: 'Error', description: 'Please enter a Google Sheets URL', variant: 'destructive' });
      return;
    }
    googleSheetsMutation.mutate(googleSheetsUrl);
  };

  const getBestCommissionNetwork = () => {
    return networks
      .filter((n: AffiliateNetwork) => n.isActive)
      .sort((a: AffiliateNetwork, b: AffiliateNetwork) => b.commissionRate - a.commissionRate)[0];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading commission data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bestNetwork = getBestCommissionNetwork();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <i className="fas fa-percentage text-green-400"></i>
            Commission Management System
          </CardTitle>
          <CardDescription className="text-green-200">
            Manage affiliate network commission rates and optimize product earnings automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{networks.length}</div>
              <div className="text-sm text-green-300">Total Networks</div>
            </div>
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">
                {networks.filter((n: AffiliateNetwork) => n.isActive).length}
              </div>
              <div className="text-sm text-blue-300">Active Networks</div>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-400">
                {bestNetwork ? `${bestNetwork.commissionRate}%` : 'N/A'}
              </div>
              <div className="text-sm text-yellow-300">Best Commission Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="networks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="networks">Networks</TabsTrigger>
          <TabsTrigger value="affiliate-tags">Affiliate Tags</TabsTrigger>
          <TabsTrigger value="csv-upload">CSV Upload</TabsTrigger>
          <TabsTrigger value="google-sheets">Google Sheets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="networks" className="space-y-4">
          {/* Add New Network */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Affiliate Networks</CardTitle>
                  <CardDescription>Manage commission rates for different affiliate networks</CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Network
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddForm && (
                <div className="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-800/50">
                  <h3 className="text-lg font-semibold mb-4">Add New Affiliate Network</h3>
                <div className="mb-4 p-3 bg-blue-900/20 rounded border border-blue-600">
                  <p className="text-sm text-blue-300">
                    <i className="fas fa-info-circle mr-2"></i>
                    After adding a network, configure its affiliate tags in the "Affiliate Tags" tab.
                  </p>
                </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Network Name</Label>
                      <Input
                        id="name"
                        value={newNetwork.name}
                        onChange={(e) => setNewNetwork({ ...newNetwork, name: e.target.value })}
                        placeholder="e.g., Amazon Associates"
                      />
                    </div>
                    <div>
                      <Label htmlFor="baseUrl">Base URL</Label>
                      <Input
                        id="baseUrl"
                        value={newNetwork.baseUrl}
                        onChange={(e) => setNewNetwork({ ...newNetwork, baseUrl: e.target.value })}
                        placeholder="e.g., https://amazon.in"
                      />
                      <p className="text-xs text-gray-400 mt-1">Base domain for this affiliate network</p>
                    </div>
                    <div>
                      <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        step="0.1"
                        value={newNetwork.commissionRate}
                        onChange={(e) => setNewNetwork({ ...newNetwork, commissionRate: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 4.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priorityScore">Priority Score (1-100)</Label>
                      <Input
                        id="priorityScore"
                        type="number"
                        value={newNetwork.priorityScore}
                        onChange={(e) => setNewNetwork({ ...newNetwork, priorityScore: parseInt(e.target.value) || 50 })}
                        placeholder="e.g., 85"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleAddNetworkAction} disabled={addNetworkMutation.isPending}>
                      {addNetworkMutation.isPending ? 'Adding...' : 'Add Network'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Networks List */}
              {/* Display Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label>View:</Label>
                    <div className="flex border border-gray-600 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 text-sm ${
                          viewMode === 'list' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <i className="fas fa-list mr-1"></i>
                        List
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1 text-sm ${
                          viewMode === 'grid' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <i className="fas fa-th-large mr-1"></i>
                        Grid
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Search:</Label>
                    <Input
                      placeholder="Search networks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setShowAddNetwork(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Network
                </Button>
              </div>

              {/* Networks Display */}
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {filteredNetworks.map((network: AffiliateNetwork) => (
                  <div key={network.id} className={`border border-gray-600 rounded-lg p-4 bg-gray-800/30 ${
                    viewMode === 'grid' ? 'relative' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{network.name}</h3>
                        {network.id === bestNetwork?.id && (
                          <Badge className="bg-yellow-500 text-black">
                            <i className="fas fa-crown mr-1"></i>
                            Best Rate
                          </Badge>
                        )}
                        <Badge variant={network.isActive ? 'default' : 'secondary'}>
                          {network.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={network.isActive}
                          onCheckedChange={(checked) => handleUpdateCommission(network.id, { isActive: checked })}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingNetwork(editingNetwork === network.id ? null : network.id)}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${network.name}?`)) {
                              deleteNetworkMutation.mutate(network.id);
                            }
                          }}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Base URL:</span>
                        <div className="font-mono text-blue-400">{network.baseUrl}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Affiliate Tag:</span>
                        <div className="font-mono text-purple-400">{network.affiliateTag || 'Not set'}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Commission Rate:</span>
                        <div className="text-green-400 font-bold text-lg">{network.commissionRate}%</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Priority Score:</span>
                        <div className="text-yellow-400 font-semibold">{network.priorityScore}/100</div>
                      </div>
                    </div>
                    
                    {network.trackingParams && (
                      <div className="mt-3 p-3 bg-gray-800/50 rounded border border-gray-600">
                        <span className="text-gray-400 text-sm">Tracking Parameters:</span>
                        <div className="font-mono text-xs text-gray-300 mt-1">{network.trackingParams}</div>
                      </div>
                    )}

                    {editingNetwork === network.id && (
                      <div className="mt-4 p-3 border border-blue-600 rounded bg-blue-900/20">
                        <h4 className="font-semibold mb-3">Edit Commission Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Commission Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              defaultValue={network.commissionRate}
                              onBlur={(e) => {
                                const newRate = parseFloat(e.target.value);
                                if (newRate !== network.commissionRate) {
                                  handleUpdateCommission(network.id, { commissionRate: newRate });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label>Priority Score (1-100)</Label>
                            <Input
                              type="number"
                              defaultValue={network.priorityScore}
                              onBlur={(e) => {
                                const newScore = parseInt(e.target.value);
                                if (newScore !== network.priorityScore) {
                                  handleUpdateCommission(network.id, { priorityScore: newScore });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affiliate-tags" className="space-y-4">
          {/* Affiliate Tags Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-tags text-purple-400"></i>
                Affiliate Tags Management
              </CardTitle>
              <CardDescription>
                Configure affiliate tags and tracking parameters for each network independently
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-600">
                <h3 className="font-semibold mb-2 text-purple-400">How Affiliate Tags Work:</h3>
                <ul className="text-sm space-y-1 text-gray-300">
                  <li>• Each affiliate network has unique tracking identifiers</li>
                  <li>• Tags are used to track commissions back to your account</li>
                  <li>• Tracking parameters define how tags are added to product URLs</li>
                  <li>• Use {'{'}{"affiliateTag"} placeholder in parameters for dynamic replacement</li>
                  <li>• These settings work independently of method toggles</li>
                </ul>
              </div>

              <div className="space-y-4">
                {networks.map((network: AffiliateNetwork) => (
                  <div key={network.id} className="border border-gray-600 rounded-lg p-4 bg-gray-800/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{network.name}</h3>
                        <Badge variant={network.isActive ? 'default' : 'secondary'}>
                          {network.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {(network.affiliateTags && network.affiliateTags.length > 0) && (
                          <Badge className="bg-purple-500 text-white">
                            <i className="fas fa-tags mr-1"></i>
                            {network.affiliateTags.length} Tag{network.affiliateTags.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {network.commissionRate}% commission
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="flex items-center gap-2">
                          <i className="fas fa-tags text-purple-400"></i>
                          Affiliate Tags/IDs
                          <Badge variant="secondary" className="text-xs">
                            {(network.affiliateTags || []).length} tags
                          </Badge>
                        </Label>
                        
                        {/* Display existing tags */}
                        <div className="flex flex-wrap gap-2 mt-2 mb-3">
                          {(network.affiliateTags || []).map((tag, index) => (
                            <div key={index} className="flex items-center gap-1 bg-purple-900/30 border border-purple-600 rounded-lg px-3 py-1">
                              <span className="text-purple-300 font-mono text-sm">{tag}</span>
                              <button
                                onClick={() => {
                                  const updatedTags = (network.affiliateTags || []).filter((_, i) => i !== index);
                                  const updatedNetworks = networks.map((n: AffiliateNetwork) => 
                                    n.id === network.id ? { ...n, affiliateTags: updatedTags } : n
                                  );
                                  queryClient.setQueryData(['/api/admin/affiliate-networks'], updatedNetworks);
                                  
                                  // Save to backend
                                  fetch(`/api/admin/affiliate-networks/${network.id}/tags`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      affiliateTags: updatedTags,
                                      trackingParams: network.trackingParams 
                                    })
                                  }).then(() => {
                                    toast({ title: 'Success', description: `Removed affiliate tag from ${network.name}` });
                                  }).catch(() => {
                                    toast({ title: 'Error', description: 'Failed to remove affiliate tag', variant: 'destructive' });
                                  });
                                }}
                                className="text-red-400 hover:text-red-300 ml-1"
                              >
                                <i className="fas fa-times text-xs"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add new tag input */}
                        <div className="flex gap-2">
                          <Input
                            id={`new-tag-${network.id}`}
                            placeholder={`e.g., ${network.name.includes('Amazon') ? 'pickntrust03-21' : 'YOUR_' + network.name.toUpperCase().replace(/\s+/g, '_') + '_ID'}`}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                const newTag = input.value.trim();
                                if (newTag && !(network.affiliateTags || []).includes(newTag)) {
                                  const updatedTags = [...(network.affiliateTags || []), newTag];
                                  const updatedNetworks = networks.map((n: AffiliateNetwork) => 
                                    n.id === network.id ? { ...n, affiliateTags: updatedTags } : n
                                  );
                                  queryClient.setQueryData(['/api/admin/affiliate-networks'], updatedNetworks);
                                  
                                  // Save to backend
                                  fetch(`/api/admin/affiliate-networks/${network.id}/tags`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                      affiliateTags: updatedTags,
                                      trackingParams: network.trackingParams 
                                    })
                                  }).then(() => {
                                    toast({ title: 'Success', description: `Added affiliate tag to ${network.name}` });
                                    input.value = '';
                                  }).catch(() => {
                                    toast({ title: 'Error', description: 'Failed to add affiliate tag', variant: 'destructive' });
                                  });
                                }
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              const input = document.getElementById(`new-tag-${network.id}`) as HTMLInputElement;
                              const newTag = input.value.trim();
                              if (newTag && !(network.affiliateTags || []).includes(newTag)) {
                                const updatedTags = [...(network.affiliateTags || []), newTag];
                                const updatedNetworks = networks.map((n: AffiliateNetwork) => 
                                  n.id === network.id ? { ...n, affiliateTags: updatedTags } : n
                                );
                                queryClient.setQueryData(['/api/admin/affiliate-networks'], updatedNetworks);
                                
                                // Save to backend
                                fetch(`/api/admin/affiliate-networks/${network.id}/tags`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    affiliateTags: updatedTags,
                                    trackingParams: network.trackingParams 
                                  })
                                }).then(() => {
                                  toast({ title: 'Success', description: `Added affiliate tag to ${network.name}` });
                                  input.value = '';
                                }).catch(() => {
                                  toast({ title: 'Error', description: 'Failed to add affiliate tag', variant: 'destructive' });
                                });
                              }
                            }}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <i className="fas fa-plus mr-1"></i>
                            Add Tag
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Press Enter or click Add Tag to add multiple affiliate identifiers for {network.name}</p>
                      </div>
                      
                      <div>
                         <Label>Tracking Parameters Template</Label>
                        <Input
                          value={network.trackingParams || ''}
                          onChange={(e) => {
                            // Update network tracking params
                            const updatedNetworks = networks.map((n: AffiliateNetwork) => 
                              n.id === network.id ? { ...n, trackingParams: e.target.value } : n
                            );
                            queryClient.setQueryData(['/api/admin/affiliate-networks'], updatedNetworks);
                          }}
                          onBlur={(e) => {
                            // Save to backend
                            fetch(`/api/admin/affiliate-networks/${network.id}/tags`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                affiliateTag: network.affiliateTag,
                                trackingParams: e.target.value 
                              })
                            }).then(() => {
                              toast({ title: 'Success', description: `Updated ${network.name} tracking parameters` });
                            }).catch(() => {
                              toast({ title: 'Error', description: 'Failed to update tracking parameters', variant: 'destructive' });
                            });
                          }}
                          placeholder={`e.g., ${network.name.includes('Amazon') ? 'tag={affiliateTag}&linkCode=as2' : network.name.includes('EarnKaro') ? 'ref={affiliateTag}' : 'affid={affiliateTag}'}`}
                        />
                        <p className="text-xs text-gray-400 mt-1">URL parameters with {'{'}{"affiliateTag"} placeholder</p>
                      </div>
                    </div>

                    {(network.affiliateTags && network.affiliateTags.length > 0) && network.trackingParams && (
                      <div className="mt-4 p-3 bg-green-900/20 rounded border border-green-600">
                        <h4 className="text-sm font-semibold text-green-400 mb-2">Preview Generated URLs:</h4>
                        <div className="space-y-2">
                          {network.affiliateTags.map((tag, index) => (
                            <div key={index} className="font-mono text-xs text-gray-300">
                              <span className="text-purple-400">{tag}:</span> https://example.com/product?{network.trackingParams?.replace(/{affiliateTag}/g, tag)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {((!network.affiliateTags || network.affiliateTags.length === 0) || !network.trackingParams) && (
                      <div className="mt-4 p-3 bg-yellow-900/20 rounded border border-yellow-600">
                        <p className="text-sm text-yellow-400">
                          <i className="fas fa-exclamation-triangle mr-2"></i>
                          {(!network.affiliateTags || network.affiliateTags.length === 0) && !network.trackingParams 
                            ? 'Affiliate tags and tracking parameters are required for commission tracking'
                            : (!network.affiliateTags || network.affiliateTags.length === 0) 
                            ? 'At least one affiliate tag is required for commission tracking'
                            : 'Tracking parameters are required for URL generation'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {networks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <i className="fas fa-network-wired text-4xl mb-4"></i>
                  <p>No affiliate networks found. Add networks in the Networks tab first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv-upload" className="space-y-4">
          {/* CSV Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-file-csv text-blue-400"></i>
                CSV Bulk Upload
                {!settings.csvUploadEnabled && <Badge variant="secondary">Disabled</Badge>}
              </CardTitle>
              <CardDescription>
                Upload commission rates in bulk using CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-600">
                <h3 className="font-semibold mb-2">CSV Format:</h3>
                <div className="bg-gray-800 p-3 rounded font-mono text-sm">
                  category_name,network_name,commission_rate,priority_score,notes<br/>
                  Electronics,Amazon,4.0,40,Electronics commission<br/>
                  Fashion,Myntra,12.0,120,Best fashion rate<br/>
                  Beauty,Nykaa,15.0,150,Premium beauty commission
                </div>
              </div>

              <div className="mt-2">
                <a
                  href="/commission-upload-template.csv"
                  download
                  className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 underline"
                >
                  <i className="fas fa-download"></i>
                  Download CSV Template
                </a>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">Select CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    disabled={!settings.csvUploadEnabled}
                  />
                </div>

                {uploadFile && (
                  <div className="bg-green-900/20 p-3 rounded border border-green-600">
                    <p className="text-green-400">Selected: {uploadFile.name}</p>
                    <p className="text-sm text-gray-400">Size: {(uploadFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                )}

                <Button
                  onClick={handleCsvUploadAction}
                  disabled={!uploadFile || !settings.csvUploadEnabled || csvUploadMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {csvUploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading CSV...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload mr-2"></i>
                      Upload & Process CSV
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="google-sheets" className="space-y-4">
          {/* Google Sheets Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-table text-green-400"></i>
                Google Sheets Integration
                {!settings.googleSheetsEnabled && <Badge variant="secondary">Disabled</Badge>}
              </CardTitle>
              <CardDescription>
                Real-time sync with your Google Sheets commission rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-900/20 p-4 rounded-lg border border-green-600">
                <h3 className="font-semibold mb-2">Setup Instructions:</h3>
                <ol className="text-sm space-y-1 text-gray-300 list-decimal list-inside">
                  <li>Create a Google Sheet with columns: category_name, network_name, commission_rate</li>
                  <li>Make the sheet publicly viewable (Share → Anyone with link can view)</li>
                  <li>Copy the sheet URL and paste it below</li>
                  <li>Click "Connect & Sync" to start automatic synchronization</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="sheetsUrl">Google Sheets URL</Label>
                  <Input
                    id="sheetsUrl"
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                    disabled={!settings.googleSheetsEnabled}
                  />
                </div>

                <div>
                  <Label>Sync Interval: {settings.syncIntervalMinutes} minutes</Label>
                  <Input
                    type="range"
                    min="1"
                    max="60"
                    value={settings.syncIntervalMinutes}
                    onChange={(e) => handleSettingsUpdate({ syncIntervalMinutes: parseInt(e.target.value) })}
                    disabled={!settings.googleSheetsEnabled}
                    className="mt-2"
                  />
                </div>

                <Button
                  onClick={handleGoogleSheetsSyncAction}
                  disabled={!googleSheetsUrl || !settings.googleSheetsEnabled || googleSheetsMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {googleSheetsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Syncing with Google Sheets...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync mr-2"></i>
                      Connect & Sync Google Sheets
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-cog text-gray-400"></i>
                Commission Management Settings
              </CardTitle>
              <CardDescription>
                Configure which commission update methods are enabled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Admin Panel Updates</h3>
                    <p className="text-sm text-gray-400">Allow manual updates through the web interface</p>
                  </div>
                  <Switch
                    checked={settings.adminPanelEnabled}
                    onCheckedChange={(checked) => handleSettingsUpdate({ adminPanelEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div>
                    <h3 className="font-semibold">CSV File Upload</h3>
                    <p className="text-sm text-gray-400">Enable bulk updates via CSV file upload</p>
                  </div>
                  <Switch
                    checked={settings.csvUploadEnabled}
                    onCheckedChange={(checked) => handleSettingsUpdate({ csvUploadEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Google Sheets Integration</h3>
                    <p className="text-sm text-gray-400">Real-time sync with Google Sheets</p>
                  </div>
                  <Switch
                    checked={settings.googleSheetsEnabled}
                    onCheckedChange={(checked) => handleSettingsUpdate({ googleSheetsEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Auto-Optimize Products</h3>
                    <p className="text-sm text-gray-400">Automatically optimize products when rates change</p>
                  </div>
                  <Switch
                    checked={settings.autoOptimizeEnabled}
                    onCheckedChange={(checked) => handleSettingsUpdate({ autoOptimizeEnabled: checked })}
                  />
                </div>
              </div>

              {/* Quick Optimization */}
              <div className="border-t border-gray-600 pt-6">
                <h3 className="font-semibold mb-4">Product Optimization</h3>
                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-600 mb-4">
                  <p className="text-sm text-gray-300">
                    Manually trigger optimization to update all products with the best commission rates.
                  </p>
                </div>
                <Button
                  onClick={handleOptimizeProducts}
                  disabled={optimizeProductsMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {optimizeProductsMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Optimizing Products...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket mr-2"></i>
                      Optimize All Products Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Network Modal */}
      {showAddNetwork && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Affiliate Network</h2>
              <button
                onClick={() => setShowAddNetwork(false)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Network Name</Label>
                  <Input
                    value={newNetworkData.name}
                    onChange={(e) => setNewNetworkData({ ...newNetworkData, name: e.target.value })}
                    placeholder="e.g., Amazon Associates"
                  />
                </div>
                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={newNetworkData.baseUrl}
                    onChange={(e) => setNewNetworkData({ ...newNetworkData, baseUrl: e.target.value })}
                    placeholder="e.g., https://amazon.in"
                  />
                </div>
                <div>
                  <Label>Commission Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newNetworkData.commissionRate}
                    onChange={(e) => setNewNetworkData({ ...newNetworkData, commissionRate: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 4.5"
                  />
                </div>
                <div>
                  <Label>Affiliate Tag (Optional)</Label>
                  <Input
                    value={newNetworkData.affiliateTag}
                    onChange={(e) => setNewNetworkData({ ...newNetworkData, affiliateTag: e.target.value })}
                    placeholder="e.g., your-affiliate-id"
                  />
                </div>
              </div>
              
              <div>
                <Label>Tracking Parameters (Optional)</Label>
                <Input
                  value={newNetworkData.trackingParams}
                  onChange={(e) => setNewNetworkData({ ...newNetworkData, trackingParams: e.target.value })}
                  placeholder="e.g., tag={affiliateTag}&linkCode=as2"
                />
                <p className="text-xs text-gray-400 mt-1">Use {'{'}affiliateTag{'}'} placeholder for dynamic replacement</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                   onClick={() => addNetworkMutation.mutate({ ...newNetworkData, priorityScore: 50 })}
                   disabled={!newNetworkData.name || !newNetworkData.baseUrl || addNetworkMutation.isPending}
                   className="bg-green-600 hover:bg-green-700"
                 >
                {addNetworkMutation.isPending ? 'Adding...' : 'Add Network'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddNetwork(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}