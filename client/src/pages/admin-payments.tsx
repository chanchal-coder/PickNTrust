import React from 'react';
import { useLocation } from 'wouter';

type GatewayAccount = {
  id: number;
  gateway: 'stripe' | 'razorpay' | 'bank';
  name?: string;
  publishable_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  bank_account_holder?: string;
  bank_name_branch?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  upi_vpa?: string;
  upi_qr_url?: string;
  instructions?: string;
  is_active: number;
};

export default function AdminPaymentsPage() {
  const [accounts, setAccounts] = React.useState<GatewayAccount[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [gateway, setGateway] = React.useState<'stripe' | 'razorpay' | 'bank'>('stripe');
  const [form, setForm] = React.useState<any>({ name: '' });
  const [, navigate] = useLocation();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/payments/gateways');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const payload: any = { gateway, ...form };
      const res = await fetch('/api/payments/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add account');
      setForm({ name: '' });
      await fetchAccounts();
    } catch (e: any) {
      setError(e?.message || 'Failed to add account');
    } finally {
      setLoading(false);
    }
  };

  const activate = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/payments/gateways/${id}/activate`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate account');
      await fetchAccounts();
    } catch (e: any) {
      setError(e?.message || 'Failed to activate');
    } finally {
      setLoading(false);
    }
  };

  const grouped = React.useMemo(() => {
    return {
      stripe: accounts.filter(a => a.gateway === 'stripe'),
      razorpay: accounts.filter(a => a.gateway === 'razorpay'),
      bank: accounts.filter(a => a.gateway === 'bank')
    };
  }, [accounts]);

  const renderFormFields = () => {
    if (gateway === 'stripe') {
      return (
        <>
          <Input label="Account Name" value={form.name || ''} onChange={(v)=>setForm((f:any)=>({...f, name:v}))} />
          <Input label="Publishable Key" value={form.publishable_key || ''} onChange={(v)=>setForm((f:any)=>({...f, publishable_key:v}))} />
          <Input label="Secret Key" value={form.secret_key || ''} onChange={(v)=>setForm((f:any)=>({...f, secret_key:v}))} />
          <Input label="Webhook Secret" value={form.webhook_secret || ''} onChange={(v)=>setForm((f:any)=>({...f, webhook_secret:v}))} />
        </>
      );
    }
    if (gateway === 'razorpay') {
      return (
        <>
          <Input label="Account Name" value={form.name || ''} onChange={(v)=>setForm((f:any)=>({...f, name:v}))} />
          <Input label="Key ID" value={form.publishable_key || ''} onChange={(v)=>setForm((f:any)=>({...f, publishable_key:v}))} />
          <Input label="Key Secret" value={form.secret_key || ''} onChange={(v)=>setForm((f:any)=>({...f, secret_key:v}))} />
          <Input label="Webhook Secret" value={form.webhook_secret || ''} onChange={(v)=>setForm((f:any)=>({...f, webhook_secret:v}))} />
        </>
      );
    }
    return (
      <>
        <Input label="Account Name" value={form.name || ''} onChange={(v)=>setForm((f:any)=>({...f, name:v}))} />
        <Input label="Bank Account Holder" value={form.bank_account_holder || ''} onChange={(v)=>setForm((f:any)=>({...f, bank_account_holder:v}))} />
        <Input label="Bank & Branch" value={form.bank_name_branch || ''} onChange={(v)=>setForm((f:any)=>({...f, bank_name_branch:v}))} />
        <Input label="Account Number" value={form.bank_account_number || ''} onChange={(v)=>setForm((f:any)=>({...f, bank_account_number:v}))} />
        <Input label="IFSC" value={form.bank_ifsc || ''} onChange={(v)=>setForm((f:any)=>({...f, bank_ifsc:v}))} />
        <Input label="UPI VPA" value={form.upi_vpa || ''} onChange={(v)=>setForm((f:any)=>({...f, upi_vpa:v}))} />
        <Input label="UPI QR URL" value={form.upi_qr_url || ''} onChange={(v)=>setForm((f:any)=>({...f, upi_qr_url:v}))} />
        <Textarea label="Instructions" value={form.instructions || ''} onChange={(v)=>setForm((f:any)=>({...f, instructions:v}))} />
      </>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Payments</h1>
        <button
          onClick={() => navigate('/admin')}
          className="px-3 py-2 text-sm rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700"
        >Back to Admin</button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <section className="mb-8 border rounded p-4">
        <h2 className="text-lg font-medium mb-4">Add Payment Account</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex gap-3">
            {(['stripe','razorpay','bank'] as const).map(gw => (
              <button
                key={gw}
                type="button"
                onClick={() => setGateway(gw)}
                className={`px-3 py-2 rounded text-sm ${gateway===gw ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700'}`}
              >{gw.toUpperCase()}</button>
            ))}
          </div>
          {renderFormFields()}
          <div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.is_active} onChange={(e)=>setForm((f:any)=>({...f, is_active: e.target.checked}))} />
              Set as active
            </label>
          </div>
          <button disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">{loading? 'Saving...' : 'Save Account'}</button>
        </form>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {(['stripe','razorpay','bank'] as const).map(gw => (
          <div key={gw} className="border rounded p-4">
            <h3 className="font-semibold mb-3">{gw.toUpperCase()} Accounts</h3>
            <div className="space-y-3">
              {grouped[gw].length === 0 && (
                <div className="text-sm text-gray-500">No accounts added.</div>
              )}
              {grouped[gw].map(acc => (
                <div key={acc.id} className={`border rounded p-3 ${acc.is_active ? 'border-green-500' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">{acc.name || `Account #${acc.id}`}</div>
                      <div className="text-xs text-gray-500">{acc.is_active ? 'Active' : 'Inactive'}</div>
                    </div>
                    {!acc.is_active && (
                      <button onClick={() => activate(acc.id)} className="text-sm px-3 py-1 rounded bg-green-600 text-white">Activate</button>
                    )}
                  </div>
                  {gw !== 'bank' ? (
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Publishable/Key ID: {acc.publishable_key || '-'}</div>
                      <div>Secret Key: {acc.secret_key ? '••••••' : '-'}</div>
                      {acc.webhook_secret && <div>Webhook: ••••••</div>}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Holder: {acc.bank_account_holder || '-'}</div>
                      <div>Bank & Branch: {acc.bank_name_branch || '-'}</div>
                      <div>Account: {acc.bank_account_number || '-'}</div>
                      <div>IFSC: {acc.bank_ifsc || '-'}</div>
                      <div>UPI: {acc.upi_vpa || '-'}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        className="w-full border rounded px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 placeholder:text-gray-600 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <textarea
        className="w-full border rounded px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 placeholder:text-gray-600 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}