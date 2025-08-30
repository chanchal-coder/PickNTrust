import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, Search, Zap, CheckCircle, XCircle } from 'lucide-react';

interface CrawlResult {
  success: boolean;
  domain: string;
  productsFound?: number;
  productsProcessed?: number;
  error?: string;
}

const WebsiteCrawlerAdmin: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [maxProducts, setMaxProducts] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [crawlType, setCrawlType] = useState('auto');
  const [searchKeywords, setSearchKeywords] = useState('');
  const [bulkDomains, setBulkDomains] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [bulkResults, setBulkResults] = useState<any>(null);

  const handleSingleCrawl = async () => {
    if (!domain.trim()) {
      alert('Please enter a domain');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/affiliate/crawl-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain.trim(),
          maxProducts,
          categoryFilter: categoryFilter.trim() || undefined,
          crawlType,
          searchKeywords: searchKeywords.trim() ? searchKeywords.split(',').map(k => k.trim()) : undefined
        }),
      });

      const result = await response.json();
      
      const crawlResult: CrawlResult = {
        success: result.success,
        domain: domain.trim(),
        productsFound: result.data?.productsFound,
        productsProcessed: result.data?.productsProcessed,
        error: result.success ? undefined : result.message
      };

      setResults(prev => [crawlResult, ...prev]);
      
      if (result.success) {
        alert(`✅ Crawl completed! Found ${result.data?.productsFound || 0} products, processed ${result.data?.productsProcessed || 0}`);
      } else {
        alert(`❌ Crawl failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Crawl error:', error);
      alert('❌ Crawl request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCrawl = async () => {
    if (!bulkDomains.trim()) {
      alert('Please enter domains (one per line)');
      return;
    }

    const domains = bulkDomains.trim().split('\n').map(d => d.trim()).filter(d => d);
    
    if (domains.length === 0) {
      alert('Please enter valid domains');
      return;
    }

    setIsBulkLoading(true);
    try {
      const response = await fetch('/api/affiliate/crawl-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domains,
          maxProductsPerSite: maxProducts,
          categoryFilter: categoryFilter.trim() || undefined,
          crawlType
        }),
      });

      const result = await response.json();
      setBulkResults(result);
      
      if (result.success) {
        alert(`✅ Bulk crawl completed! ${result.message}. Total products: ${result.totalProducts}`);
      } else {
        alert(`❌ Bulk crawl failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Bulk crawl error:', error);
      alert('❌ Bulk crawl request failed');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setBulkResults(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🕷️ Website Crawler Admin</h1>
        <p className="text-gray-600">Automatically discover and process products from entire websites</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Website Crawl */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Single Website Crawl
            </CardTitle>
            <CardDescription>
              Crawl a single website and discover products automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="domain">Website Domain</Label>
              <Input
                id="domain"
                placeholder="e.g., amazon.in, myntra.com, flipkart.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxProducts">Max Products</Label>
                <Input
                  id="maxProducts"
                  type="number"
                  min="1"
                  max="100"
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(parseInt(e.target.value) || 20)}
                />
              </div>
              <div>
                <Label htmlFor="crawlType">Crawl Strategy</Label>
                <Select value={crawlType} onValueChange={setCrawlType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Auto (Smart)</SelectItem>
                    <SelectItem value="sitemap">🗺️ Sitemap</SelectItem>
                    <SelectItem value="category">📂 Categories</SelectItem>
                    <SelectItem value="search">🔍 Search</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="categoryFilter">Category Filter (Optional)</Label>
              <Input
                id="categoryFilter"
                placeholder="e.g., electronics, fashion, home"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>

            {crawlType === 'search' && (
              <div>
                <Label htmlFor="searchKeywords">Search Keywords (Comma-separated)</Label>
                <Input
                  id="searchKeywords"
                  placeholder="e.g., laptop, smartphone, headphones"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                />
              </div>
            )}

            <Button 
              onClick={handleSingleCrawl} 
              disabled={isLoading || !domain.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Crawling Website...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Start Crawl
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Website Crawl */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bulk Website Crawl
            </CardTitle>
            <CardDescription>
              Crawl multiple websites simultaneously
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bulkDomains">Website Domains (One per line)</Label>
              <Textarea
                id="bulkDomains"
                placeholder={`amazon.in\nmyntra.com\nflipkart.com\najio.com`}
                value={bulkDomains}
                onChange={(e) => setBulkDomains(e.target.value)}
                rows={6}
              />
            </div>

            <div className="text-sm text-gray-600">
              <p>• Each domain will be crawled with the settings above</p>
              <p>• Max {maxProducts} products per site</p>
              <p>• 2-second delay between sites</p>
            </div>

            <Button 
              onClick={handleBulkCrawl} 
              disabled={isBulkLoading || !bulkDomains.trim()}
              className="w-full"
              variant="secondary"
            >
              {isBulkLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bulk Crawling...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Start Bulk Crawl
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {(results.length > 0 || bulkResults) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Crawl Results</CardTitle>
              <CardDescription>Recent crawling activity and results</CardDescription>
            </div>
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </CardHeader>
          <CardContent>
            {/* Bulk Results */}
            {bulkResults && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">📊 Bulk Crawl Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{bulkResults.results?.length || 0}</div>
                    <div className="text-sm text-gray-600">Sites Crawled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {bulkResults.results?.filter((r: any) => r.success).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{bulkResults.totalProducts || 0}</div>
                    <div className="text-sm text-gray-600">Total Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((bulkResults.totalProducts || 0) / (bulkResults.results?.length || 1))}
                    </div>
                    <div className="text-sm text-gray-600">Avg per Site</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {bulkResults.results?.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{result.domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <Badge variant="secondary">
                            {result.productsProcessed || 0} products
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Results */}
            {results.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">🔍 Individual Crawls</h3>
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{result.domain}</div>
                        {result.error && (
                          <div className="text-sm text-red-600">{result.error}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {result.success ? (
                        <div className="space-y-1">
                          <Badge variant="secondary">
                            Found: {result.productsFound || 0}
                          </Badge>
                          <Badge variant="default">
                            Processed: {result.productsProcessed || 0}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 How to Use Website Crawler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🎯 Single Website Crawl</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Enter just the domain (e.g., amazon.in)</li>
                <li>• Choose crawl strategy (Auto is recommended)</li>
                <li>• Set max products to discover</li>
                <li>• Optionally filter by category</li>
                <li>• Products are automatically processed through affiliate engine</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚡ Bulk Website Crawl</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Enter multiple domains (one per line)</li>
                <li>• Same settings apply to all sites</li>
                <li>• 2-second delay between sites</li>
                <li>• Perfect for processing competitor sites</li>
                <li>• All products go through commission optimization</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold mb-2">🚀 Pro Tips</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• <strong>Auto Strategy:</strong> Tries sitemap → categories → homepage automatically</li>
              <li>• <strong>Sitemap Strategy:</strong> Fastest, uses sitemap.xml for product discovery</li>
              <li>• <strong>Category Strategy:</strong> Crawls category pages for targeted products</li>
              <li>• <strong>Search Strategy:</strong> Uses site search with your keywords</li>
              <li>• Products are automatically categorized and optimized for highest commissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebsiteCrawlerAdmin;