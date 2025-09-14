/**
 * Credential Management Component - Secure admin interface for network credentials
 * Provides UI for managing CueLinks, INRDeals, EarnKaro, and other affiliate network credentials
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/use-toast';
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Database,
  Activity,
  Edit
} from 'lucide-react';

interface NetworkCredential {
  network: string;
  isActive: boolean;
  lastUsed?: string;
}

interface CredentialStats {
  total: number;
  active: number;
  networks: string[];
}

interface CredentialTest {
  network: string;
  isActive: boolean;
  valid: boolean;
  error?: string;
  lastUsed?: string;
}

interface CredentialHealth {
  totalNetworks: number;
  activeNetworks: number;
  validCredentials: number;
  tests: CredentialTest[];
}

const CredentialManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [newCredential, setNewCredential] = useState({
    network: '',
    email: '',
    password: '',
    apiKey: '',
    isActive: true
  });
  const [editCredential, setEditCredential] = useState({
    network: '',
    email: '',
    password: '',
    apiKey: '',
    isActive: true
  });

  // Fetch available networks
  const { data: networks = [], isLoading: networksLoading } = useQuery({
    queryKey: ['/api/admin/credentials/networks'],
    queryFn: async () => {
      const response = await fetch('/api/admin/credentials/networks', {
        headers: {
          'X-Admin-Session': localStorage.getItem('pickntrust-admin-session') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch networks');
      const data = await response.json();
      return data.networks as NetworkCredential[];
    }
  });

  // Fetch credential statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/credentials/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/credentials/stats', {
        headers: {
          'X-Admin-Session': localStorage.getItem('pickntrust-admin-session') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data.stats as CredentialStats;
    }
  });

  // Fetch credential health
  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/admin/credentials/health'],
    queryFn: async () => {
      const response = await fetch('/api/admin/credentials/health', {
        headers: {
          'X-Admin-Session': localStorage.getItem('pickntrust-admin-session') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch health');
      const data = await response.json();
      return data.health as CredentialHealth;
    }
  });

  // Add new credentials mutation
  const addCredentialMutation = useMutation({
    mutationFn: async (credential: typeof newCredential) => {
      const response = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Session': localStorage.getItem('pickntrust-admin-session') || ''
        },
        body: JSON.stringify(credential)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add credentials');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credentials added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/networks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/health'] });
      setShowAddForm(false);
      setNewCredential({ network: '', email: '', password: '', apiKey: '', isActive: true });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Edit credentials mutation
  const editCredentialMutation = useMutation({
    mutationFn: async (credential: typeof editCredential) => {
      const response = await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Session': localStorage.getItem('pickntrust-admin-session') || ''
        },
        body: JSON.stringify(credential)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update credentials');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credentials updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/networks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/health'] });
      setShowEditForm(false);
      setEditingNetwork(null);
      setEditCredential({ network: '', email: '', password: '', apiKey: '', isActive: true });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete credentials mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (network: string) => {
      const response = await fetch(`/api/admin/credentials/${network}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Session': localStorage.getItem('pickntrust-admin-session') || ''
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete credentials');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credentials deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/networks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/health'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Test credentials mutation
  const testCredentialMutation = useMutation({
    mutationFn: async (network: string) => {
      const response = await fetch(`/api/admin/credentials/${network}/test`, {
        method: 'POST',
        headers: {
          'X-Admin-Session': localStorage.getItem('pickntrust-admin-session') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to test credentials');
      return response.json();
    },
    onSuccess: (data, network) => {
      const result = data.test;
      toast({
        title: result.valid ? "Test Passed" : "Test Failed",
        description: result.valid ? `${network} credentials are valid` : result.error,
        variant: result.valid ? "default" : "destructive"
      });
    }
  });

  // Initialize credentials mutation
  const initializeCredentialsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/credentials/initialize', {
        method: 'POST',
        headers: {
          'X-Admin-Session': localStorage.getItem('pickntrust-admin-session') || ''
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize credentials');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credentials initialized successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/networks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/credentials/health'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddCredential = () => {
    if (!newCredential.network || !newCredential.email || !newCredential.password) {
      toast({
        title: "Validation Error",
        description: "Network, email, and password are required",
        variant: "destructive"
      });
      return;
    }
    addCredentialMutation.mutate(newCredential);
  };

  const handleEditCredential = () => {
    if (!editCredential.network || !editCredential.email || !editCredential.password) {
      toast({
        title: "Validation Error",
        description: "Network, email, and password are required",
        variant: "destructive"
      });
      return;
    }
    editCredentialMutation.mutate(editCredential);
  };

  const startEditCredential = (network: string) => {
    setEditingNetwork(network);
    setEditCredential({
      network: network,
      email: '', // Will be filled by user
      password: '', // Will be filled by user
      apiKey: '',
      isActive: true
    });
    setShowEditForm(true);
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingNetwork(null);
    setEditCredential({ network: '', email: '', password: '', apiKey: '', isActive: true });
  };

  const togglePasswordVisibility = (network: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [network]: !prev[network]
    }));
  };

  const getStatusIcon = (test: CredentialTest) => {
    if (!test.isActive) return <XCircle className="w-4 h-4 text-gray-400" />;
    if (test.valid) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (test: CredentialTest) => {
    if (!test.isActive) return 'bg-gray-500';
    if (test.valid) return 'bg-green-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Credential Management
          </h2>
          <p className="text-gray-600 mt-1">
            Secure storage and management of affiliate network credentials
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetchHealth()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Credentials
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-gray-600">Total Networks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.active || 0}</p>
                <p className="text-sm text-gray-600">Active Networks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{health?.validCredentials || 0}</p>
                <p className="text-sm text-gray-600">Valid Credentials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {health ? Math.round((health.validCredentials / health.totalNetworks) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Health Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Initialize Credentials Button */}
      {(!stats || stats.total === 0) && (
        <Card className="border-dashed border-2 border-blue-300">
          <CardContent className="p-6 text-center">
            <Key className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Credentials Found</h3>
            <p className="text-gray-600 mb-4">
              Initialize the system with your provided network credentials
            </p>
            <Button
              onClick={() => initializeCredentialsMutation.mutate()}
              disabled={initializeCredentialsMutation.isPending}
              className="flex items-center gap-2"
            >
              {initializeCredentialsMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Initialize Credentials
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Network Credentials List */}
      {health && health.tests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.tests.map((test) => (
            <Card key={test.network} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test)}
                    <span className="capitalize">{test.network}</span>
                  </div>
                  <Badge className={getStatusColor(test)}>
                    {test.isActive ? (test.valid ? 'Valid' : 'Invalid') : 'Inactive'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {test.error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {test.error}
                  </div>
                )}
                
                {test.lastUsed && (
                  <div className="text-sm text-gray-600">
                    <strong>Last Used:</strong> {new Date(test.lastUsed).toLocaleString()}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testCredentialMutation.mutate(test.network)}
                    disabled={testCredentialMutation.isPending}
                    className="flex-1"
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startEditCredential(test.network)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCredentialMutation.mutate(test.network)}
                    disabled={deleteCredentialMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Credential Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Network Credentials
            </CardTitle>
            <CardDescription>
              Securely store credentials for affiliate network auto-scraping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="network">Network Name</Label>
                <Input
                  id="network"
                  value={newCredential.network}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, network: e.target.value }))}
                  placeholder="e.g., cuelinks, earnkaro"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCredential.email}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPasswords['new'] ? 'text' : 'password'}
                    value={newCredential.password}
                    onChange={(e) => setNewCredential(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords['new'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="apiKey">API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  value={newCredential.apiKey}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="API key if available"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newCredential.isActive}
                onCheckedChange={(checked) => setNewCredential(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAddCredential}
                disabled={addCredentialMutation.isPending}
                className="flex items-center gap-2"
              >
                {addCredentialMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Store Securely
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCredential({ network: '', email: '', password: '', apiKey: '', isActive: true });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Credential Form */}
      {showEditForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit {editingNetwork?.toUpperCase()} Credentials
            </CardTitle>
            <CardDescription>
              Update credentials for {editingNetwork} network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-network">Network Name</Label>
                <Input
                   id="edit-network"
                   value={editCredential.network}
                   disabled
                   className="bg-slate-50 border-slate-300 text-slate-700 cursor-not-allowed"
                 />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editCredential.email}
                  onChange={(e) => setEditCredential(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPasswords['edit'] ? 'text' : 'password'}
                    value={editCredential.password}
                    onChange={(e) => setEditCredential(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('edit')}
                  >
                    {showPasswords['edit'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-apiKey">API Key (Optional)</Label>
                <Input
                  id="edit-apiKey"
                  value={editCredential.apiKey}
                  onChange={(e) => setEditCredential(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="API key if available"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={editCredential.isActive}
                onCheckedChange={(checked) => setEditCredential(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleEditCredential}
                disabled={editCredentialMutation.isPending}
                className="flex items-center gap-2"
              >
                {editCredentialMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Update Credentials
              </Button>
              <Button
                variant="outline"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Security Information</h4>
              <p className="text-sm text-blue-800 mt-1">
                All credentials are encrypted using AES-256-GCM encryption before storage. 
                Passwords are never stored in plain text and can only be decrypted by authorized processes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialManagement;