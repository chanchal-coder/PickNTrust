import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SocialSettingsProps {
  telegramChannelUrl: string;
  facebookPageUrl: string;
  whatsappChannelUrl: string;
  onSave: (settings: {
    telegramChannelUrl: string;
    facebookPageUrl: string;
    whatsappChannelUrl: string;
  }) => void;
}

export default function SocialSettings({ 
  telegramChannelUrl, 
  facebookPageUrl, 
  whatsappChannelUrl, 
  onSave 
}: SocialSettingsProps) {
  const [telegramUrl, setTelegramUrl] = useState(telegramChannelUrl);
  const [facebookUrl, setFacebookUrl] = useState(facebookPageUrl);
  const [whatsappUrl, setWhatsappUrl] = useState(whatsappChannelUrl);
  const { toast } = useToast();

  const handleSave = () => {
    onSave({
      telegramChannelUrl: telegramUrl,
      facebookPageUrl: facebookUrl,
      whatsappChannelUrl: whatsappUrl
    });
    
    toast({
      title: 'Settings Saved!',
      description: 'Social media links have been updated successfully.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-navy dark:text-blue-400">Social Media Settings</CardTitle>
        <CardDescription>
          Configure your social media channel links for sharing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="telegram-channel">Telegram Channel URL</Label>
          <Input
            id="telegram-channel"
            value={telegramUrl}
            onChange={(e) => setTelegramUrl(e.target.value)}
            placeholder="https://t.me/your-channel"
          />
          <p className="text-sm text-gray-500 mt-1">
            Your Telegram channel link for sharing products and blog posts
          </p>
        </div>

        <div>
          <Label htmlFor="facebook-page">Facebook Page URL</Label>
          <Input
            id="facebook-page"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://facebook.com/your-page"
          />
          <p className="text-sm text-gray-500 mt-1">
            Your Facebook page for sharing content
          </p>
        </div>

        <div>
          <Label htmlFor="whatsapp-channel">WhatsApp Channel URL</Label>
          <Input
            id="whatsapp-channel"
            value={whatsappUrl}
            onChange={(e) => setWhatsappUrl(e.target.value)}
            placeholder="https://web.whatsapp.com/channel/your-channel"
          />
          <p className="text-sm text-gray-500 mt-1">
            Your WhatsApp channel for sharing deals and updates
          </p>
        </div>

        <Button onClick={handleSave} className="bg-bright-blue hover:bg-navy">
          Save Social Media Settings
        </Button>
      </CardContent>
    </Card>
  );
}
