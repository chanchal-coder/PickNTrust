import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UniversalPageLayout from '@/components/UniversalPageLayout';
import { AnnouncementBanner } from '@/components/announcement-banner';
import PageBanner from '@/components/PageBanner';
import WidgetRenderer from '@/components/WidgetRenderer';

export default function AffiliateTrackerPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [generatedLink, setGeneratedLink] = useState<string>('');

  const { data: networks = [] } = useQuery({
    queryKey: ['/api/affiliate-networks/active']
  });

  const generateTrackingLink = () => {
    if (!selectedNetwork || !baseUrl) return;

    const network = (networks as any[]).find((n: any) => n.id.toString() === selectedNetwork);
    if (!network || !network.trackingParams) return;

    const separator = baseUrl.includes('?') ? '&' : '?';
    const trackingLink = `${baseUrl}${separator}${network.trackingParams}`;
    setGeneratedLink(trackingLink);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <UniversalPageLayout pageId="affiliate-tracker">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <WidgetRenderer page="affiliate-tracker" position="header-top" />
            <AnnouncementBanner />
            <PageBanner page="affiliate-tracker" />
            <WidgetRenderer page="affiliate-tracker" position="header-bottom" />
            <div className="header-spacing">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-navy dark:text-blue-400 mb-8">Affiliate Link Generator</h1>
                
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Link Generator */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-navy dark:text-blue-400">Generate Tracking Link</CardTitle>
                      <CardDescription>
                        Create properly formatted affiliate links with tracking parameters
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="network">Select Affiliate Network</Label>
                        <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose network" />
                          </SelectTrigger>
                          <SelectContent>
                            {(networks as any[]).map((network: any) => (
                              <SelectItem key={network.id} value={network.id.toString()}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{network.name}</span>
                                  <Badge variant="secondary" className="ml-2">
                                    {network.commissionRate}%
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
      
                      <div>
                        <Label htmlFor="baseUrl">Product URL</Label>
                        <Input
                          id="baseUrl"
                          value={baseUrl}
                          onChange={(e) => setBaseUrl(e.target.value)}
                          placeholder="https://amazon.in/dp/B08N5WRWNW"
                        />
                      </div>
      
                      <Button 
                        onClick={generateTrackingLink}
                        disabled={!selectedNetwork || !baseUrl}
                        className="w-full bg-bright-blue hover:bg-navy"
                      >
                        Generate Tracking Link
                      </Button>
      
                      {generatedLink && (
                        <div className="space-y-2">
                          <Label>Generated Affiliate Link</Label>
                          <div className="flex gap-2">
                            <Input
                              value={generatedLink}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              onClick={() => copyToClipboard(generatedLink)}
                              variant="outline"
                              size="sm"
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
      
                  {/* Network Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-navy dark:text-blue-400">Available Networks</CardTitle>
                      <CardDescription>
                        Your active affiliate partnerships and commission rates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(networks as any[]).map((network: any) => (
                          <div key={network.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{network.name}</h4>
                              <Badge variant="default">
                                {network.commissionRate}% commission
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {network.description}
                            </p>
      
                            {network.trackingParams && (
                              <div className="text-xs">
                                <span className="text-gray-500">Tracking: </span>
                                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                                  {network.trackingParams}
                                </code>
                              </div>
                            )}
      
                            {network.joinUrl && (
                              <a 
                                href={network.joinUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-bright-blue hover:underline mt-2 inline-block"
                              >
                                Join Network →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
      
                      {(networks as any[]).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No active affiliate networks found.
                          <br />
                          Visit the admin panel to set up networks.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
      
                {/* Best Practices */}
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="text-navy dark:text-blue-400">Affiliate Link Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-navy dark:text-blue-400 mb-3">Link Creation</h4>
                        <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                          <li>• Always use network-specific tracking parameters</li>
                          <li>• Test links before publishing to ensure they work</li>
                          <li>• Use shortened URLs for better user experience</li>
                          <li>• Include proper disclosure on all affiliate content</li>
                        </ul>
                      </div>
      
                      <div>
                        <h4 className="font-semibold text-navy dark:text-blue-400 mb-3">Performance Tracking</h4>
                        <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                          <li>• Monitor click-through rates by network</li>
                          <li>• Track conversion rates and earnings</li>
                          <li>• A/B test different link placements</li>
                          <li>• Focus on networks with highest conversions</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
    </UniversalPageLayout>
  );
}