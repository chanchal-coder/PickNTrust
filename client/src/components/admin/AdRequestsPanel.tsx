import { useEffect, useState, useRef } from 'react';
import { getAdminPassword } from '@/config/admin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, Loader2, Plus, Image, ExternalLink, Users } from 'lucide-react';

export default function AdRequestsPanel() {
  const adminPassword = getAdminPassword();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [exploreAds, setExploreAds] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pendingAdvertisers, setPendingAdvertisers] = useState<any[]>([]);
  const [approvedAdvertisers, setApprovedAdvertisers] = useState<any[]>([]);
  const [paymentSummaries, setPaymentSummaries] = useState<Record<number, any>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  // Filters
  const [requestFilter, setRequestFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [userFilter, setUserFilter] = useState<'pending' | 'approved'>('pending');
  const colorPalette = [
    '#6366F1', '#3B82F6', '#0EA5E9', '#10B981', '#22C55E', '#EAB308', '#F59E0B', '#EF4444', '#F43F5E', '#8B5CF6', '#14B8A6', '#6B7280'
  ];
  const themeColors = [
    '#000000','#6B7280','#7F1D1D','#B91C1C','#D97706','#F59E0B','#FDE047','#65A30D','#60A5FA','#4F46E5','#1D4ED8','#6D28D9',
    '#FFFFFF','#D1D5DB','#B45309','#F9A8D4','#F59E0B','#FDE68A','#A3E635','#93C5FD','#94A3B8','#C7D2FE',
    '#F3F4F6','#9CA3AF','#D1D5DB','#F8B4B4','#F4A460','#FDE68A','#FCD34D','#A3E635','#86EFAC','#A5B4FC','#D8B4FE',
    '#E5E7EB','#6B7280','#9A3412','#DC2626','#F87171','#FB923C','#F59E0B','#84CC16','#34D399','#60A5FA','#8B5CF6','#A78BFA'
  ];
  const standardColors = ['#EF4444','#F59E0B','#FDE047','#22C55E','#4ADE80','#60A5FA','#A78BFA','#F59E0B','#9CA3AF','#374151'];

  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    clickUrl: '',
    type: '',
    description: '',
    viewMode: '',
    advertiserId: '',
    campaignId: '',
    logoUrl: '',
    imageAlt: '',
    colorAccent: '#6366F1',
    buttonText: 'Shop',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    priority: 'normal',
    rotationWeight: 50,
    publishDate: '',
    publishTime: '',
    status: 'draft',
    pinFirst: false,
    titleStyle: {
      fontWeight: 700,
      fontStyle: 'normal',
      textDecoration: 'none',
      fontSize: '24px',
      color: '',
      gradientEnabled: false,
      gradientFrom: '#6366F1',
      gradientTo: '#9333EA',
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    },
    descriptionStyle: {
      fontWeight: 400,
      fontStyle: 'normal',
      textDecoration: 'none',
      fontSize: '14px',
      color: '',
      gradientEnabled: false,
      gradientFrom: '#6366F1',
      gradientTo: '#9333EA',
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    },
    badges: {
      sponsored: false,
      official: false,
      isNew: false,
      sale: false,
      limited: false,
      featured: false,
    }
  });

  async function loadData() {
    try {
      setLoading(true);
      const [reqRes, adsRes, campRes, pendRes, apprRes] = await Promise.all([
        fetch('/api/admin/ad-requests', { headers: { 'X-Admin-Password': adminPassword } }),
        fetch('/api/config/explore-ads'),
        fetch('/api/admin/campaigns', { headers: { 'X-Admin-Password': adminPassword } }),
        fetch('/api/admin/advertisers/pending', { headers: { 'X-Admin-Password': adminPassword } }),
        fetch('/api/admin/advertisers/approved', { headers: { 'X-Admin-Password': adminPassword } })
      ]);
      const [reqJson, adsJson, campJson, pendJson, apprJson] = await Promise.all([
        reqRes.json(),
        adsRes.json(),
        campRes.json(),
        pendRes.json(),
        apprRes.json()
      ]);
      setRequests(Array.isArray(reqJson) ? reqJson : []);
      setExploreAds(Array.isArray(adsJson) ? adsJson : []);
      setCampaigns(Array.isArray(campJson) ? campJson : []);
      setPendingAdvertisers(Array.isArray(pendJson) ? pendJson : []);
      setApprovedAdvertisers(Array.isArray(apprJson) ? apprJson : []);
      // Fetch latest payment summary for approved advertisers (best-effort, non-blocking)
      try {
        const approved = Array.isArray(apprJson) ? apprJson : [];
        const results = await Promise.allSettled(
          approved.map((a: any) => (
            fetch(`/api/payments/admin/advertisers/${a.id}/payments/latest`, {
              headers: { 'X-Admin-Password': adminPassword }
            })
              .then(r => r.json())
              .then(data => ({ id: a.id, data }))
          ))
        );
        const map: Record<number, any> = {};
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            map[r.value.id] = r.value.data;
          }
        }
        setPaymentSummaries(map);
      } catch (err) {
        // Silent failure; UI will simply not show plan details
      }
    } catch (e) {
      toast({ title: 'Failed to load', description: 'Could not fetch requests/ads', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Restore previously chosen color accent if saved
    try {
      const savedColor = localStorage.getItem('exploreAdColorAccent');
      if (savedColor) {
        setForm(prev => ({ ...prev, colorAccent: savedColor }));
      }
    } catch {}
    loadData();
  }, []);

  async function approve(id: number) {
    try {
      const res = await fetch(`/api/admin/ad-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword }
      });
      if (!res.ok) throw new Error('Approve failed');
      toast({ title: 'Approved', description: 'Request approved and added to Explore ads' });
      await loadData();
    } catch (e) {
      toast({ title: 'Approve failed', description: String(e), variant: 'destructive' });
    }
  }

  async function reject(id: number) {
    const reason = '';
    try {
      const res = await fetch(`/api/admin/ad-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Reject failed');
      toast({ title: 'Rejected', description: 'Request rejected' });
      await loadData();
    } catch (e) {
      toast({ title: 'Reject failed', description: String(e), variant: 'destructive' });
    }
  }

  async function addExploreAdDirect() {
    try {
      if (!form.title || !form.clickUrl) {
        toast({ title: 'Missing fields', description: 'Title and Link URL are required', variant: 'destructive' });
        return;
      }
      const publishAt = form.publishDate && form.publishTime
        ? new Date(`${form.publishDate}T${form.publishTime}`).toISOString()
        : undefined;
      const badges = Object.entries(form.badges)
        .filter(([, v]) => !!v)
        .map(([k]) => k);
      // Sanitize imageUrl: allow server-relative /uploads/... or first valid http/https URL
      const rawImageUrl = (form.imageUrl || '').trim();
      const cleanImageUrl = /^\/uploads\//i.test(rawImageUrl)
        ? rawImageUrl
        : (/^https?:\/\//i.test(rawImageUrl) ? rawImageUrl : '');
      const res = await fetch('/api/admin/explore-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({
          ...form,
          imageUrl: cleanImageUrl,
          publishAt,
          badges,
          titleStyle: form.titleStyle,
          descriptionStyle: form.descriptionStyle,
        })
      });
      if (!res.ok) throw new Error('Add ad failed');
      setForm({
        title: '', imageUrl: '', clickUrl: '', type: '', description: '', viewMode: '', advertiserId: '', campaignId: '',
        logoUrl: '', imageAlt: '', colorAccent: form.colorAccent, buttonText: 'Shop', utmSource: '', utmMedium: '', utmCampaign: '', priority: 'normal', rotationWeight: 50,
        publishDate: '', publishTime: '', status: 'draft', pinFirst: false,
        titleStyle: {
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          fontSize: '24px',
          color: '',
          gradientEnabled: false,
          gradientFrom: '#6366F1',
          gradientTo: '#9333EA',
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        },
        descriptionStyle: {
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          fontSize: '14px',
          color: '',
          gradientEnabled: false,
          gradientFrom: '#6366F1',
          gradientTo: '#9333EA',
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        },
        badges: { sponsored: false, official: false, isNew: false, sale: false, limited: false, featured: false }
      });
      // Persist selected color accent
      try { localStorage.setItem('exploreAdColorAccent', form.colorAccent); } catch {}
      toast({ title: 'Ad added', description: 'Explore ad created successfully' });
      await loadData();
    } catch (e) {
      toast({ title: 'Add ad failed', description: String(e), variant: 'destructive' });
    }
  }

  async function updateExploreAdDirect() {
    try {
      if (!editingId) return;
      if (!form.title || !form.clickUrl) {
        toast({ title: 'Missing fields', description: 'Title and Link URL are required', variant: 'destructive' });
        return;
      }
      const publishAt = form.publishDate && form.publishTime
        ? new Date(`${form.publishDate}T${form.publishTime}`).toISOString()
        : undefined;
      const badges = Object.entries(form.badges)
        .filter(([, v]) => !!v)
        .map(([k]) => k);
      // Sanitize imageUrl on update as well: allow /uploads/... or http(s)
      const rawImageUrl = (form.imageUrl || '').trim();
      const cleanImageUrl = /^\/uploads\//i.test(rawImageUrl)
        ? rawImageUrl
        : (/^https?:\/\//i.test(rawImageUrl) ? rawImageUrl : '');
      const res = await fetch(`/api/admin/explore-ads/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({
          ...form,
          imageUrl: cleanImageUrl,
          publishAt,
          badges,
          titleStyle: form.titleStyle,
          descriptionStyle: form.descriptionStyle,
        })
      });
      if (!res.ok) throw new Error('Update ad failed');
      toast({ title: 'Ad updated', description: 'Explore ad updated successfully' });
      setEditingId(null);
      await loadData();
    } catch (e) {
      toast({ title: 'Update ad failed', description: String(e), variant: 'destructive' });
    }
  }

  async function uploadFileAndSet(field: 'imageUrl' | 'logoUrl', file?: File) {
    try {
      if (!file) return;
      field === 'imageUrl' ? setUploadingImage(true) : setUploadingLogo(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (parseErr) {
          const text = await res.text().catch(() => '');
          throw new Error(`Invalid JSON from server: ${String(parseErr)}${text ? ` | ${text.slice(0, 120)}…` : ''}`);
        }
      } else {
        const text = await res.text().catch(() => '');
        throw new Error(`Unexpected response (not JSON): ${text.slice(0, 200)}…`);
      }
      if (!res.ok || !data?.url) throw new Error(data?.message || 'Upload failed');
      setForm(prev => ({ ...prev, [field]: data.url }));
      toast({ title: 'Uploaded', description: `${field === 'imageUrl' ? 'Image' : 'Logo'} uploaded successfully` });
    } catch (e) {
      toast({ title: 'Upload failed', description: String(e), variant: 'destructive' });
    } finally {
      field === 'imageUrl' ? setUploadingImage(false) : setUploadingLogo(false);
    }
  }

  function startEdit(ad: any) {
    try {
      setEditingId(ad.id);
      let publishDate = '';
      let publishTime = '';
      if (ad.publishAt) {
        try {
          const d = new Date(ad.publishAt);
          publishDate = d.toISOString().slice(0,10);
          publishTime = d.toISOString().slice(11,16);
        } catch {}
      }
      const badgeObj: any = { sponsored: false, official: false, isNew: false, sale: false, limited: false, featured: false };
      (Array.isArray(ad.badges) ? ad.badges : []).forEach((b: string) => { badgeObj[b] = true; });
      setForm({
        title: ad.title || '',
        imageUrl: ad.imageUrl || '',
        clickUrl: ad.clickUrl || '',
        type: ad.type || '',
        description: ad.description || '',
        viewMode: ad.viewMode || '',
        advertiserId: ad.advertiserId ? String(ad.advertiserId) : '',
        campaignId: ad.campaignId ? String(ad.campaignId) : '',
        logoUrl: ad.logoUrl || '',
        imageAlt: ad.imageAlt || '',
        colorAccent: ad.colorAccent || '#6366F1',
        buttonText: ad.buttonText || 'Shop',
        utmSource: ad.utmSource || '',
        utmMedium: ad.utmMedium || '',
        utmCampaign: ad.utmCampaign || '',
        priority: ad.priority || 'normal',
        rotationWeight: typeof ad.rotationWeight === 'number' ? ad.rotationWeight : 50,
        publishDate,
        publishTime,
        status: ad.status || 'draft',
        pinFirst: !!ad.pinFirst,
        titleStyle: ad.titleStyle || {
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          fontSize: '24px',
          color: '',
          gradientEnabled: false,
          gradientFrom: '#6366F1',
          gradientTo: '#9333EA',
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        },
        descriptionStyle: ad.descriptionStyle || {
          fontWeight: 400,
          fontStyle: 'normal',
          textDecoration: 'none',
          fontSize: '14px',
          color: '',
          gradientEnabled: false,
          gradientFrom: '#6366F1',
          gradientTo: '#9333EA',
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        },
        badges: badgeObj,
      });
      toast({ title: 'Editing ad', description: `Loaded "${ad.title}" into the form` });
    } catch (e) {
      toast({ title: 'Edit failed', description: String(e), variant: 'destructive' });
    }
  }

  async function deleteExploreAd(id: number) {
    try {
      const res = await fetch(`/api/admin/explore-ads/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Password': adminPassword }
      });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: 'Removed', description: 'Explore ad deleted' });
      await loadData();
    } catch (e) {
      toast({ title: 'Delete failed', description: String(e), variant: 'destructive' });
    }
  }

  async function approveAdvertiser(id: number) {
    try {
      const res = await fetch(`/api/admin/advertisers/${id}/approve`, {
        method: 'POST',
        headers: { 'X-Admin-Password': adminPassword }
      });
      if (!res.ok) throw new Error('Approve advertiser failed');
      toast({ title: 'Advertiser approved', description: 'User can now log in' });
      await loadData();
    } catch (e) {
      toast({ title: 'Approve failed', description: String(e), variant: 'destructive' });
    }
  }

  return (
    <Tabs defaultValue="manage" className="space-y-6">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="manage">Manage</TabsTrigger>
        <TabsTrigger value="add">Add Ad</TabsTrigger>
      </TabsList>

      <TabsContent value="manage" className="space-y-6">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Ad Requests Review
          </CardTitle>
          <CardDescription>Approve or reject incoming ad submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Select value={requestFilter} onValueChange={(v) => setRequestFilter(v as any)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {requests.length === 0 ? (
                <p className="text-sm text-gray-600">No requests yet.</p>
              ) : (
                // Filter requests by selected status
                requests.filter((r) => r?.status === requestFilter).map((r) => (
                  <div key={r.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{r.status}</Badge>
                        <span className="font-medium">{r.title}</span>
                      </div>
                      <div className="text-sm text-gray-600 break-all">{r.clickUrl}</div>
                      {r.type && <div className="text-xs text-gray-500">Type: {r.type}</div>}
                      {r.description && <div className="text-xs text-gray-500">{r.description}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => approve(r.id)} disabled={r.status !== 'pending'} className="bg-green-600 hover:bg-green-700">Approve</Button>
                      <Button onClick={() => reject(r.id)} disabled={r.status !== 'pending'} variant="outline" className="border-red-600 text-red-600">Reject</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Users filter toggle */}
      <div className="flex justify-end">
        <Select value={userFilter} onValueChange={(v) => setUserFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Users filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {userFilter === 'pending' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users/Requests (Pending)
          </CardTitle>
          <CardDescription>Review advertiser signups and approve access</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : (
            <div className="space-y-3">
              {pendingAdvertisers.length === 0 ? (
                <p className="text-sm text-gray-600">No pending advertisers.</p>
              ) : (
                pendingAdvertisers.map((a) => (
                  <div key={a.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                        <span className="font-medium">{a.company_name}</span>
                      </div>
                      <div className="text-sm text-gray-600 break-all">{a.email}</div>
                      {a.contact_person && <div className="text-xs text-gray-500">Contact: {a.contact_person}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => approveAdvertiser(a.id)} className="bg-green-600 hover:bg-green-700">Approve</Button>
                      <a href={`/advertise/dashboard?adminAdvertiserId=${a.id}`} target="_blank" rel="noreferrer">
                        <Button variant="outline">Dashboard</Button>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}
      {userFilter === 'approved' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users (Approved)
          </CardTitle>
          <CardDescription>Quick links to approved advertisers’ dashboards</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : (
            <div className="space-y-3">
              {approvedAdvertisers.length === 0 ? (
                <p className="text-sm text-gray-600">No approved advertisers.</p>
              ) : (
                approvedAdvertisers.map((a) => (
                  <div key={a.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                        <span className="font-medium">{a.company_name}</span>
                      </div>
                      <div className="text-sm text-gray-600 break-all">{a.email}</div>
                      {a.contact_person && <div className="text-xs text-gray-500">Contact: {a.contact_person}</div>}
                      {(() => {
                        const summary = paymentSummaries[a.id];
                        if (!summary || (!summary.payment && !summary.plan)) return null;
                        const p = summary.payment || {};
                        const plan = summary.plan || {};
                        const currency = (p.currency || '').toString().toUpperCase();
                        const amt = typeof p.amount === 'number' ? p.amount : undefined;
                        const method = (p.payment_method || '').toString();
                        const status = (p.payment_status || '').toString();
                        const tx = (p.transaction_id || '') as string;
                        const paidAt = p.payment_date ? new Date(p.payment_date) : null;
                        const paidAtStr = paidAt ? paidAt.toLocaleDateString() : undefined;
                        const planName = plan.name || undefined;
                        const duration = plan.duration || undefined;
                        return (
                          <div className="mt-2 text-xs text-gray-700">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {planName && <span>Plan: <span className="font-medium">{planName}</span>{duration ? ` (${duration})` : ''}</span>}
                              {amt != null && currency && <span>Amount: <span className="font-medium">{currency} {amt}</span></span>}
                              {method && <span>Method: <span className="font-medium capitalize">{method}</span></span>}
                              {status && <span>Status: <span className="font-medium capitalize">{status}</span></span>}
                              {paidAtStr && <span>Paid: <span className="font-medium">{paidAtStr}</span></span>}
                              {tx && <span>Ref: <span className="font-mono">{String(tx).slice(0,8)}…</span></span>}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex gap-2">
                      <a href={`/advertise/dashboard?adminAdvertiserId=${a.id}`} target="_blank" rel="noreferrer">
                        <Button>
                          Open Dashboard
                        </Button>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      
      </TabsContent>

      <TabsContent value="add" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Explore Ad (Direct)
          </CardTitle>
          <CardDescription>Add an ad directly to the Explore page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Summer Sale" />
              <div className="mt-2 flex flex-wrap gap-2 items-center bg-black text-white p-2 rounded-md">
                <button type="button" className={`px-2 py-1 rounded border ${form.titleStyle.fontWeight===700?'bg-gray-800 text-white':'bg-gray-100 text-black'}`} onClick={() => setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, fontWeight: prev.titleStyle.fontWeight===700?400:700 } }))}>B</button>
                <button type="button" className={`px-2 py-1 rounded border ${form.titleStyle.fontStyle==='italic'?'bg-gray-800 text-white':'bg-gray-100 text-black'}`} onClick={() => setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, fontStyle: prev.titleStyle.fontStyle==='italic'?'normal':'italic' } }))}><span style={{fontStyle:'italic'}}>I</span></button>
                <button type="button" className={`px-2 py-1 rounded border ${(form.titleStyle.textDecoration||'').includes('line-through')?'bg-gray-800 text-white':'bg-gray-100 text-black'}`} onClick={() => setForm(prev=>{
                  const cur = prev.titleStyle.textDecoration || 'none';
                  const has = cur.includes('line-through');
                  const next = [has? '': 'line-through', cur.replace('line-through','').trim()].join(' ').trim().replace(/ +/g,' ').trim();
                  return { ...prev, titleStyle: { ...prev.titleStyle, textDecoration: next || 'none' } };
                })}><span style={{textDecoration:'line-through'}}>S</span></button>
                <button type="button" className={`px-2 py-1 rounded border ${(form.titleStyle.textDecoration||'').includes('underline')?'bg-gray-800 text-white':'bg-gray-100 text-black'}`} onClick={() => setForm(prev=>{
                  const cur = prev.titleStyle.textDecoration || 'none';
                  const has = cur.includes('underline');
                  const next = [has? '': 'underline', cur.replace('underline','').trim()].join(' ').trim().replace(/ +/g,' ').trim();
                  return { ...prev, titleStyle: { ...prev.titleStyle, textDecoration: next || 'none' } };
                })}><span style={{textDecoration:'underline'}}>U</span></button>
                <Input type="number" min={12} max={48} value={parseInt(form.titleStyle.fontSize)} onChange={e=> setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, fontSize: `${e.target.value}px` } }))} className="w-20 bg-black text-white border-gray-700" />
                <select className="px-2 py-1 border rounded bg-black text-white border-gray-700" value={form.titleStyle.fontFamily} onChange={e=> setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, fontFamily: e.target.value } }))}>
                  <option value="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">System Default</option>
                  <option value="Arial, Helvetica, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', Times, serif">Times New Roman</option>
                  <option value="'Courier New', Courier, monospace">Courier New</option>
                  <option value="'Montserrat', Arial, sans-serif">Montserrat</option>
                  <option value="'Roboto', Arial, sans-serif">Roboto</option>
                </select>
                <div className="flex items-center gap-2">
                  <Input type="color" value={form.titleStyle.color || '#ffffff'} onChange={e=> setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, color: e.target.value, gradientEnabled: false } }))} className="bg-black" />
                  <div className="flex flex-wrap gap-1">
                    {themeColors.slice(0,24).map((c, i) => (
                      <button key={`t-${i}`} type="button" className="w-5 h-5 rounded border border-gray-700" style={{backgroundColor:c}} onClick={()=> setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, color: c, gradientEnabled: false } }))} title={c} />
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {standardColors.map((c, i) => (
                      <button key={`s-${i}`} type="button" className="w-5 h-5 rounded border border-gray-700" style={{backgroundColor:c}} onClick={()=> setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, color: c, gradientEnabled: false } }))} title={c} />
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.titleStyle.gradientEnabled} onChange={e=> setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, gradientEnabled: e.target.checked } }))} />
                  Gradient
                </label>
                {form.titleStyle.gradientEnabled && (
                  <div className="flex items-center gap-2">
                    <Input type="color" value={form.titleStyle.gradientFrom} onChange={e=> setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, gradientFrom: e.target.value } }))} className="bg-black" />
                    <Input type="color" value={form.titleStyle.gradientTo} onChange={e=> setForm(prev=>({ ...prev, titleStyle: { ...prev.titleStyle, gradientTo: e.target.value } }))} className="bg-black" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Link URL</Label>
              <Input value={form.clickUrl} onChange={e => setForm({ ...form, clickUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div>
              <Label>Image URL</Label>
              <div className="flex items-center gap-2">
                <Input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" />
                <Button type="button" variant="secondary" onClick={() => imageFileInputRef.current?.click()} disabled={uploadingImage} className="shrink-0">Upload</Button>
              </div>
              <input ref={imageFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => uploadFileAndSet('imageUrl', e.target.files?.[0] || undefined)} />
              {uploadingImage && <div className="mt-1 text-xs text-blue-600 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Uploading image…</div>}
            </div>
            <div>
              <Label>Logo URL</Label>
              <div className="flex items-center gap-2">
                <Input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://…" />
                <Button type="button" variant="secondary" onClick={() => logoFileInputRef.current?.click()} disabled={uploadingLogo} className="shrink-0">Upload</Button>
              </div>
              <input ref={logoFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => uploadFileAndSet('logoUrl', e.target.files?.[0] || undefined)} />
              {uploadingLogo && <div className="mt-1 text-xs text-blue-600 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Uploading logo…</div>}
            </div>
            <div>
              <Label>Type (Category)</Label>
              <Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="e.g. electronics" />
            </div>
            <div>
              <Label>View As</Label>
              <Select value={form.viewMode} onValueChange={(v) => setForm({ ...form, viewMode: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose view mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="carousel">Carousel/Slider</SelectItem>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Advertiser ID</Label>
              <Input value={form.advertiserId} onChange={e => setForm({ ...form, advertiserId: e.target.value })} placeholder="Optional for house ads" />
            </div>
            <div>
              <Label>Campaign</Label>
              <Select value={form.campaignId || ''} onValueChange={(v) => {
                if (v === 'none') {
                  setForm({ ...form, campaignId: '', advertiserId: '' });
                  return;
                }
                const selected = campaigns.find((c: any) => String(c.id) === v);
                setForm({
                  ...form,
                  campaignId: v,
                  advertiserId: selected?.advertiserId ? String(selected.advertiserId) : form.advertiserId,
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No campaign</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} (ID {c.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Short Tagline</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short and catchy description" />
              <div className="mt-2 flex flex-wrap gap-2 items-center bg-black text-white p-2 rounded-md">
                <button type="button" className={`px-2 py-1 rounded border ${form.descriptionStyle.fontWeight===700?'bg-gray-800 text-white':'bg-gray-100 text-black'}`} onClick={() => setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, fontWeight: prev.descriptionStyle.fontWeight===700?400:700 } }))}>B</button>
                <button type="button" className={`px-2 py-1 rounded border ${form.descriptionStyle.fontStyle==='italic'?'bg-gray-800 text-white':'bg-gray-100 text-black'}`} onClick={() => setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, fontStyle: prev.descriptionStyle.fontStyle==='italic'?'normal':'italic' } }))}><span style={{fontStyle:'italic'}}>I</span></button>
                <button type="button" className={`px-2 py-1 rounded border ${(form.descriptionStyle.textDecoration||'').includes('line-through')?'bg-gray-800 text-white':'bg-gray-100 text-black'}`} onClick={() => setForm(prev=>{
                  const cur = prev.descriptionStyle.textDecoration || 'none';
                  const has = cur.includes('line-through');
                  const next = [has? '': 'line-through', cur.replace('line-through','').trim()].join(' ').trim().replace(/ +/g,' ').trim();
                  return { ...prev, descriptionStyle: { ...prev.descriptionStyle, textDecoration: next || 'none' } };
                })}><span style={{textDecoration:'line-through'}}>S</span></button>
                <button type="button" className={`px-2 py-1 rounded border ${(form.descriptionStyle.textDecoration||'').includes('underline')?'bg-gray-800 text-white':'bg-gray-100 text-black'}`} onClick={() => setForm(prev=>{
                  const cur = prev.descriptionStyle.textDecoration || 'none';
                  const has = cur.includes('underline');
                  const next = [has? '': 'underline', cur.replace('underline','').trim()].join(' ').trim().replace(/ +/g,' ').trim();
                  return { ...prev, descriptionStyle: { ...prev.descriptionStyle, textDecoration: next || 'none' } };
                })}><span style={{textDecoration:'underline'}}>U</span></button>
                <Input type="number" min={10} max={32} value={parseInt(form.descriptionStyle.fontSize)} onChange={e=> setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, fontSize: `${e.target.value}px` } }))} className="w-20 bg-black text-white border-gray-700" />
                <select className="px-2 py-1 border rounded bg-black text-white border-gray-700" value={form.descriptionStyle.fontFamily} onChange={e=> setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, fontFamily: e.target.value } }))}>
                  <option value="system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif">System Default</option>
                  <option value="Arial, Helvetica, sans-serif">Arial</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', Times, serif">Times New Roman</option>
                  <option value="'Courier New', Courier, monospace">Courier New</option>
                  <option value="'Montserrat', Arial, sans-serif">Montserrat</option>
                  <option value="'Roboto', Arial, sans-serif">Roboto</option>
                </select>
                <div className="flex items-center gap-2">
                  <Input type="color" value={form.descriptionStyle.color || '#ffffff'} onChange={e=> setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, color: e.target.value, gradientEnabled: false } }))} className="bg-black" />
                  <div className="flex flex-wrap gap-1">
                    {themeColors.slice(0,24).map((c, i) => (
                      <button key={`td-${i}`} type="button" className="w-5 h-5 rounded border border-gray-700" style={{backgroundColor:c}} onClick={()=> setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, color: c, gradientEnabled: false } }))} title={c} />
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {standardColors.map((c, i) => (
                      <button key={`sd-${i}`} type="button" className="w-5 h-5 rounded border border-gray-700" style={{backgroundColor:c}} onClick={()=> setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, color: c, gradientEnabled: false } }))} title={c} />
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.descriptionStyle.gradientEnabled} onChange={e=> setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, gradientEnabled: e.target.checked } }))} />
                  Gradient
                </label>
                {form.descriptionStyle.gradientEnabled && (
                  <div className="flex items-center gap-2">
                    <Input type="color" value={form.descriptionStyle.gradientFrom} onChange={e=> setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, gradientFrom: e.target.value } }))} className="bg-black" />
                    <Input type="color" value={form.descriptionStyle.gradientTo} onChange={e=> setForm(prev=>({ ...prev, descriptionStyle: { ...prev.descriptionStyle, gradientTo: e.target.value } }))} className="bg-black" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Button Text</Label>
              <Input value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })} placeholder="e.g. Shop" />
            </div>
            <div>
              <Label>Image Alt Text</Label>
              <Input value={form.imageAlt} onChange={e => setForm({ ...form, imageAlt: e.target.value })} placeholder="e.g. Image description" />
            </div>
            <div>
              <Label>Color Accent</Label>
              <Input type="color" value={form.colorAccent} onChange={e => {
                const v = e.target.value;
                setForm({ ...form, colorAccent: v });
                try { localStorage.setItem('exploreAdColorAccent', v); } catch {}
              }} />
              <div className="mt-2 flex flex-wrap gap-2">
                {colorPalette.map((c, i) => (
                  <button
                    key={`cp-${i}`}
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ ...prev, colorAccent: c }));
                      try { localStorage.setItem('exploreAdColorAccent', c); } catch {}
                    }}
                    className={`w-6 h-6 rounded-full border ${form.colorAccent===c ? 'ring-2 ring-white border-black' : 'border-gray-300'}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>UTM Source</Label>
              <Input value={form.utmSource} onChange={e => setForm({ ...form, utmSource: e.target.value })} placeholder="utm_source" />
            </div>
            <div>
              <Label>UTM Medium</Label>
              <Input value={form.utmMedium} onChange={e => setForm({ ...form, utmMedium: e.target.value })} placeholder="utm_medium" />
            </div>
            <div>
              <Label>UTM Campaign</Label>
              <Input value={form.utmCampaign} onChange={e => setForm({ ...form, utmCampaign: e.target.value })} placeholder="utm_campaign" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Normal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rotation Weight</Label>
              <input type="range" min={0} max={100} value={form.rotationWeight} onChange={e => setForm({ ...form, rotationWeight: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <Label>Publish Date</Label>
              <Input type="date" value={form.publishDate} onChange={e => setForm({ ...form, publishDate: e.target.value })} />
            </div>
            <div>
              <Label>Publish Time</Label>
              <Input type="time" value={form.publishTime} onChange={e => setForm({ ...form, publishTime: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex gap-2">
                {['draft','scheduled','active'].map(s => (
                  <Button key={s} type="button" variant={form.status === s ? undefined : 'outline'} onClick={() => setForm({ ...form, status: s })}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <input type="checkbox" checked={form.pinFirst} onChange={e => setForm({ ...form, pinFirst: e.target.checked })} />
                Pin as First in Carousel
              </Label>
            </div>
            <div className="md:col-span-2">
              <Label>Badges</Label>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                {[
                  {key:'sponsored', label:'Sponsored'},
                  {key:'official', label:'Official'},
                  {key:'isNew', label:'New'},
                  {key:'sale', label:'Sale'},
                  {key:'limited', label:'Limited'},
                  {key:'featured', label:'Featured'}
                ].map(b => (
                  <label key={b.key} className="flex items-center gap-2">
                    <input type="checkbox" checked={(form.badges as any)[b.key]} onChange={e => setForm({ ...form, badges: { ...form.badges, [b.key]: e.target.checked } })} />
                    {b.label}
                  </label>
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className="md:col-span-2 grid md:grid-cols-2 gap-6 mt-4">
              <div>
                <Label>Preview</Label>
                <div className="mt-2 p-4 rounded-xl border bg-gray-900 text-white">
                  <div className="p-6 rounded-xl" style={{
                    background: `linear-gradient(135deg, ${form.colorAccent}, rgba(0,0,0,0.4))`
                  }}>
                    <div className="flex items-center gap-3">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
                      ) : null}
                      <div>
                        <div className="text-3xl" style={{
                          fontWeight: form.titleStyle.fontWeight as any,
                          fontStyle: form.titleStyle.fontStyle as any,
                          textDecoration: form.titleStyle.textDecoration as any,
                          fontSize: form.titleStyle.fontSize,
                          fontFamily: form.titleStyle.fontFamily,
                          ...(form.titleStyle.gradientEnabled ? {
                            backgroundImage: `linear-gradient(135deg, ${form.titleStyle.gradientFrom}, ${form.titleStyle.gradientTo})`,
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                          } : { color: form.titleStyle.color || undefined })
                        }}>{form.title || 'Summer Sale'}</div>
                        <div className="text-gray-200" style={{
                          fontWeight: form.descriptionStyle.fontWeight as any,
                          fontStyle: form.descriptionStyle.fontStyle as any,
                          textDecoration: form.descriptionStyle.textDecoration as any,
                          fontSize: form.descriptionStyle.fontSize,
                          fontFamily: form.descriptionStyle.fontFamily,
                          ...(form.descriptionStyle.gradientEnabled ? {
                            backgroundImage: `linear-gradient(135deg, ${form.descriptionStyle.gradientFrom}, ${form.descriptionStyle.gradientTo})`,
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                          } : { color: form.descriptionStyle.color || undefined })
                        }}>{form.description || 'Short and catchy description'}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(form.badges).map(([key, val]) => val ? (
                        <Badge key={key} variant="secondary" className="bg-indigo-500 text-white">{key === 'isNew' ? 'New' : key[0].toUpperCase()+key.slice(1)}</Badge>
                      ) : null)}
                    </div>
                    <div className="mt-4">
                      <Button className="bg-white text-black hover:bg-gray-100">{form.buttonText || 'Shop'}</Button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label>Schedule & Status</Label>
                <div className="mt-2 p-4 rounded-xl border bg-gray-900 text-white space-y-3">
                  <div className="flex gap-2">
                    <Input type="date" value={form.publishDate} onChange={e => setForm({ ...form, publishDate: e.target.value })} />
                    <Input type="time" value={form.publishTime} onChange={e => setForm({ ...form, publishTime: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    {['draft','scheduled','active'].map(s => (
                      <Button key={s} type="button" variant={form.status === s ? undefined : 'outline'} onClick={() => setForm({ ...form, status: s })}>
                        {s[0].toUpperCase()+s.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <Label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.pinFirst} onChange={e => setForm({ ...form, pinFirst: e.target.checked })} />
                    Pin as First in Carousel
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editingId && (
              <Button type="button" variant="outline" onClick={() => { setEditingId(null); }} className="border-gray-600 text-gray-800 dark:text-gray-200">Cancel Edit</Button>
            )}
            <Button onClick={editingId ? updateExploreAdDirect : addExploreAdDirect} className="bg-blue-600 hover:bg-blue-700">
              {editingId ? 'Update Ad' : 'Publish Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Approved Explore Ads
          </CardTitle>
          <CardDescription>Currently live (config-driven) Explore ads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {exploreAds.length === 0 ? (
            <p className="text-sm text-gray-600">No approved ads yet.</p>
          ) : (
            exploreAds.map((ad: any) => (
              <div key={ad.id} className="p-4 border rounded-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-medium">{ad.title}</span>
                  <div className="text-sm text-gray-600 break-all">{ad.clickUrl}</div>
                  {ad.type && <div className="text-xs text-gray-500">Type: {ad.type}</div>}
                  {ad.viewMode && <div className="text-xs text-gray-500">View: {ad.viewMode}</div>}
                  {ad.source && <Badge variant="outline">{ad.source}</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => startEdit(ad)} variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white">Edit</Button>
                  <Button onClick={() => deleteExploreAd(ad.id)} variant="outline" className="border-red-600 text-red-600">Remove</Button>
                  <a href={ad.clickUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600"><ExternalLink className="w-4 h-4" />Visit</a>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      </TabsContent>
    </Tabs>
  );
}