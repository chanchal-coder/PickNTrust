import { useEffect, useState } from 'react';
import { getAdminPassword } from '@/config/admin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

export default function TelegramPublishToggle() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [envEnabled, setEnvEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/admin/telegram/publish-settings');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed to load settings');
      setEnabled(Boolean(data?.publishEnabled));
      setEnvEnabled(Boolean(data?.envFallback));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(nextEnabled: boolean) {
    setSaving(true);
    setError(null);
    try {
      const resp = await fetch('/api/admin/telegram/publish-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': getAdminPassword(),
        },
        body: JSON.stringify({ publishEnabled: nextEnabled, password: getAdminPassword() }),
      });
      const data = await resp.json();
      if (!resp.ok || data?.success === false) {
        throw new Error(data?.message || 'Failed to update settings');
      }
      setEnabled(Boolean(data?.publishEnabled));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Telegram Publishing
        </CardTitle>
        <CardDescription>
          Toggle whether Telegram posts are saved to `unified_content`.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Telegram publishing</p>
              <p className="text-sm text-gray-600">
                Admin toggle stored in DB. Env fallback: {envEnabled ? 'enabled' : 'disabled'}
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={(v) => saveSettings(Boolean(v))} disabled={saving} />
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings} disabled={loading}>Refresh</Button>
          <Button onClick={() => saveSettings(!enabled)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}